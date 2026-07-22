import "server-only";

import { zeroCounters } from "./quotaChecker";
import { QuotaCounters, QuotaDelta, QuotaUsage } from "./quotaTypes";

// ---------------------------------------------------------------------------
// Quota Repository — 每日用量计数器的持久化。
//
// Primary: Supabase `ai_quota_daily` 表（(user_id, day) 一桶）。
// Fallback: 进程内 Map（本地模式 / 未配置 Supabase；语义与旧 quota.ts 相同）。
//
// 「每天自动重置」由存储模型天然实现：计数器按 UTC 日分桶，
// 跨天读写自动落到新桶（从零开始），不依赖浏览器，也不需要 cron。
//
// 与 Usage 层的关系：Usage 是事实日志（每次调用一行），Quota 是计数器
// （每天一行），二者独立演进、互不强依赖。
// ---------------------------------------------------------------------------

const TABLE = "ai_quota_daily";

type Row = {
  user_id: string;
  day: string;
  tokens: number;
  requests: number;
  images: number;
  files: number;
  audio: number;
  updated_at: string;
};

function toRow(usage: QuotaUsage): Row {
  return {
    user_id: usage.userId,
    day: usage.day,
    tokens: usage.counters.tokens,
    requests: usage.counters.requests,
    images: usage.counters.images,
    files: usage.counters.files,
    audio: usage.counters.audio,
    updated_at: usage.updatedAt,
  };
}

function fromRow(row: Row): QuotaUsage {
  return {
    userId: row.user_id,
    day: row.day,
    counters: {
      tokens: row.tokens,
      requests: row.requests,
      images: row.images,
      files: row.files,
      audio: row.audio,
    },
    updatedAt: row.updated_at,
  };
}

async function supabaseOrNull() {
  try {
    const { getSupabase } = await import("@/lib/supabaseClient");
    return getSupabase();
  } catch {
    return null;
  }
}

// ── In-memory fallback（本地模式）────────────────────────────────────────────

const memoryBuckets = new Map<string, QuotaUsage>();

function memoryKey(userId: string, day: string): string {
  return `${userId}:${day}`;
}

// ── Public API ──────────────────────────────────────────────────────────────

/** 读取用户某一天的用量；无记录返回零桶。 */
export async function readQuotaUsage(
  userId: string,
  day: string
): Promise<QuotaUsage> {
  const empty: QuotaUsage = {
    userId,
    day,
    counters: zeroCounters(),
    updatedAt: new Date().toISOString(),
  };

  const supabase = await supabaseOrNull();
  if (!supabase) {
    return memoryBuckets.get(memoryKey(userId, day)) ?? empty;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();

  if (error) {
    console.warn("[ai-quota] read failed, treating as zero:", error.message);
    return empty;
  }
  return data ? fromRow(data as Row) : empty;
}

/**
 * 累加用量并返回最新桶。
 * 注意：当前为 read-modify-write 合并，极端并发下可能丢计数；
 * 如需严格原子，后续在 Supabase 加 increment RPC，调用点不变。
 */
export async function addQuotaUsage(
  userId: string,
  day: string,
  delta: QuotaDelta
): Promise<QuotaUsage> {
  const current = await readQuotaUsage(userId, day);
  const counters: QuotaCounters = {
    tokens: current.counters.tokens + (delta.tokens ?? 0),
    requests: current.counters.requests + (delta.requests ?? 0),
    images: current.counters.images + (delta.images ?? 0),
    files: current.counters.files + (delta.files ?? 0),
    audio: current.counters.audio + (delta.audio ?? 0),
  };
  const next: QuotaUsage = {
    userId,
    day,
    counters,
    updatedAt: new Date().toISOString(),
  };

  const supabase = await supabaseOrNull();
  if (!supabase) {
    memoryBuckets.set(memoryKey(userId, day), next);
    return next;
  }

  const { error } = await supabase
    .from(TABLE)
    .upsert(toRow(next), { onConflict: "user_id,day" });
  if (error) {
    // 配额持久化失败不阻断 AI 调用（与 Usage 层同一原则）。
    console.warn("[ai-quota] write failed:", error.message);
  }
  return next;
}

/** 清零用户当日桶（运维 / 测试用；日常重置靠跨天自动换桶）。 */
export async function resetQuotaUsage(
  userId: string,
  day: string
): Promise<void> {
  const supabase = await supabaseOrNull();
  if (!supabase) {
    memoryBuckets.delete(memoryKey(userId, day));
    return;
  }
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("day", day);
  if (error) {
    console.warn("[ai-quota] reset failed:", error.message);
  }
}
