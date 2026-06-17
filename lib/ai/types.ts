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

export const DEFAULT_PROVIDER_CONFIGS: Record<
  AIProviderId,
  { baseUrl: string; model: string }
> = {
  mock: { baseUrl: "", model: "mock" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-5-sonnet-latest",
  },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  kimi: { baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-1.5-flash",
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
