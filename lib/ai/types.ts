import { LifeObjectType } from "@/lib/types";

export type Language = "zh" | "en";

/**
 * Provider identifiers known to the AI infrastructure.
 *
 * Only "deepseek" is fully enabled today; "kimi" / "gemini" / "openai" /
 * "claude" are code-complete and activate the moment their env API key is
 * configured. "mock" is the client-side offline provider. "server" is used in
 * logs when the actual provider is resolved by the server router.
 */
export type AIProviderId =
  | "mock"
  | "deepseek"
  | "kimi"
  | "gemini"
  | "openai"
  | "claude"
  | "server";

/**
 * Capabilities a model/provider can support. The Capability Matrix
 * (lib/ai/models.ts) declares these per model; the router checks them before
 * dispatching and degrades automatically when unsupported.
 */
export type AICapability =
  | "chat"
  | "vision"
  | "file"
  | "audio"
  | "reasoning"
  | "longContext"
  | "toolCalling"
  | "embedding";

/**
 * AI Tasks — the ONLY way business code refers to AI capabilities.
 *
 * Business code always passes a task, never a model name. The server-side
 * router (lib/ai/router.ts + lib/ai/models.ts) maps each task to a concrete
 * provider + model, so swapping "reflection" from DeepSeek to Claude later is
 * a one-line change in TASK_ROUTING with zero business-code edits.
 */
export const AITASKS = [
  // Infrastructure
  "HEALTH_CHECK",
  // Object intelligence
  "OBJECT_ANALYSIS",
  "OBJECT_UPDATE",
  "PERSON_UPDATE",
  "EXTRACTION",
  "IMPORT_CLASSIFY",
  // Daily companion
  "TODAY_FOCUS",
  "REFLECTION",
  "REMINDER",
  "WEEKLY_REVIEW",
  "MONTHLY_STORY",
  // Intelligence
  "PATTERN",
  "TODAY_STORY",
  "MEMORY_UNDERSTANDING",
  // Advisor
  "RELATIONSHIP",
  "WORKSPACE",
  // Reserved for future features (no call sites yet)
  "CHAT",
  "CONVERSATION",
  "SUMMARY",
  "SEARCH",
] as const;

export type AITask = (typeof AITASKS)[number];

export function isAITask(value: unknown): value is AITask {
  return typeof value === "string" && (AITASKS as readonly string[]).includes(value);
}

export interface AIImageInput {
  mimeType: string; // e.g. "image/jpeg" / "image/png"
  base64Data: string; // without data URI prefix
}

/**
 * Request for structured object generation.
 * Engine only uses this shape; providers decide how to enforce JSON output.
 */
export interface AIStructuredGenerationRequest {
  prompt: string;
  images?: AIImageInput[];
  /** Human-readable schema hint or JSON-schema string describing the expected output. */
  schemaHint?: string;
  /** The target LifeObjectType, used by the mock provider to return a type-safe shape. */
  objectType?: LifeObjectType;
  /**
   * Optional hints for the Context Engine: which object is being discussed
   * and what the user is asking. Used to retrieve relevant memories.
   */
  contextHint?: AIContextHint;
}

/** Hints guiding the Context Engine's retrieval (see lib/ai/context). */
export interface AIContextHint {
  objectId?: string;
  query?: string;
}

/** A citable origin of injected context, echoed back for source transparency. */
export interface AIContextSource {
  kind: "memory" | "note" | "object" | "relation" | "insight" | "goal" | "profile";
  id: string;
  /** Short human-readable preview (e.g. first 60 chars). */
  label: string;
  date?: string;
}

/**
 * Legacy client-side provider interface implemented by the mock provider and
 * by the server proxy (lib/ai/serverProxy.ts). Engines keep calling this
 * shape; the implementation behind it now routes through /api/ai.
 */
export interface AIProvider {
  generate(prompt: string): Promise<string>;
  generateWithImages?(prompt: string, images: AIImageInput[]): Promise<string>;
  /** Structured generation used by ObjectIntelligenceEngine. */
  generateStructuredObject(request: AIStructuredGenerationRequest): Promise<string>;
  supportsVision?: boolean;
}

export type AIErrorCode =
  | "network"
  | "provider_error"
  | "rate_limit"
  | "timeout"
  | "invalid_key"
  | "quota_exceeded"
  | "validation"
  | "not_supported"
  | "model_not_found"
  | "json_parse"
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

/**
 * Result returned by ObjectIntelligenceEngine after a single analysis run.
 * Generic so the engine can be typed to AIAnalysisResult when imported.
 */
export interface AIAnalysisRunResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: AIErrorCode;
  provider: AIProviderId;
  model: string;
  durationMs: number;
  /** True when the result was produced by the mock provider as a fallback. */
  fallback: boolean;
  /** Raw provider output retained for debugging and history. */
  rawOutput?: string;
  /** ID of the persisted AI analysis history entry, if any. */
  historyEntryId?: string;
}

export interface AIUsageLog {
  id: string;
  timestamp: string;
  /** Free-form: historical entries may contain retired provider ids. */
  provider: string;
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
  provider: string;
  model: string;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Client ↔ Server contract (POST /api/ai)
// ---------------------------------------------------------------------------

export interface AIGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  /** Defaults to true — providers respond with a JSON object. */
  jsonMode?: boolean;
  /** Embedded into the system prompt as the expected output shape. */
  schemaHint?: string;
  /** Metadata only — recorded in usage logs. */
  objectType?: string;
}

export interface AIServerRequest {
  task: AITask;
  /** Required for every task except HEALTH_CHECK. */
  prompt?: string;
  images?: AIImageInput[];
  options?: AIGenerateOptions;
  /**
   * Serialized LifeOS context block (built client-side by the Context
   * Engine), injected into the system prompt by the server router.
   */
  context?: string;
  /** Origins of the context block, echoed back in the response. */
  contextSources?: AIContextSource[];
  /** Context Engine hints used when `context` is not supplied. */
  contextHint?: AIContextHint;
  /** Reserved for future Supabase session forwarding. */
  sessionToken?: string;
}

export interface AITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIServerSuccess {
  success: true;
  content: string;
  usage: AITokenUsage;
  provider: string;
  model: string;
  latency: number;
  cached: boolean;
  /** Sources of the injected context, for output transparency. */
  sources?: AIContextSource[];
}

export interface AIServerFailure {
  success: false;
  error: { code: AIErrorCode; message: string };
  provider?: string;
  model?: string;
  latency: number;
}

export type AIServerResponse = AIServerSuccess | AIServerFailure;

/**
 * The single error type pages/engines ever handle. Produced by the client
 * facade from unified server errors (or a synthesized `network` error when
 * fetch("/api/ai") itself fails).
 */
export class AIClientError extends Error {
  readonly code: AIErrorCode;
  readonly provider?: string;
  readonly model?: string;

  constructor(
    code: AIErrorCode,
    message: string,
    meta?: { provider?: string; model?: string }
  ) {
    super(message);
    this.name = "AIClientError";
    this.code = code;
    this.provider = meta?.provider;
    this.model = meta?.model;
  }
}

/** True when the value carries a unified AI error code. */
export function hasAIErrorCode(value: unknown): value is { code: AIErrorCode } {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code: unknown }).code === "string"
  );
}
