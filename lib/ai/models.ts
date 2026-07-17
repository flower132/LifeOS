import "server-only";

import { AITask, AIProviderId } from "./types";

// ---------------------------------------------------------------------------
// Model catalog — the ONLY place model names appear.
//
// The router never hardcodes models: it resolves task → RouteRule → ModelInfo
// → provider. Adding Claude / GPT / Gemini later means adding catalog entries
// and pointing tasks at them — zero business-code changes.
// ---------------------------------------------------------------------------

export interface ModelInfo {
  provider: Exclude<AIProviderId, "mock" | "server">;
  model: string;
  /** Hard cap for completion tokens. */
  maxTokens: number;
  supportsVision: boolean;
  supportsJsonMode: boolean;
  costTier: "low" | "medium" | "high";
}

export const MODEL_CATALOG: Record<string, ModelInfo> = {
  // --- Implemented (DeepSeek) ---
  "deepseek-chat": {
    provider: "deepseek",
    model: "deepseek-chat",
    maxTokens: 8192,
    supportsVision: false,
    supportsJsonMode: true,
    costTier: "low",
  },
  "deepseek-reasoner": {
    provider: "deepseek",
    model: "deepseek-reasoner",
    maxTokens: 8192,
    supportsVision: false,
    supportsJsonMode: false,
    costTier: "medium",
  },
  // --- Reserved (providers throw not_implemented until wired up) ---
  "claude-sonnet": {
    provider: "claude",
    model: "claude-sonnet-4-6",
    maxTokens: 8192,
    supportsVision: true,
    supportsJsonMode: false,
    costTier: "medium",
  },
  "claude-opus": {
    provider: "claude",
    model: "claude-opus-4-8",
    maxTokens: 16384,
    supportsVision: true,
    supportsJsonMode: false,
    costTier: "high",
  },
  "gpt-4.1-mini": {
    provider: "openai",
    model: "gpt-4.1-mini",
    maxTokens: 8192,
    supportsVision: true,
    supportsJsonMode: true,
    costTier: "low",
  },
  "gemini-2.5-flash": {
    provider: "gemini",
    model: "gemini-2.5-flash",
    maxTokens: 8192,
    supportsVision: true,
    supportsJsonMode: true,
    costTier: "low",
  },
};

export interface RouteRule {
  /** Key into MODEL_CATALOG. */
  model: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_RULE: RouteRule = {
  model: "deepseek-chat",
  temperature: 0.5,
  maxTokens: 4096,
};

/**
 * Task → model routing table. This is the single knob for re-routing a
 * capability to another provider/model (e.g. REFLECTION → claude-sonnet).
 */
export const TASK_ROUTING: Record<AITask, RouteRule> = {
  HEALTH_CHECK: { model: "deepseek-chat", temperature: 0, maxTokens: 16 },
  OBJECT_ANALYSIS: { model: "deepseek-chat", temperature: 0.2, maxTokens: 4096 },
  OBJECT_UPDATE: { model: "deepseek-chat", temperature: 0.2, maxTokens: 4096 },
  PERSON_UPDATE: { model: "deepseek-chat", temperature: 0.2, maxTokens: 4096 },
  EXTRACTION: { model: "deepseek-chat", temperature: 0.1, maxTokens: 4096 },
  IMPORT_CLASSIFY: { model: "deepseek-chat", temperature: 0.1, maxTokens: 2048 },
  TODAY_FOCUS: { model: "deepseek-chat", temperature: 0.4, maxTokens: 2048 },
  REFLECTION: { model: "deepseek-chat", temperature: 0.5, maxTokens: 2048 },
  REMINDER: { model: "deepseek-chat", temperature: 0.4, maxTokens: 1024 },
  WEEKLY_REVIEW: { model: "deepseek-chat", temperature: 0.4, maxTokens: 4096 },
  MONTHLY_STORY: { model: "deepseek-chat", temperature: 0.6, maxTokens: 4096 },
  PATTERN: { model: "deepseek-chat", temperature: 0.2, maxTokens: 4096 },
  TODAY_STORY: { model: "deepseek-chat", temperature: 0.5, maxTokens: 2048 },
  MEMORY_UNDERSTANDING: { model: "deepseek-chat", temperature: 0.2, maxTokens: 2048 },
  RELATIONSHIP: { model: "deepseek-chat", temperature: 0.4, maxTokens: 4096 },
  WORKSPACE: { model: "deepseek-chat", temperature: 0.4, maxTokens: 2048 },
  // Reserved tasks — routed, but no call sites yet.
  CHAT: DEFAULT_RULE,
  CONVERSATION: DEFAULT_RULE,
  SUMMARY: DEFAULT_RULE,
  SEARCH: { model: "deepseek-chat", temperature: 0.2, maxTokens: 2048 },
};
