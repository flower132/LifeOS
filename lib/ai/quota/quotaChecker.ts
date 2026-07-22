import "server-only";

import {
  QUOTA_DIMENSIONS,
  QuotaCounters,
  QuotaDimension,
  QuotaLimits,
} from "./quotaTypes";

// ---------------------------------------------------------------------------
// Quota Checker — 纯函数，无 IO。给定已用量与限额，判定是否还能调用、
// 计算剩余量。引擎核心规则集中在这里，与存储、套餐、路由完全解耦。
// ---------------------------------------------------------------------------

export function zeroCounters(): QuotaCounters {
  return { tokens: 0, requests: 0, images: 0, files: 0, audio: 0 };
}

/** 已超出（或正好用尽）限额的维度列表；空数组 = 仍可调用。 */
export function exceededDimensions(
  used: QuotaCounters,
  limits: QuotaLimits
): QuotaDimension[] {
  return QUOTA_DIMENSIONS.filter((dimension) => {
    const limit = limits[dimension];
    return limit !== null && used[dimension] >= limit;
  });
}

/** 每维度剩余量；不限的维度为 null。 */
export function remainingCounters(
  used: QuotaCounters,
  limits: QuotaLimits
): Record<QuotaDimension, number | null> {
  return Object.fromEntries(
    QUOTA_DIMENSIONS.map((dimension) => {
      const limit = limits[dimension];
      return [
        dimension,
        limit === null ? null : Math.max(0, limit - used[dimension]),
      ];
    })
  ) as Record<QuotaDimension, number | null>;
}

export function isWithinQuota(used: QuotaCounters, limits: QuotaLimits): boolean {
  return exceededDimensions(used, limits).length === 0;
}

/** 当前配额日（UTC, YYYY-MM-DD）。 */
export function quotaDay(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

/** 下一次自动重置时间（下一个 UTC 零点）。跨天即新桶，无需任何定时任务。 */
export function nextResetAt(at: Date = new Date()): string {
  const next = new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() + 1)
  );
  return next.toISOString();
}
