import "server-only";

import { AITask, AIImageInput, AIProviderId } from "./types";
import { MODEL_CATALOG, TASK_ROUTING } from "./models";
import { AIProviderError, AIProviderV2 } from "./provider";
import { deepseekProvider } from "./providers/deepseek";
import { claudeProvider } from "./providers/claude";
import { openaiProvider } from "./providers/openai";
import { geminiProvider } from "./providers/gemini";

// ---------------------------------------------------------------------------
// Router — the ONLY place tasks are resolved to providers/models.
//
// The router never calls AI itself and never hardcodes a model name:
//   task → TASK_ROUTING (models.ts) → MODEL_CATALOG (models.ts) → provider
// Re-routing a capability (e.g. REFLECTION → Claude) is a one-line edit in
// TASK_ROUTING; implementing a reserved provider activates every task
// pointed at it. Business code is never touched.
// ---------------------------------------------------------------------------

type RoutableProviderId = Exclude<AIProviderId, "mock" | "server">;

const PROVIDERS: Record<RoutableProviderId, AIProviderV2> = {
  deepseek: deepseekProvider,
  claude: claudeProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

export interface ResolvedRoute {
  provider: AIProviderV2;
  providerId: RoutableProviderId;
  model: string;
  temperature: number;
  maxTokens: number;
  supportsVision: boolean;
  supportsJsonMode: boolean;
}

export function resolveTask(task: AITask): ResolvedRoute {
  const rule = TASK_ROUTING[task];
  if (!rule) {
    throw new AIProviderError("validation", `No routing rule for task: ${task}`);
  }

  const info = MODEL_CATALOG[rule.model];
  if (!info) {
    throw new AIProviderError(
      "validation",
      `Routing rule for task ${task} references unknown model: ${rule.model}`
    );
  }

  const provider = PROVIDERS[info.provider];
  if (!provider) {
    throw new AIProviderError(
      "not_implemented",
      `Provider ${info.provider} is not registered in the router`
    );
  }

  return {
    provider,
    providerId: info.provider,
    model: info.model,
    temperature: rule.temperature,
    maxTokens: Math.min(rule.maxTokens, info.maxTokens),
    supportsVision: info.supportsVision,
    supportsJsonMode: info.supportsJsonMode,
  };
}

/**
 * Reject image-bearing requests routed to text-only models before the
 * provider is called, so clients get a clean unified error.
 */
export function assertVisionSupport(
  route: ResolvedRoute,
  images?: AIImageInput[]
): void {
  if (images && images.length > 0 && !route.supportsVision) {
    throw new AIProviderError(
      "provider_error",
      `Model ${route.model} does not support vision input. ` +
        `Wire a vision-capable provider in TASK_ROUTING to enable image analysis.`
    );
  }
}
