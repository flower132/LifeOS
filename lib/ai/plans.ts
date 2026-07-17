import "server-only";

import { MODEL_REGISTRY, RoutableProviderId } from "./models";

// ---------------------------------------------------------------------------
// Plan configuration — RESERVED for the future membership system.
//
// Today every user is on "free" (unified DeepSeek). When memberships ship,
// the membership system only edits this config (and getCurrentPlan starts
// reading the user's tier) — the router and quota layer never change.
// ---------------------------------------------------------------------------

export type AIPlanId = "free" | "pro" | "ultra";

export interface AIPlanConfig {
  /** Providers this plan may use, or "all". */
  allowedProviders: RoutableProviderId[] | "all";
  /** MODEL_REGISTRY keys this plan may use, or "all". */
  allowedModels: string[] | "all";
  /** Max AI calls per user per day. */
  dailyQuota: number;
  /** Per-request completion-token ceiling. */
  maxTokensPerRequest: number;
}

const ALL_MODELS = Object.keys(MODEL_REGISTRY);
const ALL_PROVIDERS: RoutableProviderId[] = [
  "deepseek",
  "kimi",
  "gemini",
  "openai",
  "claude",
];

export const AI_PLANS: Record<AIPlanId, AIPlanConfig> = {
  free: {
    allowedProviders: ["deepseek"],
    allowedModels: ["deepseek-chat", "deepseek-reasoner"],
    dailyQuota: 100_000,
    maxTokensPerRequest: 4096,
  },
  pro: {
    allowedProviders: "all",
    allowedModels: "all",
    dailyQuota: 100_000,
    maxTokensPerRequest: 8192,
  },
  ultra: {
    allowedProviders: "all",
    allowedModels: "all",
    dailyQuota: 100_000,
    maxTokensPerRequest: 16_384,
  },
};

/**
 * Current plan for the deployment. Defaults to "free" (unified DeepSeek).
 * Ops can switch the default tier via AI_PLAN; the future membership system
 * will resolve this per user instead — router/quota call sites stay as-is.
 */
export function getCurrentPlan(): AIPlanId {
  const raw = process.env.AI_PLAN;
  return raw === "pro" || raw === "ultra" ? raw : "free";
}

export function getPlanConfig(plan: AIPlanId = getCurrentPlan()): AIPlanConfig {
  return AI_PLANS[plan];
}

export function planAllowsProvider(provider: RoutableProviderId, plan?: AIPlanId): boolean {
  const config = getPlanConfig(plan);
  return config.allowedProviders === "all" || config.allowedProviders.includes(provider);
}

export function planAllowsModel(modelKey: string, plan?: AIPlanId): boolean {
  const config = getPlanConfig(plan);
  if (config.allowedModels === "all") return true;
  return config.allowedModels.includes(modelKey);
}

/** Observability helper: every model key a plan could ever route to. */
export function planModelPool(plan?: AIPlanId): string[] {
  const config = getPlanConfig(plan);
  return config.allowedModels === "all" ? ALL_MODELS : config.allowedModels;
}

export { ALL_PROVIDERS };
