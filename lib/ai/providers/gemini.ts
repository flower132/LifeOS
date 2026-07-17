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
// Gemini provider — code-ready, disabled until keyed.
//
// Reserved surface per architecture: chat / vision / file / imageUnderstand.
// Chat and vision are wired via generateContent; file upload returns a
// controlled NotSupported result until wired.
//
// Enable: set GEMINI_API_KEY in the server environment.
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT =
  "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.";

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GeminiGenerateResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new AIProviderError(
      "invalid_key",
      "GEMINI_API_KEY is not configured on the server"
    );
  }
  return key;
}

function getBaseUrl(): string {
  return process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL;
}

async function generateContent(
  model: string,
  parts: GeminiPart[],
  params: { temperature: number; maxTokens: number; jsonMode: boolean }
): Promise<AIProviderResult> {
  const apiKey = getApiKey();
  const url = `${getBaseUrl()}/models/${model}:generateContent?key=${apiKey}`;

  const generationConfig: Record<string, unknown> = {
    temperature: params.temperature,
    maxOutputTokens: params.maxTokens,
  };
  if (params.jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIProviderError(
        "timeout",
        `Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`
      );
    }
    throw new AIProviderError(
      "network",
      `Network error while calling Gemini: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[ai] Gemini error ${response.status}: ${text.slice(0, 500)}`);
    throw new AIProviderError(
      errorCodeForStatus(response.status),
      `Gemini API error (HTTP ${response.status})`,
      response.status
    );
  }

  const data = (await response.json()) as GeminiGenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new AIProviderError("provider_error", "Empty response from Gemini");
  }

  const usage: AITokenUsage = {
    promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
  };

  return { content: params.jsonMode ? extractJson(text) : text, usage };
}

function singleTurn(
  model: string,
  params: AIGenerateParams,
  withImages: boolean
): Promise<AIProviderResult> {
  const system = params.systemPrompt ?? SYSTEM_PROMPT;
  const parts: GeminiPart[] = [{ text: `${system}\n\n${params.prompt}` }];
  if (withImages && params.images) {
    parts.push(
      ...params.images.map((img) => ({
        inlineData: { mimeType: img.mimeType, data: img.base64Data },
      }))
    );
  }
  return generateContent(model, parts, params);
}

export const geminiProvider: AIProvider = {
  id: "gemini",

  chat(model: string, params: AIChatParams): Promise<AIProviderResult> {
    const transcript = params.messages
      .map((m) => `${m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System"}: ${m.content}`)
      .join("\n\n");
    const parts: GeminiPart[] = [{ text: transcript }];
    if (params.images) {
      parts.push(
        ...params.images.map((img) => ({
          inlineData: { mimeType: img.mimeType, data: img.base64Data },
        }))
      );
    }
    return generateContent(model, parts, params);
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
    return Promise.reject(notSupported("Gemini", "embedding"));
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
    return Promise.reject(notSupported("Gemini", "transcribe"));
  },
};
