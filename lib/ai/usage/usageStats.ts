import "server-only";

import { queryUsage } from "./usageRepository";
import {
  AIUsageBreakdown,
  AIUsageFilter,
  AIUsageRecord,
  AIUsageStats,
} from "./usageTypes";

// ---------------------------------------------------------------------------
// Usage Stats — read-side aggregations over recorded usage.
//
// These are the query primitives the future Quota / Dashboard / Billing /
// Admin layers call. Read-only: no limits, no enforcement.
// ---------------------------------------------------------------------------

function emptyStats(): AIUsageStats {
  return {
    calls: 0,
    successCalls: 0,
    failedCalls: 0,
    requestTokens: 0,
    responseTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    avgLatency: 0,
    byTask: {},
    byModel: {},
    byProvider: {},
  };
}

function addBreakdown(
  map: Record<string, AIUsageBreakdown>,
  key: string,
  record: AIUsageRecord
) {
  const entry = (map[key] ??= { calls: 0, totalTokens: 0, estimatedCost: 0 });
  entry.calls += 1;
  entry.totalTokens += record.totalTokens;
  entry.estimatedCost += record.estimatedCost;
}

/** Aggregate a set of records into stats (totals + task/model/provider splits). */
export function aggregateUsage(records: AIUsageRecord[]): AIUsageStats {
  const stats = emptyStats();
  let latencySum = 0;

  for (const record of records) {
    stats.calls += 1;
    if (record.success) stats.successCalls += 1;
    else stats.failedCalls += 1;
    stats.requestTokens += record.requestTokens;
    stats.responseTokens += record.responseTokens;
    stats.totalTokens += record.totalTokens;
    stats.estimatedCost += record.estimatedCost;
    latencySum += record.latency;

    addBreakdown(stats.byTask, record.task, record);
    addBreakdown(stats.byModel, record.model, record);
    addBreakdown(stats.byProvider, record.provider, record);
  }

  stats.avgLatency = stats.calls > 0 ? Math.round(latencySum / stats.calls) : 0;
  return stats;
}

function startOfTodayUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
}

function startOfMonthUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
}

async function statsFor(filter: AIUsageFilter): Promise<AIUsageStats> {
  return aggregateUsage(await queryUsage(filter));
}

/** 今日用量（UTC），可选按用户过滤。 */
export function getTodayUsage(userId?: string): Promise<AIUsageStats> {
  return statsFor({ userId, since: startOfTodayUtc() });
}

/** 本月用量（UTC），可选按用户过滤。 */
export function getMonthlyUsage(userId?: string): Promise<AIUsageStats> {
  return statsFor({ userId, since: startOfMonthUtc() });
}

/** 指定用户的全部用量。 */
export function getUserUsage(userId: string): Promise<AIUsageStats> {
  return statsFor({ userId });
}

/** 指定模型的全部用量。 */
export function getModelUsage(model: string): Promise<AIUsageStats> {
  return statsFor({ model });
}

/** 指定 Provider 的全部用量。 */
export function getProviderUsage(provider: string): Promise<AIUsageStats> {
  return statsFor({ provider });
}

// ── Admin（预留）─────────────────────────────────────────────────────────────

/**
 * 预留：管理后台查看任意用户的 AI 使用情况。
 * 注意：当前无鉴权保护 —— Admin 后台落地时必须加 admin 校验再暴露。
 */
export function getAdminUsage(filter: AIUsageFilter = {}): Promise<AIUsageStats> {
  return statsFor(filter);
}

/** 预留：管理后台原始记录查询（分页用 limit + since/until 游标）。 */
export function getAdminUsageRecords(
  filter: AIUsageFilter = {}
): Promise<AIUsageRecord[]> {
  return queryUsage(filter);
}
