import "server-only";

import { insertUsage } from "./usageRepository";
import { AIUsageInput, AIUsageRecord } from "./usageTypes";

// ---------------------------------------------------------------------------
// Usage Service — the single entry point for recording AI usage.
//
// Every AI call, success or failure, flows through recordUsage(). The service
// fills in cost estimation + timestamp, mirrors a dev log line, and delegates
// persistence to the repository. It NEVER throws.
// ---------------------------------------------------------------------------

/**
 * Approximate public pricing per model (USD per 1M tokens).
 * Keyed by the upstream model id (ModelInfo.model), not the registry key.
 * Unknown models estimate as 0 — cost is informational, never enforced.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "deepseek-chat": { input: 0.27, output: 1.1 },
  "deepseek-reasoner": { input: 0.55, output: 2.19 },
  "kimi-k2-0711-preview": { input: 0.6, output: 2.5 },
  "kimi-thinking-preview": { input: 0.6, output: 2.5 },
  "gemini-2.5-pro": { input: 1.25, output: 10 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gpt-5": { input: 1.25, output: 10 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-opus-4-8": { input: 15, output: 75 },
};

export function estimateCost(
  model: string,
  requestTokens: number,
  responseTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (
    (requestTokens / 1_000_000) * pricing.input +
    (responseTokens / 1_000_000) * pricing.output
  );
}

/** Reserved production analytics hook (no-op today). */
function reportAnalytics(record: AIUsageRecord): void {
  void record; // e.g. PostHog / Vercel Analytics in production.
}

/**
 * Record one AI call. Called by the Router for every provider invocation —
 * business code never touches this.
 */
export async function recordUsage(input: AIUsageInput): Promise<AIUsageRecord> {
  const record: AIUsageRecord = {
    ...input,
    estimatedCost: estimateCost(
      input.model,
      input.requestTokens,
      input.responseTokens
    ),
    createdAt: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[ai] task=${record.task} provider=${record.provider} model=${record.model} ` +
        `latency=${record.latency}ms tokens=${record.totalTokens} ` +
        `cost=$${record.estimatedCost.toFixed(6)} ` +
        `success=${record.success}${record.errorCode ? ` error=${record.errorCode}` : ""}`
    );
  }

  reportAnalytics(record);

  try {
    await insertUsage(record);
  } catch (err) {
    // Recording must never break the AI path.
    console.warn("[ai-usage] persist failed:", err);
  }

  return record;
}
