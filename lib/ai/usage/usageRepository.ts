import "server-only";

import { AIUsageFilter, AIUsageRecord } from "./usageTypes";

// ---------------------------------------------------------------------------
// Usage Repository — persistence for AI usage records.
//
// Primary: Supabase `ai_usage` table (see supabase-schema.sql).
// Fallback: JSONL append to .lifeos/ai-usage.jsonl (self-hosted / read-only
// deployments degrade gracefully; stats read the same file back).
//
// The repository NEVER throws — usage recording must not break AI calls.
// ---------------------------------------------------------------------------

const USAGE_DIR = ".lifeos";
const USAGE_FILE = "ai-usage.jsonl";
const TABLE = "ai_usage";

type Row = {
  id: string;
  user_id: string;
  provider: string;
  model: string;
  task: string;
  request_tokens: number;
  response_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  latency: number;
  success: boolean;
  error_code: string | null;
  session_id: string | null;
  conversation_id: string | null;
  created_at: string;
};

function toRow(record: AIUsageRecord) {
  return {
    user_id: record.userId,
    provider: record.provider,
    model: record.model,
    task: record.task,
    request_tokens: record.requestTokens,
    response_tokens: record.responseTokens,
    total_tokens: record.totalTokens,
    estimated_cost: record.estimatedCost,
    latency: record.latency,
    success: record.success,
    error_code: record.errorCode ?? null,
    session_id: record.sessionId ?? null,
    conversation_id: record.conversationId ?? null,
    created_at: record.createdAt,
  };
}

function fromRow(row: Row): AIUsageRecord {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    model: row.model,
    task: row.task as AIUsageRecord["task"],
    requestTokens: row.request_tokens,
    responseTokens: row.response_tokens,
    totalTokens: row.total_tokens,
    estimatedCost: Number(row.estimated_cost) || 0,
    latency: row.latency,
    success: row.success,
    errorCode: (row.error_code ?? undefined) as AIUsageRecord["errorCode"],
    sessionId: row.session_id ?? undefined,
    conversationId: row.conversation_id ?? undefined,
    createdAt: row.created_at,
  };
}

/** Live Supabase client, or null when not configured (local mode). */
async function supabaseOrNull() {
  try {
    const { getSupabase } = await import("@/lib/supabaseClient");
    return getSupabase();
  } catch {
    return null;
  }
}

// ── JSONL fallback ──────────────────────────────────────────────────────────

async function persistJsonl(record: AIUsageRecord): Promise<void> {
  try {
    const { mkdir, appendFile } = await import("fs/promises");
    const { join } = await import("path");
    const dir = join(process.cwd(), USAGE_DIR);
    await mkdir(dir, { recursive: true });
    await appendFile(
      join(dir, USAGE_FILE),
      JSON.stringify(record) + "\n",
      "utf8"
    );
  } catch {
    // Read-only / ephemeral filesystems: degrade to console-only logging.
  }
}

async function queryJsonl(filter: AIUsageFilter): Promise<AIUsageRecord[]> {
  try {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const raw = await readFile(join(process.cwd(), USAGE_DIR, USAGE_FILE), "utf8");
    const records: AIUsageRecord[] = [];
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        records.push({
          userId: parsed.userId ?? "local",
          provider: parsed.provider ?? "unknown",
          model: parsed.model ?? "unknown",
          task: parsed.task,
          requestTokens: parsed.requestTokens ?? parsed.promptTokens ?? 0,
          responseTokens: parsed.responseTokens ?? parsed.completionTokens ?? 0,
          totalTokens: parsed.totalTokens ?? 0,
          estimatedCost: parsed.estimatedCost ?? 0,
          latency: parsed.latency ?? 0,
          success: parsed.success ?? true,
          errorCode: parsed.errorCode,
          sessionId: parsed.sessionId,
          conversationId: parsed.conversationId,
          createdAt: parsed.createdAt ?? parsed.timestamp,
        });
      } catch {
        // skip malformed line
      }
    }
    return applyFilter(records, filter);
  } catch {
    return [];
  }
}

function applyFilter(
  records: AIUsageRecord[],
  filter: AIUsageFilter
): AIUsageRecord[] {
  let out = records;
  if (filter.userId) out = out.filter((r) => r.userId === filter.userId);
  if (filter.task) out = out.filter((r) => r.task === filter.task);
  if (filter.provider) out = out.filter((r) => r.provider === filter.provider);
  if (filter.model) out = out.filter((r) => r.model === filter.model);
  if (filter.success !== undefined)
    out = out.filter((r) => r.success === filter.success);
  if (filter.since) out = out.filter((r) => r.createdAt >= filter.since!);
  if (filter.until) out = out.filter((r) => r.createdAt < filter.until!);
  out = out.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter.limit) out = out.slice(0, filter.limit);
  return out;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function insertUsage(record: AIUsageRecord): Promise<void> {
  const supabase = await supabaseOrNull();
  if (supabase) {
    const { error } = await supabase.from(TABLE).insert(toRow(record));
    if (!error) return;
    console.warn("[ai-usage] Supabase insert failed, falling back to JSONL:", error.message);
  }
  await persistJsonl(record);
}

export async function queryUsage(filter: AIUsageFilter): Promise<AIUsageRecord[]> {
  const supabase = await supabaseOrNull();
  if (!supabase) return queryJsonl(filter);

  let query = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (filter.userId) query = query.eq("user_id", filter.userId);
  if (filter.task) query = query.eq("task", filter.task);
  if (filter.provider) query = query.eq("provider", filter.provider);
  if (filter.model) query = query.eq("model", filter.model);
  if (filter.success !== undefined) query = query.eq("success", filter.success);
  if (filter.since) query = query.gte("created_at", filter.since);
  if (filter.until) query = query.lt("created_at", filter.until);
  query = query.limit(filter.limit ?? 10_000);

  const { data, error } = await query;
  if (error) {
    console.warn("[ai-usage] Supabase query failed:", error.message);
    return [];
  }
  return (data as Row[]).map(fromRow);
}
