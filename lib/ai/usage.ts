import "server-only";

import { AIErrorCode, AITask } from "./types";

// ---------------------------------------------------------------------------
// Usage layer — every AI call is recorded automatically.
//
// Today: appended as JSONL to .lifeos/ai-usage.jsonl (best-effort; read-only
// deployments degrade to console-only). Later: swap `persist` for a Supabase
// insert — callers and the record shape stay unchanged.
//
// Privacy: prompt/content are NEVER recorded — metadata only.
// ---------------------------------------------------------------------------

export interface AIUsageRecord {
  userId: string;
  timestamp: string;
  task: AITask;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latency: number;
  success: boolean;
  errorCode?: AIErrorCode;
}

const USAGE_DIR = ".lifeos";
const USAGE_FILE = "ai-usage.jsonl";

async function persist(record: AIUsageRecord): Promise<void> {
  try {
    const { mkdir, appendFile } = await import("fs/promises");
    const { join } = await import("path");
    const dir = join(process.cwd(), USAGE_DIR);
    await mkdir(dir, { recursive: true });
    await appendFile(join(dir, USAGE_FILE), JSON.stringify(record) + "\n", "utf8");
  } catch {
    // Read-only / ephemeral filesystems: degrade to console-only logging.
  }
}

/** Reserved production analytics hook (no-op today). */
function reportAnalytics(record: AIUsageRecord): void {
  void record; // e.g. PostHog / Vercel Analytics / Supabase insert in production.
}

export async function recordUsage(record: AIUsageRecord): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[ai] task=${record.task} provider=${record.provider} model=${record.model} ` +
        `latency=${record.latency}ms tokens=${record.totalTokens} ` +
        `success=${record.success}${record.errorCode ? ` error=${record.errorCode}` : ""}`
    );
  }
  reportAnalytics(record);
  await persist(record);
}
