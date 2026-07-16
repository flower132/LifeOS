import { DecisionMemory } from "@/lib/types";
import { TimeRange, getTimeFacets } from "./timeEngine";

/**
 * DecisionHistory — 决策记忆。
 *
 * Decision Memory 是用户可沉淀的一手数据（decision / context / emotion /
 * reason / outcome / review）。持久化由 Store + Storage 负责；
 * 本服务提供查询与"决策模式"的数据准备（纯函数），供未来 AI 分析。
 */

export interface DecisionQuery {
  timeRange?: TimeRange;
  objectId?: string;
  emotion?: string;
  /** 只看有结果复盘的 */
  reviewedOnly?: boolean;
}

export function queryDecisions(
  decisions: DecisionMemory[],
  query: DecisionQuery = {}
): DecisionMemory[] {
  let items = [...decisions];

  if (query.objectId) {
    items = items.filter((d) => d.objectIds.includes(query.objectId as string));
  }
  if (query.emotion) {
    const emotion = query.emotion.toLowerCase();
    items = items.filter((d) => d.emotion.toLowerCase().includes(emotion));
  }
  if (query.reviewedOnly) {
    items = items.filter((d) => d.outcome || d.review);
  }
  if (query.timeRange) {
    const from = new Date(query.timeRange.from).getTime();
    const to = new Date(query.timeRange.to).getTime();
    items = items.filter((d) => {
      const t = new Date(d.decidedAt).getTime();
      return t >= from && t <= to;
    });
  }

  return items.sort(
    (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()
  );
}

/** 决策的时间分面（写入时可由 TimeEngine 统一补齐）。 */
export function getDecisionFacets(decision: DecisionMemory) {
  return getTimeFacets(decision.decidedAt);
}

/**
 * 决策模式数据准备：按情绪分组的出现次数。
 * 未来 AI 深度洞察（"你在焦虑时的决定往往…"）直接消费这份数据。
 */
export function summarizeDecisionEmotions(
  decisions: DecisionMemory[]
): { emotion: string; count: number; withOutcome: number }[] {
  const map = new Map<string, { count: number; withOutcome: number }>();
  for (const d of decisions) {
    const key = d.emotion.trim();
    if (!key) continue;
    const entry = map.get(key) ?? { count: 0, withOutcome: 0 };
    entry.count += 1;
    if (d.outcome || d.review) entry.withOutcome += 1;
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([emotion, v]) => ({ emotion, ...v }))
    .sort((a, b) => b.count - a.count);
}

/** 待复盘的决策（有 decidedAt 但还没有 outcome/review，按时间正序）。 */
export function getDecisionsAwaitingReview(
  decisions: DecisionMemory[]
): DecisionMemory[] {
  return decisions
    .filter((d) => !d.outcome && !d.review)
    .sort(
      (a, b) => new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime()
    );
}
