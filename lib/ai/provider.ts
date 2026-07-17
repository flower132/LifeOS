import "server-only";

import {
  AIErrorCode,
  AIImageInput,
  AIProviderId,
  AITokenUsage,
} from "./types";

// ---------------------------------------------------------------------------
// Unified server-side provider interface.
//
// Every provider (DeepSeek today; Claude / OpenAI / Gemini reserved) MUST
// implement this exact shape. The router only ever talks to AIProviderV2 —
// adding a provider never changes router or business code.
// ---------------------------------------------------------------------------

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIGenerateParams {
  prompt: string;
  systemPrompt?: string;
  images?: AIImageInput[];
  temperature: number;
  maxTokens: number;
  jsonMode: boolean;
}

export interface AIChatParams {
  messages: AIChatMessage[];
  images?: AIImageInput[];
  temperature: number;
  maxTokens: number;
  jsonMode: boolean;
}

export interface AIProviderResult {
  content: string;
  usage: AITokenUsage;
}

export interface AIProviderV2 {
  readonly id: AIProviderId;
  /** Single-turn generation (system + user prompt). */
  generate(model: string, params: AIGenerateParams): Promise<AIProviderResult>;
  /** Multi-turn chat completion. */
  chat(model: string, params: AIChatParams): Promise<AIProviderResult>;
  /** Streaming — reserved. */
  stream(model: string, params: AIGenerateParams): Promise<unknown>;
  /** Embeddings — reserved. */
  embedding(model: string, input: string[]): Promise<number[][]>;
  /** Summarization helper — optional convenience over generate(). */
  summary?(model: string, params: AIGenerateParams): Promise<AIProviderResult>;
}

/**
 * Unified server-side provider error. The /api/ai route converts this into
 * the public unified error object; raw provider responses never leave the
 * server.
 */
export class AIProviderError extends Error {
  readonly code: AIErrorCode;
  readonly status?: number;

  constructor(code: AIErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
    this.status = status;
  }
}

/** Map an upstream HTTP status to a unified error code. */
export function errorCodeForStatus(status: number): AIErrorCode {
  if (status === 401 || status === 403) return "invalid_key";
  if (status === 404) return "model_not_found";
  if (status === 429) return "rate_limit";
  return "provider_error";
}

/**
 * Extract the outermost JSON object/array from free-form model output.
 * Prefers fenced ```json blocks; falls back to balanced-brace scanning.
 */
export function extractJson(text: string): string {
  const cleaned = text.trim();

  // Prefer fenced json blocks.
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }

  // Find the outermost balanced JSON object or array.
  let firstBrace = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{" || cleaned[i] === "[") {
      firstBrace = i;
      break;
    }
  }
  if (firstBrace === -1) return cleaned;

  const openChar = cleaned[firstBrace];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = firstBrace; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return cleaned.slice(firstBrace, i + 1);
      }
    }
  }

  // Fallback: return from first brace to end if unable to balance.
  return cleaned.slice(firstBrace);
}
