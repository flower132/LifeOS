import "server-only";

import { AICapability, AITask, AIProviderId } from "./types";

// ---------------------------------------------------------------------------
// Model Registry + Capability Matrix — the ONLY place model names and model
// capabilities appear. Everything is configuration:
//
//   - New model?     Add one MODEL_REGISTRY entry.
//   - Re-route a task? Edit one TASK_ROUTING line.
//   - New fallback?  Edit FALLBACK_MODELS.
//
// The router never hardcodes a model: task → RouteRule → ModelInfo → provider.
// ---------------------------------------------------------------------------

export type RoutableProviderId = Exclude<AIProviderId, "mock" | "server">;

export interface ModelInfo {
  provider: RoutableProviderId;
  /** Upstream model identifier sent to the provider API. */
  model: string;
  /** Hard cap for completion tokens. */
  maxTokens: number;
  /** Total context window in tokens. */
  contextWindow: number;
  /** Capability Matrix row for this model. */
  capabilities: AICapability[];
  costTier: "low" | "medium" | "high";
}

export const MODEL_REGISTRY: Record<string, ModelInfo> = {
  // ── DeepSeek (active) ─────────────────────────────────────────────────
  "deepseek-chat": {
    provider: "deepseek",
    model: "deepseek-chat",
    maxTokens: 8192,
    contextWindow: 64_000,
    capabilities: ["chat", "toolCalling"],
    costTier: "low",
  },
  "deepseek-reasoner": {
    provider: "deepseek",
    model: "deepseek-reasoner",
    maxTokens: 8192,
    contextWindow: 64_000,
    capabilities: ["chat", "reasoning"],
    costTier: "medium",
  },
  // ── Kimi (key-ready) ──────────────────────────────────────────────────
  "kimi-k2": {
    provider: "kimi",
    model: "kimi-k2-0711-preview",
    maxTokens: 8192,
    contextWindow: 131_072,
    capabilities: ["chat", "longContext", "toolCalling"],
    costTier: "low",
  },
  "kimi-thinking": {
    provider: "kimi",
    model: "kimi-thinking-preview",
    maxTokens: 8192,
    contextWindow: 131_072,
    capabilities: ["chat", "reasoning", "longContext"],
    costTier: "medium",
  },
  // ── Gemini (key-ready) ────────────────────────────────────────────────
  "gemini-2.5-pro": {
    provider: "gemini",
    model: "gemini-2.5-pro",
    maxTokens: 8192,
    contextWindow: 1_000_000,
    capabilities: ["chat", "vision", "file", "longContext"],
    costTier: "high",
  },
  "gemini-2.5-flash": {
    provider: "gemini",
    model: "gemini-2.5-flash",
    maxTokens: 8192,
    contextWindow: 1_000_000,
    capabilities: ["chat", "vision", "file", "longContext"],
    costTier: "low",
  },
  // ── OpenAI (key-ready) ────────────────────────────────────────────────
  "gpt-5": {
    provider: "openai",
    model: "gpt-5",
    maxTokens: 16384,
    contextWindow: 400_000,
    capabilities: ["chat", "vision", "file", "audio", "reasoning", "toolCalling"],
    costTier: "high",
  },
  "gpt-5-mini": {
    provider: "openai",
    model: "gpt-5-mini",
    maxTokens: 8192,
    contextWindow: 400_000,
    capabilities: ["chat", "vision", "toolCalling"],
    costTier: "low",
  },
  // ── Claude (key-ready) ────────────────────────────────────────────────
  "claude-sonnet": {
    provider: "claude",
    model: "claude-sonnet-4-6",
    maxTokens: 8192,
    contextWindow: 200_000,
    capabilities: ["chat", "vision", "file", "toolCalling"],
    costTier: "medium",
  },
  "claude-opus": {
    provider: "claude",
    model: "claude-opus-4-8",
    maxTokens: 16384,
    contextWindow: 200_000,
    capabilities: ["chat", "vision", "file", "reasoning", "toolCalling"],
    costTier: "high",
  },
};

/** Capability Matrix lookup: does this model support the capability? */
export function modelSupports(modelKey: string, capability: AICapability): boolean {
  return MODEL_REGISTRY[modelKey]?.capabilities.includes(capability) ?? false;
}

/** Debug/observability view of the full Capability Matrix. */
export function capabilityMatrix(): Record<string, Record<AICapability, boolean>> {
  const allCaps: AICapability[] = [
    "chat", "vision", "file", "audio", "reasoning", "longContext", "toolCalling", "embedding",
  ];
  return Object.fromEntries(
    Object.entries(MODEL_REGISTRY).map(([key, info]) => [
      key,
      Object.fromEntries(allCaps.map((cap) => [cap, info.capabilities.includes(cap)])) as Record<
        AICapability,
        boolean
      >,
    ])
  );
}

// ---------------------------------------------------------------------------
// Task routing configuration
// ---------------------------------------------------------------------------

export interface RouteRule {
  /** Key into MODEL_REGISTRY. */
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
 * Task → model routing table. The single knob for re-routing a capability to
 * another provider/model — the ops console of the AI layer.
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
  MEMORY_EXTRACT: { model: "deepseek-chat", temperature: 0.1, maxTokens: 2048 },
  OBJECT_PROFILE: { model: "deepseek-chat", temperature: 0.3, maxTokens: 4096 },
  PERSON_ADVICE: { model: "deepseek-chat", temperature: 0.4, maxTokens: 4096 },
  RELATIONSHIP: { model: "deepseek-chat", temperature: 0.4, maxTokens: 4096 },
  WORKSPACE: { model: "deepseek-chat", temperature: 0.4, maxTokens: 2048 },
  // Reserved tasks — routed, but no call sites yet.
  CHAT: DEFAULT_RULE,
  CONVERSATION: DEFAULT_RULE,
  SUMMARY: DEFAULT_RULE,
  SEARCH: { model: "deepseek-chat", temperature: 0.2, maxTokens: 2048 },
};

/**
 * Task → provider method. Image-bearing requests are always upgraded to
 * "vision" by the router regardless of this table.
 */
export const TASK_METHOD: Record<
  AITask,
  "chat" | "analyze" | "extract" | "summarize"
> = {
  HEALTH_CHECK: "chat",
  OBJECT_ANALYSIS: "analyze",
  OBJECT_UPDATE: "analyze",
  PERSON_UPDATE: "analyze",
  EXTRACTION: "extract",
  IMPORT_CLASSIFY: "extract",
  TODAY_FOCUS: "analyze",
  REFLECTION: "chat",
  REMINDER: "chat",
  WEEKLY_REVIEW: "analyze",
  MONTHLY_STORY: "chat",
  PATTERN: "analyze",
  TODAY_STORY: "chat",
  MEMORY_UNDERSTANDING: "analyze",
  MEMORY_EXTRACT: "extract",
  OBJECT_PROFILE: "analyze",
  PERSON_ADVICE: "analyze",
  RELATIONSHIP: "analyze",
  WORKSPACE: "analyze",
  CHAT: "chat",
  CONVERSATION: "chat",
  SUMMARY: "summarize",
  SEARCH: "analyze",
};

/**
 * Automatic degradation order per required capability. When the routed model
 * lacks the capability (or its provider is disabled / not plan-allowed), the
 * router walks this list and picks the first usable model.
 */
export const FALLBACK_MODELS: Record<string, string[]> = {
  vision: ["gpt-5-mini", "gemini-2.5-flash", "claude-sonnet"],
  reasoning: ["deepseek-reasoner", "kimi-thinking", "claude-opus"],
  longContext: ["gemini-2.5-flash", "kimi-k2", "claude-sonnet"],
  chat: ["deepseek-chat", "kimi-k2", "gpt-5-mini", "gemini-2.5-flash", "claude-sonnet"],
};
