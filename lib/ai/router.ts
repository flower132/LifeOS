import "server-only";

import { AICapability, AITask, AIImageInput, AITokenUsage } from "./types";
import {
  FALLBACK_MODELS,
  MODEL_REGISTRY,
  ModelInfo,
  RoutableProviderId,
  TASK_METHOD,
  TASK_ROUTING,
} from "./models";
import { getProvider, isProviderEnabled, primaryKeyEnv } from "./registry";
import { getCurrentPlan, getPlanConfig, planAllowsModel } from "./plans";
import { recordUsage } from "./usage";
import {
  AIGenerateParams,
  AIProvider,
  AIProviderError,
  AIProviderResult,
} from "./provider";

// ---------------------------------------------------------------------------
// Router — the ONLY place tasks are resolved to providers/models, and the
// only code that invokes providers. It never hardcodes a model name:
//
//   task → TASK_METHOD (provider method) → Capability Matrix check
//        → plan filter (plans.ts) → enabled-provider filter (registry.ts)
//        → automatic degradation (FALLBACK_MODELS) → provider call
//
// Business code sends tasks; swapping models/providers is configuration only.
// ---------------------------------------------------------------------------

export type ProviderMethod = "chat" | "vision" | "analyze" | "extract" | "summarize";

const METHOD_CAPABILITY: Record<ProviderMethod, AICapability> = {
  chat: "chat",
  vision: "vision",
  analyze: "chat",
  extract: "chat",
  summarize: "chat",
};

export interface AIExecuteInput {
  task: AITask;
  prompt: string;
  images?: AIImageInput[];
  /** Serialized LifeOS context block from the client Context Engine. */
  context?: string;
  /** Caller identity for usage records; defaults to "local". */
  userId?: string;
  /** 预留：会话 / 多轮对话维度（透传到 Usage）。 */
  sessionId?: string;
  conversationId?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    schemaHint?: string;
    objectType?: string;
  };
}

export interface AIExecuteOutput {
  content: string;
  usage: AITokenUsage;
  providerId: RoutableProviderId;
  model: string;
}

const BASE_SYSTEM_PROMPT =
  "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.";

/** Hard server-side cap on injected context (chars). */
const MAX_CONTEXT_CHARS = 40_000;

function buildSystemPrompt(schemaHint?: string): string {
  if (!schemaHint) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}\n\nExpected output shape:\n${schemaHint}`;
}

/**
 * Context Engine injection point: the user's life context becomes part of
 * the system prompt, so the model answers from LifeOS data — and is told to
 * be honest when the data is insufficient.
 */
function withLifeContext(systemPrompt: string, context?: string): string {
  if (!context || !context.trim()) return systemPrompt;
  const trimmed = context.slice(0, MAX_CONTEXT_CHARS);
  return `${systemPrompt}

以下是用户的人生上下文（LifeOS Context）：
${trimmed}

请基于这些信息回答。不要编造。如果信息不足，请如实说明。`;
}

/** Image-bearing requests always require the vision capability. */
function requiredMethod(task: AITask, images?: AIImageInput[]): ProviderMethod {
  if (images && images.length > 0) return "vision";
  return TASK_METHOD[task] ?? "chat";
}

interface ResolvedModel {
  modelKey: string;
  info: ModelInfo;
}

/**
 * Pick the best usable model for a task+capability:
 * routed model first, then FALLBACK_MODELS — filtered by Capability Matrix,
 * plan allowance, and provider enabled-ness (env key present).
 */
function resolveModel(task: AITask, capability: AICapability): ResolvedModel {
  const rule = TASK_ROUTING[task];
  if (!rule) {
    throw new AIProviderError("validation", `No routing rule for task: ${task}`);
  }

  const plan = getCurrentPlan();
  const candidates = [
    rule.model,
    ...(FALLBACK_MODELS[capability] ?? FALLBACK_MODELS.chat),
  ];

  let primaryBlockedByMissingKey: ModelInfo | undefined;

  for (const modelKey of candidates) {
    const info = MODEL_REGISTRY[modelKey];
    if (!info) continue;
    if (!info.capabilities.includes(capability)) continue;
    if (!planAllowsModel(modelKey, plan)) continue;
    if (!isProviderEnabled(info.provider)) {
      if (modelKey === rule.model) primaryBlockedByMissingKey = info;
      continue;
    }
    return { modelKey, info };
  }

  // The routed model fits but its provider has no key: report invalid_key so
  // ops/users get an actionable error instead of a generic NotSupported.
  if (primaryBlockedByMissingKey) {
    throw new AIProviderError(
      "invalid_key",
      `${primaryKeyEnv(primaryBlockedByMissingKey.provider)} is not configured on the server`
    );
  }

  throw new AIProviderError(
    "not_supported",
    `No enabled provider supports "${capability}" for task ${task} under plan "${plan}". ` +
      `Configure a provider API key or adjust TASK_ROUTING / plan config.`
  );
}

function invoke(
  provider: AIProvider,
  method: ProviderMethod,
  model: string,
  params: AIGenerateParams
): Promise<AIProviderResult> {
  switch (method) {
    case "vision":
      return provider.vision(model, params);
    case "analyze":
      return provider.analyze(model, params);
    case "extract":
      return provider.extract(model, params);
    case "summarize":
      return provider.summarize(model, params);
    case "chat":
    default:
      return provider.chat(model, {
        messages: [
          { role: "system", content: params.systemPrompt ?? BASE_SYSTEM_PROMPT },
          { role: "user", content: params.prompt },
        ],
        images: params.images,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        jsonMode: params.jsonMode,
      });
  }
}

/**
 * Execute an AI task end to end: resolve → capability/degradation → invoke.
 * Throws AIProviderError (unified codes) on failure; never leaks raw
 * provider errors.
 *
 * Every execution — success or failure — is recorded by the Usage layer.
 * Business code never records usage itself.
 */
export async function executeTask(input: AIExecuteInput): Promise<AIExecuteOutput> {
  const start = Date.now();
  const usageMeta = {
    userId: input.userId ?? "local",
    task: input.task,
    sessionId: input.sessionId,
    conversationId: input.conversationId,
  };

  let provider = "unknown";
  let model = "unknown";

  try {
    const method = requiredMethod(input.task, input.images);
    const capability = METHOD_CAPABILITY[method];
    const { info } = resolveModel(input.task, capability);
    provider = info.provider;
    model = info.model;

    const rule = TASK_ROUTING[input.task];
    const plan = getPlanConfig();
    const aiProvider = getProvider(info.provider);

    const params: AIGenerateParams = {
      prompt: input.prompt,
      systemPrompt:
        input.task === "HEALTH_CHECK"
          ? buildSystemPrompt(input.options?.schemaHint)
          : withLifeContext(
              buildSystemPrompt(input.options?.schemaHint),
              input.context
            ),
      images: input.images,
      temperature: input.options?.temperature ?? rule.temperature,
      maxTokens: Math.min(
        input.options?.maxTokens ?? rule.maxTokens,
        info.maxTokens,
        plan.maxTokensPerRequest
      ),
      jsonMode: input.options?.jsonMode ?? true,
    };

    const result = await invoke(aiProvider, method, info.model, params);

    await recordUsage({
      ...usageMeta,
      provider,
      model,
      requestTokens: result.usage.promptTokens,
      responseTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      latency: Date.now() - start,
      success: true,
    });

    return {
      content: result.content,
      usage: result.usage,
      providerId: info.provider,
      model: info.model,
    };
  } catch (err) {
    await recordUsage({
      ...usageMeta,
      provider,
      model,
      requestTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      latency: Date.now() - start,
      success: false,
      errorCode: err instanceof AIProviderError ? err.code : "unknown",
    });
    throw err;
  }
}
