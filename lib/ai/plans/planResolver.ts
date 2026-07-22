import "server-only";

import { getPlanConfig } from "./planConfig";
import { AIPlanId, AIPlanSource, UserPlanState } from "./planTypes";

// ---------------------------------------------------------------------------
// Plan Resolver — 每个 AI 请求统一从这里读取「当前用户的 Plan」。
//
// Trial 生命周期：
//   首次访问（无记录）→ 自动开通 Trial（trialDays 天）
//   Trial 到期        → 读取时自动降级为 Free（并持久化）
//   后台调整（admin）→ 以记录为准，不自动开通 / 不自动降级
//
// 持久化：Supabase `ai_user_plans`；本地模式降级为进程内 Map。
// 全部服务端实现，不依赖浏览器。
// ---------------------------------------------------------------------------

const TABLE = "ai_user_plans";
const DAY_MS = 24 * 60 * 60 * 1000;

interface StoredPlan {
  userId: string;
  planId: AIPlanId;
  source: AIPlanSource;
  trialStartedAt?: string;
  updatedAt: string;
}

type Row = {
  user_id: string;
  plan_id: string;
  source: string;
  trial_started_at: string | null;
  updated_at: string;
};

function toRow(plan: StoredPlan) {
  return {
    user_id: plan.userId,
    plan_id: plan.planId,
    source: plan.source,
    trial_started_at: plan.trialStartedAt ?? null,
    updated_at: plan.updatedAt,
  };
}

function fromRow(row: Row): StoredPlan {
  return {
    userId: row.user_id,
    planId: row.plan_id as AIPlanId,
    source: row.source as AIPlanSource,
    trialStartedAt: row.trial_started_at ?? undefined,
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

const memoryPlans = new Map<string, StoredPlan>();

async function readStoredPlan(userId: string): Promise<StoredPlan | null> {
  const supabase = await supabaseOrNull();
  if (!supabase) return memoryPlans.get(userId) ?? null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[ai-plan] read failed:", error.message);
    return null;
  }
  return data ? fromRow(data as Row) : null;
}

async function writeStoredPlan(plan: StoredPlan): Promise<void> {
  const supabase = await supabaseOrNull();
  if (!supabase) {
    memoryPlans.set(plan.userId, plan);
    return;
  }
  const { error } = await supabase
    .from(TABLE)
    .upsert(toRow(plan), { onConflict: "user_id" });
  if (error) {
    console.warn("[ai-plan] write failed:", error.message);
  }
}

// ── Resolver ────────────────────────────────────────────────────────────────

function trialWindow(startedAt: string, trialDays: number) {
  const start = Date.parse(startedAt);
  const endsAt = new Date(start + trialDays * DAY_MS).toISOString();
  const remainingMs = start + trialDays * DAY_MS - Date.now();
  return {
    endsAt,
    daysRemaining: Math.max(0, Math.ceil(remainingMs / DAY_MS)),
    expired: remainingMs <= 0,
  };
}

function toState(stored: StoredPlan): UserPlanState {
  const state: UserPlanState = {
    userId: stored.userId,
    planId: stored.planId,
    source: stored.source,
  };
  if (stored.planId === "trial" && stored.trialStartedAt) {
    const trialDays = getPlanConfig("trial").trialDays ?? 3;
    const window = trialWindow(stored.trialStartedAt, trialDays);
    state.trialStartedAt = stored.trialStartedAt;
    state.trialEndsAt = window.endsAt;
    state.trialDaysRemaining = window.daysRemaining;
  }
  return state;
}

/**
 * 读取当前用户的 Plan（所有 AI 请求的唯一入口）。
 * 副作用：首次访问自动开通 Trial；Trial 到期自动降级 Free。
 *
 * 运维旋钮：设置 AI_PLAN=free|trial|plus 可强制全部署统一 Plan
 * （跳过 Trial 自动开通，不持久化），默认不设置。
 */
export async function resolveUserPlan(userId: string): Promise<UserPlanState> {
  const forced = process.env.AI_PLAN;
  if (forced === "free" || forced === "trial" || forced === "plus") {
    return { userId, planId: forced, source: "admin" };
  }

  const now = new Date().toISOString();
  const stored = await readStoredPlan(userId);

  // 首次注册：自动获得 Trial。
  if (!stored) {
    const granted: StoredPlan = {
      userId,
      planId: "trial",
      source: "trial",
      trialStartedAt: now,
      updatedAt: now,
    };
    await writeStoredPlan(granted);
    return toState(granted);
  }

  // Trial 到期：自动回到 Free。
  if (stored.planId === "trial" && stored.trialStartedAt) {
    const trialDays = getPlanConfig("trial").trialDays ?? 3;
    if (trialWindow(stored.trialStartedAt, trialDays).expired) {
      const downgraded: StoredPlan = {
        ...stored,
        planId: "free",
        source: "default",
        trialStartedAt: undefined,
        updatedAt: now,
      };
      await writeStoredPlan(downgraded);
      return toState(downgraded);
    }
  }

  return toState(stored);
}

/**
 * 预留：后台修改用户 Plan（admin）。落地 Admin 后台时必须加鉴权。
 * admin 设置的 Plan 不参与自动开通 / 自动降级。
 */
export async function setUserPlan(
  userId: string,
  planId: AIPlanId,
  source: AIPlanSource = "admin"
): Promise<UserPlanState> {
  const stored: StoredPlan = {
    userId,
    planId,
    source,
    trialStartedAt:
      planId === "trial" ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };
  await writeStoredPlan(stored);
  return toState(stored);
}
