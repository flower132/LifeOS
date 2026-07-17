import "server-only";

import { AITask } from "./types";
import { getPlanConfig } from "./plans";

// ---------------------------------------------------------------------------
// Quota layer — interface stable for the future membership system.
//
// The daily limit comes from the active plan (plans.ts); AI_DAILY_QUOTA can
// override it for ops. When memberships ship, plans resolve per user and this
// file does not change.
// ---------------------------------------------------------------------------

interface QuotaBucket {
  /** YYYY-MM-DD (UTC) the counter belongs to. */
  day: string;
  count: number;
}

const buckets = new Map<string, QuotaBucket>();

function dailyLimit(): number {
  const raw = process.env.AI_DAILY_QUOTA;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return getPlanConfig().dailyQuota;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function bucketFor(userId: string): QuotaBucket {
  const day = todayUtc();
  const existing = buckets.get(userId);
  if (existing && existing.day === day) return existing;
  const fresh: QuotaBucket = { day, count: 0 };
  buckets.set(userId, fresh);
  return fresh;
}

/** True when the user may perform another AI call today. */
export function canUse(userId: string, task: AITask): boolean {
  void task; // Reserved: per-task limits arrive with the membership system.
  return bucketFor(userId).count < dailyLimit();
}

/** Record a successful call against the user's quota. */
export function consume(userId: string, task: AITask): void {
  void task;
  bucketFor(userId).count += 1;
}

/** Refund a call that failed downstream so failures never burn quota. */
export function restore(userId: string, task: AITask): void {
  void task;
  const bucket = bucketFor(userId);
  if (bucket.count > 0) bucket.count -= 1;
}
