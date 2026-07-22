import "server-only";

import { AICapability } from "../types";
import { RoutableProviderId } from "../models";
import {
  configAllowsModel,
  configAllowsProvider,
  getPlanConfig,
} from "./planConfig";
import { resolveUserPlan } from "./planResolver";
import {
  AIPlanConfig,
  AIPlanFeatures,
  AIPlanId,
  BillingEvent,
  UserPlanState,
} from "./planTypes";

// ---------------------------------------------------------------------------
// Plan Service — Plan 系统对外唯一入口。
//
//   User → Plan（本模块）→ Quota → Router → Provider → Usage
//
// Router / Quota 只问本模块「这个用户能用什么」，业务页面完全不知道套餐。
// ---------------------------------------------------------------------------

/** 能力 → 套餐功能开关的映射；未列出的能力（chat/longContext/embedding）不受限。 */
const CAPABILITY_FEATURE: Partial<Record<AICapability, keyof AIPlanFeatures>> = {
  vision: "image",
  file: "document",
  audio: "audio",
  toolCalling: "toolCalling",
  reasoning: "reasoning",
};

/** 当前用户的计划状态（含 Trial 剩余天数）。 */
export function getUserPlan(userId: string): Promise<UserPlanState> {
  return resolveUserPlan(userId);
}

/** 当前用户的计划配置（额度 / 模型 / Provider / 能力开关）。 */
export async function getUserPlanConfig(userId: string): Promise<AIPlanConfig> {
  const state = await resolveUserPlan(userId);
  return getPlanConfig(state.planId);
}

/** 用户是否可使用某模型（Router 用）。 */
export async function userAllowsModel(
  userId: string,
  modelKey: string
): Promise<boolean> {
  return configAllowsModel(await getUserPlanConfig(userId), modelKey);
}

/** 用户是否可使用某 Provider。 */
export async function userAllowsProvider(
  userId: string,
  provider: RoutableProviderId
): Promise<boolean> {
  return configAllowsProvider(await getUserPlanConfig(userId), provider);
}

/** 用户是否开放某能力（Router 能力门控用）。 */
export async function userAllowsCapability(
  userId: string,
  capability: AICapability
): Promise<boolean> {
  const feature = CAPABILITY_FEATURE[capability];
  if (!feature) return true; // chat / longContext / embedding 不设限
  const config = await getUserPlanConfig(userId);
  return config.features[feature];
}

/** 配置级能力判定（已有 config 时的同步版本，避免重复解析）。 */
export function configAllowsCapability(
  config: AIPlanConfig,
  capability: AICapability
): boolean {
  const feature = CAPABILITY_FEATURE[capability];
  if (!feature) return true;
  return config.features[feature];
}

// ── Settings / 升级入口（预留，无支付）───────────────────────────────────────

export interface PlanSettingsView {
  planId: AIPlanId;
  planName: string;
  source: UserPlanState["source"];
  trialEndsAt?: string;
  trialDaysRemaining?: number;
  features: AIPlanFeatures;
  /** 升级入口（预留）：支付接入前 available=false。 */
  upgrade: {
    available: boolean;
    /** 未来支付渠道（stripe / revenuecat / apple_iap / google_play）。 */
    providers: string[];
  };
}

/** Settings 页 / API 的 Plan 视图（剩余额度由 Quota 模块另行提供）。 */
export async function getPlanSettings(userId: string): Promise<PlanSettingsView> {
  const state = await resolveUserPlan(userId);
  const config = getPlanConfig(state.planId);
  return {
    planId: state.planId,
    planName: config.name,
    source: state.source,
    trialEndsAt: state.trialEndsAt,
    trialDaysRemaining: state.trialDaysRemaining,
    features: config.features,
    upgrade: {
      available: false, // 预留：支付系统接入后开放
      providers: ["stripe", "revenuecat", "apple_iap", "google_play"],
    },
  };
}

// ── 未来支付扩展点（现在不接）────────────────────────────────────────────────

/**
 * 预留：支付系统（Stripe / RevenueCat / Apple IAP / Google Play）的
 * 订阅事件入口。接入后把事件转换为用户 Plan 写入即可，
 * Router / Quota / Usage 无需任何改动。
 */
export async function handleBillingEvent(event: BillingEvent): Promise<void> {
  const { setUserPlan } = await import("./planResolver");
  await setUserPlan(event.userId, event.planId, "billing");
}
