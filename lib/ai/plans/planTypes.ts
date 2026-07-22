import "server-only";

import { RoutableProviderId } from "../models";

// ---------------------------------------------------------------------------
// Plan types — 会员计划（Plan）系统的通用模型。
//
// Plan 负责：权限 / Quota / 模型 / 能力。不负责支付 ——
// 支付（Stripe / RevenueCat / Apple IAP / Google Play）以后只写入
// UserPlanState，引擎与业务代码不变。
// ---------------------------------------------------------------------------

export type AIPlanId = "free" | "trial" | "plus";

/** 能力开关：false 时 Router 自动拒绝对应能力，业务页面无感知。 */
export interface AIPlanFeatures {
  /** 图片理解（vision）。 */
  image: boolean;
  /** 文件理解（file）。 */
  document: boolean;
  /** 音频（audio）。 */
  audio: boolean;
  /** 工具调用（toolCalling）。 */
  toolCalling: boolean;
  /** 推理模型（reasoning）。 */
  reasoning: boolean;
}

export interface AIPlanConfig {
  id: AIPlanId;
  /** 展示名（i18n key 留给 UI 层）。 */
  name: string;
  /** 每日 token 预算（Quota Engine 输入；null = 不限）。 */
  dailyTokens: number | null;
  /** 单请求 completion token 上限。 */
  maxTokensPerRequest: number;
  /** 允许的 Provider，或 "all"。 */
  providers: RoutableProviderId[] | "all";
  /** 允许的 MODEL_REGISTRY key，或 "all"。 */
  models: string[] | "all";
  features: AIPlanFeatures;
  /** 试用天数（仅 trial）。 */
  trialDays?: number;
}

/** 计划来源：默认 / 试用 / 后台调整 / 支付（预留）。 */
export type AIPlanSource = "default" | "trial" | "admin" | "billing";

/** 用户当前计划状态（Resolver 输出）。 */
export interface UserPlanState {
  userId: string;
  planId: AIPlanId;
  source: AIPlanSource;
  /** trial 时间窗（trial 时存在）。 */
  trialStartedAt?: string;
  trialEndsAt?: string;
  /** 剩余试用天数（trial 未到期时为 >= 0）。 */
  trialDaysRemaining?: number;
}

// ── 未来支付扩展点（现在不接，只保留类型）────────────────────────────────────

export type BillingProvider =
  | "stripe"
  | "revenuecat"
  | "apple_iap"
  | "google_play";

/** 支付系统回调事件的统一形状（预留）。 */
export interface BillingEvent {
  provider: BillingProvider;
  userId: string;
  planId: AIPlanId;
  /** ISO；订阅到期时间（可选）。 */
  expiresAt?: string;
}
