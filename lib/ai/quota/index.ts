import "server-only";

/**
 * AI Quota — 独立的每日配额引擎（限制器，不属于会员系统）。
 *
 * 按每日总 Token 数限制（当前启用维度）；requests / images / files /
 * audio 为预留维度，计数已随每次调用记录，限制后续开放。
 * 任何套餐（Free / Pro / Ultra…）复用同一套引擎，只是不同的 QuotaLimits。
 */

export {
  getDailyQuota,
  getRemainingQuota,
  checkQuota,
  consumeQuota,
  resetQuota,
} from "./quotaService";
export {
  isWithinQuota,
  exceededDimensions,
  remainingCounters,
  quotaDay,
  nextResetAt,
  zeroCounters,
} from "./quotaChecker";
export {
  readQuotaUsage,
  addQuotaUsage,
  resetQuotaUsage,
} from "./quotaRepository";
export type {
  QuotaCounters,
  QuotaDimension,
  QuotaLimits,
  QuotaUsage,
  QuotaDelta,
  QuotaCheckResult,
  QuotaStatus,
} from "./quotaTypes";
