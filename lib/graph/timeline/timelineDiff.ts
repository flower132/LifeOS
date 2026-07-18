import { TimelineEvent, TimelineStats } from "./types";
import { queryTimeline } from "./timelineQuery";

// ---------------------------------------------------------------------------
// Timeline Diff — period-over-period comparison ("过去 vs 现在"), with
// rule-based change analysis (no LLM needed for the numbers).
// ---------------------------------------------------------------------------

export function computeTimelineStats(from: number, to: number, label?: string): TimelineStats {
  const events = queryTimeline({ from, to, limit: 2000 });

  const byType: TimelineStats["byType"] = {};
  for (const e of events) {
    byType[e.type] = (byType[e.type] ?? 0) + 1;
  }

  const countByObject = new Map<string, { name: string; count: number }>();
  for (const e of events) {
    if (e.source !== "memory" && e.type !== "note_created") continue;
    const id = e.objectId ?? (e.metadata.otherObjectId as string | undefined);
    if (!id || !e.objectName) continue;
    const entry = countByObject.get(id) ?? { name: e.objectName, count: 0 };
    entry.count++;
    countByObject.set(id, entry);
  }

  const progressOf = (kind: "goal" | "project") =>
    [
      ...new Set(
        events
          .filter((e) => (kind === "goal" ? e.goalId : e.projectId))
          .map((e) => (kind === "goal" ? e.goalId! : e.projectId!))
      ),
    ];

  return {
    from: label ?? new Date(from).toISOString().slice(0, 10),
    to: new Date(to).toISOString().slice(0, 10),
    totalEvents: events.length,
    byType,
    newObjects: byType.object_created ?? 0,
    newRelations: byType.relation_created ?? 0,
    discoveredRelations: byType.relation_discovered ?? 0,
    memoriesCreated: byType.memory_created ?? 0,
    notesCreated: byType.note_created ?? 0,
    goalsProgressed: progressOf("goal"),
    projectsProgressed: progressOf("project"),
    activePeople: topObjects(events, "person", 5),
    activeProjects: topObjects(events, "project", 5),
  };
}

function topObjects(
  events: TimelineEvent[],
  type: string,
  limit: number
): { id: string; name: string; count: number }[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const e of events) {
    if (e.objectType !== type || !e.objectId || !e.objectName) continue;
    if (e.source !== "memory" && e.type !== "note_created" && e.type !== "relation_created") continue;
    const entry = counts.get(e.objectId) ?? { name: e.objectName, count: 0 };
    entry.count++;
    counts.set(e.objectId, entry);
  }
  return [...counts.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface TimelineComparison {
  before: TimelineStats;
  after: TimelineStats;
  /** Rule-based change lines, e.g. "你的关系网络比半年前增加了 15%。" */
  changes: string[];
}

export function compareTimeline(params: {
  beforeFrom: number;
  beforeTo: number;
  afterFrom: number;
  afterTo: number;
  beforeLabel?: string;
  afterLabel?: string;
}): TimelineComparison {
  const before = computeTimelineStats(params.beforeFrom, params.beforeTo, params.beforeLabel);
  const after = computeTimelineStats(params.afterFrom, params.afterTo, params.afterLabel);
  const changes: string[] = [];

  const relationDelta =
    before.newRelations > 0
      ? Math.round(((after.newRelations - before.newRelations) / before.newRelations) * 100)
      : after.newRelations > 0
        ? 100
        : 0;
  if (after.newRelations > before.newRelations) {
    changes.push(
      `你的关系网络比${params.beforeLabel ?? "之前"}增加了 ${Math.max(relationDelta, 1)}%（新增 ${after.newRelations} 条关系）。`
    );
  } else if (after.newRelations < before.newRelations) {
    changes.push(`新增关系减少（${before.newRelations} → ${after.newRelations}）。`);
  }

  if (after.newRelations > 0) {
    changes.push(`期间新增了 ${after.newRelations} 条重要连接。`);
  }
  if (after.discoveredRelations > 0) {
    changes.push(`AI 自动发现了 ${after.discoveredRelations} 条潜在新关系。`);
  }

  const beforeActive = before.totalEvents;
  const afterActive = after.totalEvents;
  if (beforeActive > 0) {
    const delta = Math.round(((afterActive - beforeActive) / beforeActive) * 100);
    if (delta >= 20) changes.push(`整体活跃度提升了 ${delta}%。`);
    else if (delta <= -20) changes.push(`整体活跃度下降了 ${Math.abs(delta)}%。`);
  }

  if (after.goalsProgressed.length > before.goalsProgressed.length) {
    changes.push(`目标推进面扩大（${before.goalsProgressed.length} → ${after.goalsProgressed.length} 个目标有进展）。`);
  }

  const sharedBefore = new Set(before.projectsProgressed);
  const slowed = after.projectsProgressed.filter((p) => sharedBefore.has(p));
  if (slowed.length < sharedBefore.size && sharedBefore.size > 0) {
    changes.push("部分此前活跃的项目最近安静下来。");
  }

  if (changes.length === 0) {
    changes.push("两个时期的活动水平基本持平。");
  }

  return { before, after, changes };
}

/** Convenience: same-length window ending now vs the window before it. */
export function compareRecentWindows(days: number): TimelineComparison {
  const DAY_MS = 1000 * 60 * 60 * 24;
  const now = Date.now();
  return compareTimeline({
    beforeFrom: now - days * 2 * DAY_MS,
    beforeTo: now - days * DAY_MS,
    afterFrom: now - days * DAY_MS,
    afterTo: now,
    beforeLabel: `前 ${days} 天`,
    afterLabel: `最近 ${days} 天`,
  });
}
