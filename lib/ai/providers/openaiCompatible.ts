import "server-only";

import { AITokenUsage } from "../types";
import {
  AIChatMessage,
  AIGenerateParams,
  AIChatParams,
  AIProvider,
  AIProviderError,
  AIProviderResult,
  errorCodeForStatus,
  extractJson,
  notSupported,
} from "../provider";
import { RoutableProviderId } from "../models";

// ---------------------------------------------------------------------------
// Shared base for OpenAI-compatible Chat Completions APIs
// (DeepSeek / Kimi / OpenAI). Protocol differences live in the config;
// capability gaps are reported as controlled NotSupported results.
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 60_000;

const DEFAULT_SYSTEM_PROMPT =
  "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.";

export interface OpenAICompatibleConfig {
  id: RoutableProviderId;
  /** Human-readable name for error messages. */
  label: string;
  defaultBaseUrl: string;
  /** Optional env var overriding defaultBaseUrl. */
  baseUrlEnv?: string;
  /** Env vars tried in order for the API key. */
  apiKeyEnv: string[];
  /** Whether vision requests (image_url parts) are wired for this provider. */
  supportsVisionRequests: boolean;
}

type MessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export function createOpenAICompatibleProvider(
  config: OpenAICompatibleConfig
): AIProvider {
  function getApiKey(): string {
    for (const envName of config.apiKeyEnv) {
      const key = process.env[envName];
      if (key) return key;
    }
    throw new AIProviderError(
      "invalid_key",
      `${config.apiKeyEnv[0]} is not configured on the server`
    );
  }

  function getBaseUrl(): string {
    return (config.baseUrlEnv && process.env[config.baseUrlEnv]) || config.defaultBaseUrl;
  }

  function buildUserContent(
    prompt: string,
    images?: AIGenerateParams["images"]
  ): MessageContent {
    if (!images || images.length === 0) return prompt;
    return [
      { type: "text", text: prompt },
      ...images.map((img) => ({
        type: "image_url" as const,
        image_url: { url: `data:${img.mimeType};base64,${img.base64Data}` },
      })),
    ];
  }

  async function chatCompletion(
    model: string,
    messages: AIChatMessage[],
    params: {
      temperature: number;
      maxTokens: number;
      jsonMode: boolean;
      tools?: unknown[];
    }
  ): Promise<AIProviderResult> {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    };
    if (params.jsonMode) {
      body.response_format = { type: "json_object" };
    }
    if (params.tools && params.tools.length > 0) {
      body.tools = params.tools;
    }

    // Resolve the key BEFORE the fetch try/catch so a missing key surfaces as
    // invalid_key rather than being misclassified as a network error.
    const apiKey = getApiKey();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${getBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new AIProviderError(
          "timeout",
          `${config.label} request timed out after ${REQUEST_TIMEOUT_MS}ms`
        );
      }
      throw new AIProviderError(
        "network",
        `Network error while calling ${config.label}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      // Raw provider payload stays server-side (logged), never returned.
      console.error(
        `[ai] ${config.label} error ${response.status}: ${text.slice(0, 500)}`
      );
      throw new AIProviderError(
        errorCodeForStatus(response.status),
        `${config.label} API error (HTTP ${response.status})`,
        response.status
      );
    }

    let data: ChatCompletionResponse;
    try {
      data = (await response.json()) as ChatCompletionResponse;
    } catch {
      throw new AIProviderError(
        "provider_error",
        `${config.label} returned an unreadable response`
      );
    }
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new AIProviderError(
        "provider_error",
        `Empty response from ${config.label}`
      );
    }

    const usage: AITokenUsage = {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    };

    return { content: params.jsonMode ? extractJson(content) : content, usage };
  }

  function singleTurn(
    model: string,
    params: AIGenerateParams,
    images?: AIGenerateParams["images"]
  ): Promise<AIProviderResult> {
    if (images && images.length > 0 && !config.supportsVisionRequests) {
      return Promise.reject(notSupported(config.label, "vision"));
    }
    const messages: AIChatMessage[] = [
      { role: "system", content: params.systemPrompt ?? DEFAULT_SYSTEM_PROMPT },
      { role: "user", content: buildUserContent(params.prompt, images) as string },
    ];
    return chatCompletion(model, messages, params);
  }

  return {
    id: config.id,

    chat(model: string, params: AIChatParams): Promise<AIProviderResult> {
      if (
        params.images &&
        params.images.length > 0 &&
        !config.supportsVisionRequests
      ) {
        return Promise.reject(notSupported(config.label, "vision"));
      }
      const messages: AIChatMessage[] = params.messages.map((m, i) => {
        // Attach images to the final user message, OpenAI-style.
        if (
          m.role === "user" &&
          i === params.messages.length - 1 &&
          params.images &&
          params.images.length > 0
        ) {
          return { ...m, content: buildUserContent(m.content, params.images) as string };
        }
        return m;
      });
      return chatCompletion(model, messages, params);
    },

    vision(model: string, params: AIGenerateParams): Promise<AIProviderResult> {
      if (!config.supportsVisionRequests) {
        return Promise.reject(notSupported(config.label, "vision"));
      }
      if (!params.images || params.images.length === 0) {
        return Promise.reject(
          new AIProviderError("validation", "vision() requires images")
        );
      }
      return singleTurn(model, params, params.images);
    },

    embedding(): Promise<number[][]> {
      return Promise.reject(notSupported(config.label, "embedding"));
    },

    summarize(model: string, params: AIGenerateParams): Promise<AIProviderResult> {
      return singleTurn(model, params, params.images);
    },

    extract(model: string, params: AIGenerateParams): Promise<AIProviderResult> {
      return singleTurn(model, params, params.images);
    },

    analyze(model: string, params: AIGenerateParams): Promise<AIProviderResult> {
      return singleTurn(model, params, params.images);
    },

    transcribe(): Promise<AIProviderResult> {
      return Promise.reject(notSupported(config.label, "transcribe"));
    },
  };
}
