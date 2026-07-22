import "server-only";

/**
 * AI Plan — 会员计划系统（Free / Trial / Plus）。
 *
 * Plan 负责：权限 / Quota / 模型 / 能力；不负责支付。
 * 统一架构：User → Plan → Quota → Router → Provider → Usage。
 */

export {
  getUserPlan,
  getUserPlanConfig,
  userAllowsModel,
  userAllowsProvider,
  userAllowsCapability,
  configAllowsCapability,
  getPlanSettings,
  handleBillingEvent,
} from "./planService";
export type { PlanSettingsView } from "./planService";
export { resolveUserPlan, setUserPlan } from "./planResolver";
export {
  AI_PLANS,
  ALL_MODELS,
  ALL_PROVIDERS,
  getPlanConfig,
  configAllowsModel,
  configAllowsProvider,
  planModelPool,
} from "./planConfig";
export type {
  AIPlanId,
  AIPlanConfig,
  AIPlanFeatures,
  AIPlanSource,
  UserPlanState,
  BillingProvider,
  BillingEvent,
} from "./planTypes";
