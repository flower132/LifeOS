import { LifeObject, Note } from "@/lib/types";
import { Memory } from "@/lib/memory/types";
import { ObjectProfile } from "./types";

// ---------------------------------------------------------------------------
// Recommendation — rule-based insights derived from profiles + activity
// (no extra AI calls): Goal Insight (为什么停滞/下一步) and Project Health
// (🟢/🟡/🔴).
// ---------------------------------------------------------------------------

export interface GoalInsight {
  status: "on_track" | "stalled" | "at_risk";
  /** e.g. 过去两周没有推进。 */
  message: string;
  /** e.g. 建议每天安排30分钟。 */
  suggestion: string;
  daysSinceProgress: number;
}

export type ProjectHealthLevel = "healthy" | "attention" | "at_risk";

export interface ProjectHealth {
  level: ProjectHealthLevel;
  label: string;
  reasons: string[];
}

const STALL_DAYS = 14;
const RISK_DAYS = 30;

function daysSinceLatest(timestamps: number[], now: number): number {
  const latest = Math.max(0, ...timestamps);
  if (latest === 0) return Infinity;
  return Math.floor((now - latest) / (1000 * 60 * 60 * 24));
}

/** Goal Intelligence: 为什么没完成 / 阻碍是什么 / 下一步建议。 */
export function analyzeGoalProgress(params: {
  object: LifeObject;
  memories: Memory[];
  notes: Note[];
  profile?: ObjectProfile | null;
  now?: number;
}): GoalInsight {
  const now = params.now ?? Date.now();
  const days = daysSinceLatest(
    [
      ...params.memories.map((m) => m.timestamp),
      ...params.notes.map((n) => new Date(n.created_at).getTime()),
    ],
    now
  );

  const status: GoalInsight["status"] =
    days === Infinity ? "stalled" : days >= RISK_DAYS ? "at_risk" : days >= STALL_DAYS ? "stalled" : "on_track";

  const message =
    status === "on_track"
      ? "目标推进正常。"
      : days === Infinity
        ? "还没有任何推进记录。"
        : `过去 ${days} 天没有推进。`;

  const suggestion =
    params.profile?.opportunities[0] ??
    params.profile?.risk[0] ??
    (status === "on_track" ? "保持当前节奏。" : "建议拆解为可每天执行的最小行动。");

  return { status, message, suggestion, daysSinceProgress: days === Infinity ? -1 : days };
}

/** Project Intelligence: 🟢 Healthy / 🟡 Attention / 🔴 At Risk。 */
export function assessProjectHealth(params: {
  object: LifeObject;
  memories: Memory[];
  notes: Note[];
  profile?: ObjectProfile | null;
  now?: number;
}): ProjectHealth {
  const now = params.now ?? Date.now();
  const days = daysSinceLatest(
    [
      ...params.memories.map((m) => m.timestamp),
      ...params.notes.map((n) => new Date(n.created_at).getTime()),
    ],
    now
  );

  const reasons: string[] = [];
  let score = 0;

  if (days === Infinity) {
    score += 1;
    reasons.push("暂无进展记录");
  } else if (days >= RISK_DAYS) {
    score += 2;
    reasons.push(`已 ${days} 天没有新动态`);
  } else if (days >= STALL_DAYS) {
    score += 1;
    reasons.push(`${days} 天没有新动态`);
  }

  const riskCount = params.profile?.risk.length ?? 0;
  if (riskCount >= 3) {
    score += 2;
    reasons.push(`存在 ${riskCount} 项风险/卡点`);
  } else if (riskCount > 0) {
    score += 1;
    reasons.push(`存在 ${riskCount} 项风险/卡点`);
  }

  const level: ProjectHealthLevel = score >= 3 ? "at_risk" : score >= 1 ? "attention" : "healthy";
  const label = level === "healthy" ? "🟢 Healthy" : level === "attention" ? "🟡 Attention" : "🔴 At Risk";
  if (reasons.length === 0) reasons.push("进展正常");

  return { level, label, reasons };
}
