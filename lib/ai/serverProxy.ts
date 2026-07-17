import {
  AIClientError,
  AIGenerateOptions,
  AIImageInput,
  AIProvider,
  AIServerRequest,
  AIServerResponse,
  AIStructuredGenerationRequest,
  AITask,
  AITokenUsage,
} from "./types";
import { addAILog } from "./logs";
import { getSerializedContext } from "./context";

// ---------------------------------------------------------------------------
// Client → server bridge. This is the ONLY module in the product allowed to
// fetch /api/ai. It normalizes every failure into AIClientError (unified
// error codes) and feeds the settings-page log viewer via addAILog.
//
// Context Engine hook: every outgoing request automatically carries the
// serialized LifeOS context (built from local stores) unless the caller
// supplied one — business code never thinks about context.
// ---------------------------------------------------------------------------

export interface AIResponseMeta {
  provider: string;
  model: string;
  usage: AITokenUsage;
  latency: number;
  cached: boolean;
  sources?: import("./types").AIContextSource[];
}

export interface AIProxyResult {
  content: string;
  meta: AIResponseMeta;
}

const ZERO_USAGE: AITokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

/** Attach Context Engine output to the request (client-side only). */
function withContext(request: AIServerRequest): AIServerRequest {
  if (request.context !== undefined || typeof window === "undefined") {
    return request;
  }
  try {
    const serialized = getSerializedContext({
      task: request.task,
      objectId: request.contextHint?.objectId,
      query: request.contextHint?.query,
    });
    if (!serialized) return request;
    return {
      ...request,
      context: serialized.block,
      contextSources: serialized.sources,
    };
  } catch (err) {
    // Context is best-effort: never fail an AI call because of it.
    console.warn("[ai] Context Engine failed, continuing without context:", err);
    return request;
  }
}

export async function postAI(request: AIServerRequest): Promise<AIProxyResult> {
  const start = now();
  const finalRequest = withContext(request);

  let response: Response;
  try {
    response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalRequest),
    });
  } catch (err) {
    // fetch itself failed (offline, DNS, server down): synthesize the unified
    // network error so pages still see exactly one error type.
    const durationMs = elapsed(start);
    const error = new AIClientError(
      "network",
      `Network error while reaching the AI service: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    addAILog({
      provider: "server",
      model: "",
      durationMs,
      status: "error",
      error: error.message,
      errorCode: error.code,
    });
    throw error;
  }

  let body: AIServerResponse;
  try {
    body = (await response.json()) as AIServerResponse;
  } catch {
    const durationMs = elapsed(start);
    const error = new AIClientError(
      "provider_error",
      `AI service returned an unreadable response (HTTP ${response.status})`
    );
    addAILog({
      provider: "server",
      model: "",
      durationMs,
      status: "error",
      error: error.message,
      errorCode: error.code,
    });
    throw error;
  }

  if (!body.success) {
    addAILog({
      provider: body.provider ?? "server",
      model: body.model ?? "",
      durationMs: body.latency ?? elapsed(start),
      status: "error",
      error: body.error.message,
      errorCode: body.error.code,
    });
    throw new AIClientError(body.error.code, body.error.message, {
      provider: body.provider,
      model: body.model,
    });
  }

  addAILog({
    provider: body.provider,
    model: body.model,
    durationMs: body.latency,
    status: "success",
  });

  return {
    content: body.content,
    meta: {
      provider: body.provider,
      model: body.model,
      usage: body.usage ?? ZERO_USAGE,
      latency: body.latency,
      cached: body.cached,
      sources: body.sources,
    },
  };
}

/**
 * A legacy-AIProvider-compatible object whose generation methods all route
 * through /api/ai for the given task. Engines keep calling
 * generateStructuredObject(); only the implementation behind it changed.
 *
 * `lastMeta` carries provider/model/usage of the most recent call so engines
 * can stamp results and logs with real metadata (falls back to "unknown"
 * before the first successful call).
 */
export interface ServerTaskProvider extends AIProvider {
  readonly task: AITask;
  lastMeta: AIResponseMeta | null;
}

export function createServerTaskProvider(task: AITask): ServerTaskProvider {
  async function run(input: {
    prompt: string;
    images?: AIImageInput[];
    options?: AIGenerateOptions;
    contextHint?: AIStructuredGenerationRequest["contextHint"];
  }): Promise<string> {
    const { content, meta } = await postAI({
      task,
      prompt: input.prompt,
      images: input.images,
      options: input.options,
      contextHint: input.contextHint,
    });
    provider.lastMeta = meta;
    return content;
  }

  const provider: ServerTaskProvider = {
    task,
    lastMeta: null,
    generate(prompt: string): Promise<string> {
      return run({ prompt });
    },
    generateWithImages(prompt: string, images: AIImageInput[]): Promise<string> {
      return run({ prompt, images });
    },
    generateStructuredObject(
      request: AIStructuredGenerationRequest
    ): Promise<string> {
      return run({
        prompt: request.prompt,
        images: request.images,
        options: {
          schemaHint: request.schemaHint,
          objectType: request.objectType,
        },
        contextHint: request.contextHint,
      });
    },
  };

  return provider;
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function elapsed(start: number): number {
  return Math.round(now() - start);
}
