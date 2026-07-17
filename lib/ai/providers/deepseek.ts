import "server-only";

import { AITokenUsage } from "../types";
import {
  AIChatMessage,
  AIChatParams,
  AIGenerateParams,
  AIProviderError,
  AIProviderResult,
  AIProviderV2,
  errorCodeForStatus,
  extractJson,
} from "../provider";

const DEFAULT_BASE_URL = "https://api.deepseek.com/v1";
const REQUEST_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT =
  "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.";

interface DeepSeekChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * DeepSeek provider (OpenAI-compatible Chat Completions API).
 *
 * The API key is read exclusively from process.env.DEEPSEEK_API_KEY on the
 * server — it is never shipped to the browser.
 */
class DeepSeekProvider implements AIProviderV2 {
  readonly id = "deepseek" as const;

  private getApiKey(): string {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) {
      throw new AIProviderError(
        "invalid_key",
        "DEEPSEEK_API_KEY is not configured on the server"
      );
    }
    return key;
  }

  private getBaseUrl(): string {
    return process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL;
  }

  async generate(
    model: string,
    params: AIGenerateParams
  ): Promise<AIProviderResult> {
    const messages: AIChatMessage[] = [
      { role: "system", content: params.systemPrompt ?? SYSTEM_PROMPT },
      { role: "user", content: params.prompt },
    ];
    return this.chatCompletion(model, messages, params);
  }

  async chat(model: string, params: AIChatParams): Promise<AIProviderResult> {
    return this.chatCompletion(model, params.messages, params);
  }

  private async chatCompletion(
    model: string,
    messages: AIChatMessage[],
    params: {
      images?: AIGenerateParams["images"];
      temperature: number;
      maxTokens: number;
      jsonMode: boolean;
    }
  ): Promise<AIProviderResult> {
    if (params.images && params.images.length > 0) {
      throw new AIProviderError(
        "provider_error",
        `Model ${model} does not support vision input`
      );
    }

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    };
    if (params.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    // Resolve the key BEFORE the fetch try/catch so a missing key surfaces as
    // invalid_key rather than being misclassified as a network error.
    const apiKey = this.getApiKey();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
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
          `DeepSeek request timed out after ${REQUEST_TIMEOUT_MS}ms`
        );
      }
      throw new AIProviderError(
        "network",
        `Network error while calling DeepSeek: ${
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
        `[ai] DeepSeek error ${response.status}: ${text.slice(0, 500)}`
      );
      throw new AIProviderError(
        errorCodeForStatus(response.status),
        `DeepSeek API error (HTTP ${response.status})`,
        response.status
      );
    }

    const data = (await response.json()) as DeepSeekChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new AIProviderError("provider_error", "Empty response from DeepSeek");
    }

    const usage: AITokenUsage = {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    };

    return { content: params.jsonMode ? extractJson(content) : content, usage };
  }

  async stream(): Promise<never> {
    throw new AIProviderError("not_implemented", "Not Implemented");
  }

  async embedding(): Promise<never> {
    throw new AIProviderError("not_implemented", "Not Implemented");
  }
}

export const deepseekProvider = new DeepSeekProvider();
