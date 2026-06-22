export type Language = "zh" | "en";

export type AIProviderId =
  | "mock"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "kimi"
  | "gemini"
  | "openrouter"
  | "siliconflow"
  | "ollama"
  | "custom";

export interface AIProviderConfig {
  provider: AIProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AIProvider {
  generate(prompt: string): Promise<string>;
}

export type AIErrorCode =
  | "invalid_key"
  | "model_not_found"
  | "rate_limit"
  | "network"
  | "cors"
  | "mixed_content"
  | "json_parse"
  | "timeout"
  | "unknown";

export interface AIInsightResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: AIErrorCode;
  provider: AIProviderId;
  model: string;
  durationMs: number;
  fallback?: boolean;
}

export interface AIUsageLog {
  id: string;
  timestamp: string;
  provider: AIProviderId;
  model: string;
  durationMs: number;
  status: "success" | "error";
  error?: string;
  errorCode?: AIErrorCode;
}

export interface AITestResult {
  success: boolean;
  message?: string;
  error?: string;
  errorCode?: AIErrorCode;
  provider: AIProviderId;
  model: string;
  durationMs: number;
}

export const DEFAULT_PROVIDER_CONFIGS: Record<
  AIProviderId,
  { baseUrl: string; model: string }
> = {
  mock: { baseUrl: "", model: "mock" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-sonnet-4-6-20251001",
  },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  kimi: { baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.5-flash",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
  },
  siliconflow: {
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "Qwen/Qwen2.5-7B-Instruct",
  },
  ollama: { baseUrl: "http://localhost:11434/api", model: "llama3.1" },
  custom: { baseUrl: "", model: "" },
};

export function isValidAIProviderId(value: string): value is AIProviderId {
  return value in DEFAULT_PROVIDER_CONFIGS;
}

// AI output types are re-exported from schemas to keep a single source of truth.
export type {
  SelfInsight,
  PersonInsight,
  EventGoalInsight,
} from "./schemas";
