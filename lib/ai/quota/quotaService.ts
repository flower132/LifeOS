import "server-only";

import { getUserPlanConfig } from "../plans";
import {
  exceededDimensions,
  nextResetAt,
  quotaDay,
  remainingCounters,
} from "./quotaChecker";
import {
  addQuotaUsage,
  readQuotaUsage,
  resetQuotaUsage,
} from "./quotaRepository";
import {
  QuotaCheckResult,
  QuotaDelta,
  QuotaLimits,
  QuotaStatus,
} from "./quotaTypes";

// ---------------------------------------------------------------------------
// Quota Service — 配额引擎的唯一入口。
//
//   AI Request → checkQuota（超额则统一拒绝，不调用模型）
//              → Provider → Usage → consumeQuota（按实际 token 扣减）
//
// 引擎不知道「套餐」：限额只是注入的一组 QuotaLimits。今天来自
// plans.ts 的部署级配置，以后会员系统按用户注入，引擎不变。
// ---------------------------------------------------------------------------

/** 每日 token 上限：env 覆盖优先（运维旋钮），否则取当前用户 Plan 的配置。 */
async function dailyTokenLimit(userId: string): Promise<number | null> {
  const raw =
    process.env.AI_DAILY_TOKEN_QUOTA ?? process.env.AI_DAILY_QUOTA; // 兼容旧变量
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return (await getUserPlanConfig(userId)).dailyTokens;
}

/**
 * 用户当前的每日限额（由 Plan Resolver 决定：Free / Trial / Plus 各有配额，
 * Trial 到期回落 Free 后限额自动随之变化）。
 */
export async function getDailyQuota(userId: string): Promise<QuotaLimits> {
  return {
    tokens: await dailyTokenLimit(userId),
    requests: null, // 预留：请求次数限制
    images: null,   // 预留：图片次数限制
    files: null,    // 预留：文件次数限制
    audio: null,    // 预留：音频次数限制
  };
}

function toStatus(
  userId: string,
  counters: QuotaStatus["used"],
  limits: QuotaLimits
): QuotaStatus {
  const exceeded = exceededDimensions(counters, limits);
  return {
    day: quotaDay(),
    limits,
    used: counters,
    remaining: remainingCounters(counters, limits),
    resetAt: nextResetAt(),
    exceeded: exceeded.length > 0,
  };
}

/** 今日配额快照（含各维度剩余量）—— 首页 / Dashboard 的数据源。 */
export async function getRemainingQuota(userId: string): Promise<QuotaStatus> {
  const usage = await readQuotaUsage(userId, quotaDay());
  return toStatus(userId, usage.counters, await getDailyQuota(userId));
}

/**
 * 调用前检查。ok=false 时调用方必须返回统一 quota_exceeded 错误，
 * 不得继续调用模型。
 */
export async function checkQuota(userId: string): Promise<QuotaCheckResult> {
  const limits = await getDailyQuota(userId);
  const usage = await readQuotaUsage(userId, quotaDay());
  const exceeded = exceededDimensions(usage.counters, limits);
  return {
    ok: exceeded.length === 0,
    exceededDimensions: exceeded,
    status: toStatus(userId, usage.counters, limits),
  };
}

/**
 * 调用成功后按实际消耗扣减（tokens 来自 Provider 返回的真实用量）。
 * 失败的调用不消耗配额 —— 调用方只在成功路径调用本函数。
 */
export async function consumeQuota(
  userId: string,
  delta: QuotaDelta
): Promise<QuotaStatus> {
  const usage = await addQuotaUsage(userId, quotaDay(), delta);
  return toStatus(userId, usage.counters, await getDailyQuota(userId));
}

/** 清零当日配额（运维 / 测试）。日常重置靠跨天自动换桶，无需调用。 */
export async function resetQuota(userId: string): Promise<void> {
  await resetQuotaUsage(userId, quotaDay());
}
