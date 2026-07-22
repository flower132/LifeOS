import "server-only";

import { MODEL_REGISTRY, RoutableProviderId } from "../models";
import { AIPlanConfig, AIPlanId } from "./planTypes";

// ---------------------------------------------------------------------------
// Plan 配置 —— 全部套餐的唯一定义处。
//
// 新增套餐 = 在这里加一行配置；调整额度 / 模型 / 能力 = 改配置。
// Router / Quota / 业务代码一律不感知具体套餐。
// ---------------------------------------------------------------------------

export const ALL_MODELS = Object.keys(MODEL_REGISTRY);

export const ALL_PROVIDERS: RoutableProviderId[] = [
  "deepseek",
  "kimi",
  "gemini",
  "openai",
  "claude",
];

export const AI_PLANS: Record<AIPlanId, AIPlanConfig> = {
  // ── Free：默认用户 ──────────────────────────────────────────────────────
  // DeepSeek Chat 基础 AI，每日额度限制，无图片 / 无文件理解。
  free: {
    id: "free",
    name: "Free",
    dailyTokens: 100_000,
    maxTokensPerRequest: 4096,
    providers: ["deepseek"],
    models: ["deepseek-chat"],
    features: {
      image: false,
      document: false,
      audio: false,
      toolCalling: false,
      reasoning: false,
    },
  },

  // ── Trial：首次注册自动获得，到期自动回到 Free ───────────────────────────
  // DeepSeek 全功能 + 图片 / 文件理解（未来模型就绪后自动生效）+ 更高额度。
  trial: {
    id: "trial",
    name: "Trial",
    dailyTokens: 300_000,
    maxTokensPerRequest: 8192,
    providers: ["deepseek"],
    models: ["deepseek-chat", "deepseek-reasoner"],
    features: {
      image: true,      // 预留：DeepSeek 无 vision 模型，模型就绪前自动降级
      document: true,   // 预留：同上
      audio: false,
      toolCalling: true,
      reasoning: true,
    },
    trialDays: 3,
  },

  // ── Plus：付费会员（支付以后接，当前可由 admin / billing 写入）──────────
  // 更高额度 + 全部 Provider / 模型（具体可用集由配置控制）。
  plus: {
    id: "plus",
    name: "Plus",
    dailyTokens: 1_000_000,
    maxTokensPerRequest: 16_384,
    providers: "all",
    models: "all",
    features: {
      image: true,
      document: true,
      audio: true,
      toolCalling: true,
      reasoning: true,
    },
  },
};

export function getPlanConfig(id: AIPlanId): AIPlanConfig {
  return AI_PLANS[id];
}

// ── 纯函数判定（配置 → 权限；Router / Quota 共用）───────────────────────────

export function configAllowsProvider(
  config: AIPlanConfig,
  provider: RoutableProviderId
): boolean {
  return config.providers === "all" || config.providers.includes(provider);
}

export function configAllowsModel(config: AIPlanConfig, modelKey: string): boolean {
  return config.models === "all" || config.models.includes(modelKey);
}

/**  Observability：某套餐理论上可路由到的全部模型 key。 */
export function planModelPool(config: AIPlanConfig): string[] {
  return config.models === "all" ? ALL_MODELS : config.models;
}
