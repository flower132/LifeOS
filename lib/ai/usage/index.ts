import "server-only";

/**
 * AI Usage — 统一的 AI 使用记录层。
 *
 *   Router → Usage（调用前上下文）→ Provider → Usage（成功/失败落库）
 *
 * 目的不是限制，而是记录：Quota / Plan / Billing / Analytics / Admin
 * 全部建立在这些 API 之上。
 */

export { recordUsage, estimateCost } from "./usageService";
export { insertUsage, queryUsage } from "./usageRepository";
export {
  aggregateUsage,
  getTodayUsage,
  getMonthlyUsage,
  getUserUsage,
  getModelUsage,
  getProviderUsage,
  getAdminUsage,
  getAdminUsageRecords,
} from "./usageStats";
export type {
  AIUsageRecord,
  AIUsageInput,
  AIUsageFilter,
  AIUsageStats,
  AIUsageBreakdown,
} from "./usageTypes";
