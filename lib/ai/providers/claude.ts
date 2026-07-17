import "server-only";

import { AITokenUsage } from "../types";
import {
  AIGenerateParams,
  AIChatParams,
  AIProvider,
  AIProviderError,
  AIProviderResult,
  errorCodeForStatus,
  extractJson,
  notSupported,
} from "../provider";

// ---------------------------------------------------------------------------
// Claude provider — code-ready, disabled until keyed.
//
// Reserved surface per architecture: chat / vision / file / artifact. Chat
// and vision are wired via the Messages API; file/artifact return controlled
// NotSupported results until wired.
//
// Enable: set ANTHROPIC_API_KEY in the server environment.
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://api.anthropic.com/v1";
const REQUEST_TIMEOUT_MS = 60_000;
const ANTHROPIC_VERSION = "2023-06-01";

const SYSTEM_PROMPT =
  "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.";

type ClaudeContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        data: string;
      };
    };

interface ClaudeMessagesResponse {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new AIProviderError(
      "invalid_key",
      "ANTHROPIC_API_KEY is not configured on the server"
    );
  }
  return key;
}

function getBaseUrl(): string {
  return process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL;
}

function toImageBlock(img: {
  mimeType: string;
  base64Data: string;
}): ClaudeContentBlock {
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: img.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      data: img.base64Data,
    },
  };
}

async function callMessages(
  model: string,
  messages: { role: "user" | "assistant"; content: string | ClaudeContentBlock[] }[],
  system: string,
  params: { temperature: number; maxTokens: number; jsonMode: boolean }
): Promise<AIProviderResult> {
  const apiKey = getApiKey();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens,
        system,
        messages,
        temperature: params.temperature,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIProviderError(
        "timeout",
        `Claude request timed out after ${REQUEST_TIMEOUT_MS}ms`
      );
    }
    throw new AIProviderError(
      "network",
      `Network error while calling Claude: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[ai] Claude error ${response.status}: ${text.slice(0, 500)}`);
    throw new AIProviderError(
      errorCodeForStatus(response.status),
      `Claude API error (HTTP ${response.status})`,
      response.status
    );
  }

  const data = (await response.json()) as ClaudeMessagesResponse;
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) {
    throw new AIProviderError("provider_error", "Empty response from Claude");
  }

  const promptTokens = data.usage?.input_tokens ?? 0;
  const completionTokens = data.usage?.output_tokens ?? 0;
  const usage: AITokenUsage = {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };

  return { content: params.jsonMode ? extractJson(text) : text, usage };
}

function singleTurn(
  model: string,
  params: AIGenerateParams,
  withImages: boolean
): Promise<AIProviderResult> {
  const content: string | ClaudeContentBlock[] =
    withImages && params.images && params.images.length > 0
      ? [...params.images.map(toImageBlock), { type: "text" as const, text: params.prompt }]
      : params.prompt;
  return callMessages(
    model,
    [{ role: "user", content }],
    params.systemPrompt ?? SYSTEM_PROMPT,
    params
  );
}

export const claudeProvider: AIProvider = {
  id: "claude",

  chat(model: string, params: AIChatParams): Promise<AIProviderResult> {
    let system = SYSTEM_PROMPT;
    const messages: { role: "user" | "assistant"; content: string | ClaudeContentBlock[] }[] = [];
    for (const m of params.messages) {
      if (m.role === "system") {
        system = m.content;
        continue;
      }
      messages.push({ role: m.role, content: m.content });
    }
    // Attach images to the final user message.
    if (params.images && params.images.length > 0 && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "user") {
        messages[messages.length - 1] = {
          role: "user",
          content: [
            ...params.images.map(toImageBlock),
            { type: "text" as const, text: String(last.content) },
          ],
        };
      }
    }
    return callMessages(model, messages, system, params);
  },

  vision(model: string, params: AIGenerateParams): Promise<AIProviderResult> {
    if (!params.images || params.images.length === 0) {
      return Promise.reject(
        new AIProviderError("validation", "vision() requires images")
      );
    }
    return singleTurn(model, params, true);
  },

  embedding(): Promise<number[][]> {
    return Promise.reject(notSupported("Claude", "embedding"));
  },

  summarize(model: string, params: AIGenerateParams): Promise<AIProviderResult> {
    return singleTurn(model, params, Boolean(params.images?.length));
  },

  extract(model: string, params: AIGenerateParams): Promise<AIProviderResult> {
    return singleTurn(model, params, Boolean(params.images?.length));
  },

  analyze(model: string, params: AIGenerateParams): Promise<AIProviderResult> {
    return singleTurn(model, params, Boolean(params.images?.length));
  },

  transcribe(): Promise<AIProviderResult> {
    return Promise.reject(notSupported("Claude", "transcribe"));
  },
};
