import { z } from "zod";

import { AITASKS, AIErrorCode, AIServerResponse } from "@/lib/ai/types";
import { AIProviderError } from "@/lib/ai/provider";
import { executeTask } from "@/lib/ai/router";
import { canUse, consume, restore } from "@/lib/ai/quota";
import { recordUsage } from "@/lib/ai/usage";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// The single AI entry point for the entire product.
//
// Client → POST /api/ai → quota → router → provider → model → unified result.
// Clients may pass a task + prompt only — never provider, model, baseUrl, key.
// ---------------------------------------------------------------------------

const MAX_IMAGES = 4;
const MAX_IMAGE_BASE64_CHARS = 2_500_000; // ~1.9 MB binary per image
const MAX_TOTAL_IMAGE_CHARS = 3_500_000; // stays under the ~4.5 MB body limit

const requestSchema = z.object({
  task: z.enum(AITASKS),
  prompt: z.string().min(1).max(100_000).optional(),
  images: z
    .array(
      z.object({
        mimeType: z.string().min(1).max(100),
        base64Data: z.string().min(1).max(MAX_IMAGE_BASE64_CHARS),
      })
    )
    .max(MAX_IMAGES)
    .optional(),
  options: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().positive().max(16384).optional(),
      jsonMode: z.boolean().optional(),
      schemaHint: z.string().max(4_000).optional(),
      objectType: z.string().max(50).optional(),
    })
    .optional(),
  sessionToken: z.string().optional(),
});

function statusForErrorCode(code: AIErrorCode): number {
  switch (code) {
    case "validation":
      return 400;
    case "invalid_key":
      return 401;
    case "quota_exceeded":
    case "rate_limit":
      return 429;
    case "not_supported":
      return 501;
    case "timeout":
      return 504;
    case "provider_error":
    case "network":
      return 502;
    default:
      return 500;
  }
}

function failure(
  code: AIErrorCode,
  message: string,
  latency: number,
  meta?: { provider?: string; model?: string }
): Response {
  const body: AIServerResponse = {
    success: false,
    error: { code, message },
    provider: meta?.provider,
    model: meta?.model,
    latency,
  };
  return Response.json(body, { status: statusForErrorCode(code) });
}

export async function POST(request: Request): Promise<Response> {
  const start = Date.now();

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return failure("validation", "Request body must be valid JSON", elapsed(start));
  }

  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return failure(
      "validation",
      `Invalid AI request: ${parsed.error.issues[0]?.message ?? "schema mismatch"}`,
      elapsed(start)
    );
  }

  const { task, images, options } = parsed.data;
  // HEALTH_CHECK uses a server-side canned prompt; everything else requires
  // the client-built prompt.
  const prompt = task === "HEALTH_CHECK" ? "Reply OK" : parsed.data.prompt;
  if (!prompt) {
    return failure("validation", "prompt is required for this task", elapsed(start));
  }

  const totalImageChars = (images ?? []).reduce(
    (sum, img) => sum + img.base64Data.length,
    0
  );
  if (totalImageChars > MAX_TOTAL_IMAGE_CHARS) {
    return failure(
      "validation",
      "Total image payload exceeds the request size limit",
      elapsed(start)
    );
  }

  // User identity: no server auth yet — reserved for Supabase session wiring.
  const userId = "local";

  if (!canUse(userId, task)) {
    return failure(
      "quota_exceeded",
      "Daily AI quota exceeded. Please try again tomorrow.",
      elapsed(start)
    );
  }

  let providerId: string | undefined;
  let model: string | undefined;

  try {
    const result = await executeTask({ task, prompt, images, options });
    providerId = result.providerId;
    model = result.model;

    const latency = elapsed(start);
    consume(userId, task);
    await recordUsage({
      userId,
      timestamp: new Date().toISOString(),
      task,
      provider: result.providerId,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      latency,
      success: true,
    });

    const body: AIServerResponse = {
      success: true,
      content: result.content,
      usage: result.usage,
      provider: result.providerId,
      model: result.model,
      latency,
      cached: false,
    };
    return Response.json(body, { status: 200 });
  } catch (err) {
    const latency = elapsed(start);
    restore(userId, task);

    const code: AIErrorCode =
      err instanceof AIProviderError ? err.code : "unknown";
    const message =
      err instanceof AIProviderError
        ? err.message
        : "Unexpected AI infrastructure error";
    if (!(err instanceof AIProviderError)) {
      console.error("[ai] Unexpected route error:", err);
    }

    await recordUsage({
      userId,
      timestamp: new Date().toISOString(),
      task,
      provider: providerId ?? "unknown",
      model: model ?? "unknown",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latency,
      success: false,
      errorCode: code,
    });

    return failure(code, message, latency, { provider: providerId, model });
  }
}

function elapsed(start: number): number {
  return Date.now() - start;
}
