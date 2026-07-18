import { useObjectStore } from "@/stores/objectStore";
import { TimelineEvent } from "./types";
import { getTimelineEvents } from "./timelineBuilder";

// ---------------------------------------------------------------------------
// Timeline Insights — rule-based insights for the home card, all derived
// from the timeline (streaks, fastest-growing relation, slowing momentum).
// ---------------------------------------------------------------------------

export interface TimelineInsight {
  id: string;
  kind: "streak" | "fastest_growing" | "slowing_down" | "milestone";
  title: string;
  detail: string;
  objectId?: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Consecutive days (ending today) with memory/note events for an object. */
function streakDays(events: TimelineEvent[], objectId: string): number {
  const days = new Set(
    events
      .filter(
        (e) =>
          (e.source === "memory" || e.type === "note_created") &&
          (e.objectId === objectId || e.metadata.otherObjectId === objectId)
      )
      .map((e) => new Date(e.timestamp).toISOString().slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak++;
    cursor.setTime(cursor.getTime() - DAY_MS);
    if (streak > 365) break;
  }
  return streak;
}

export function computeTimelineInsights(): TimelineInsight[] {
  if (typeof window === "undefined") return [];
  const events = getTimelineEvents();
  const objects = useObjectStore.getState().objects;
  const insights: TimelineInsight[] = [];

  // 1. Streak: longest current run of consecutive active days per goal/project.
  const candidates = objects.filter((o) => o.type === "goal" || o.type === "project");
  let bestStreak = { objectId: "", name: "", days: 0 };
  for (const o of candidates) {
    const days = streakDays(events, o.id);
    if (days > bestStreak.days) bestStreak = { objectId: o.id, name: o.name, days };
  }
  if (bestStreak.days >= 3) {
    insights.push({
      id: `streak:${bestStreak.objectId}`,
      kind: "streak",
      title: `你已经连续推进：${bestStreak.name} ${bestStreak.days} 天。`,
      detail: "保持节奏。",
      objectId: bestStreak.objectId,
    });
  }

  // 2. Fastest-growing relation (last 30d vs previous 30d by interaction count).
  const now = Date.now();
  const interactionCount = (objectId: string, from: number, to: number) =>
    events.filter(
      (e) =>
        (e.source === "memory" || e.type === "note_created") &&
        (e.objectId === objectId || e.metadata.otherObjectId === objectId) &&
        e.timestamp >= from &&
        e.timestamp < to
    ).length;

  let fastest = { objectId: "", name: "", delta: 0 };
  for (const o of objects.filter((x) => x.type === "person")) {
    const recent = interactionCount(o.id, now - 30 * DAY_MS, now);
    const previous = interactionCount(o.id, now - 60 * DAY_MS, now - 30 * DAY_MS);
    const delta = recent - previous;
    if (delta > fastest.delta) fastest = { objectId: o.id, name: o.name, delta };
  }
  if (fastest.delta >= 2) {
    insights.push({
      id: `growing:${fastest.objectId}`,
      kind: "fastest_growing",
      title: `最近联系增长最快的是：${fastest.name}。`,
      detail: `最近 30 天互动 +${fastest.delta} 次。`,
      objectId: fastest.objectId,
    });
  }

  // 3. Slowing projects (recent 30d activity < half of previous 30d).
  for (const o of objects.filter((x) => x.type === "project")) {
    const recent = interactionCount(o.id, now - 30 * DAY_MS, now);
    const previous = interactionCount(o.id, now - 60 * DAY_MS, now - 30 * DAY_MS);
    if (previous >= 4 && recent * 2 < previous) {
      insights.push({
        id: `slowing:${o.id}`,
        kind: "slowing_down",
        title: `最近一个月：「${o.name}」推进速度下降。`,
        detail: "建议重新安排优先级。",
        objectId: o.id,
      });
    }
  }

  return insights.slice(0, 4);
}
