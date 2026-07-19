import { useObjectStore } from "@/stores/objectStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TimelineEvent } from "./types";
import { getTimelineEvents } from "./timelineBuilder";
import { resolveTranslation, interpolate, localeFromLanguage } from "@/translations";

/** Translate an insight key in the given language (falls back to key). */
function tt(
  key: string,
  language: "zh" | "en",
  vars: Record<string, string | number> = {}
): string {
  const locale = localeFromLanguage(language);
  const text = resolveTranslation(key, locale, vars);
  return interpolate(text ?? key, vars);
}

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

export function computeTimelineInsights(language?: "zh" | "en"): TimelineInsight[] {
  if (typeof window === "undefined") return [];
  const lang = language ?? useSettingsStore.getState().language ?? "en";
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
      title: tt("insight.streak.title", lang, { name: bestStreak.name, days: String(bestStreak.days) }),
      detail: tt("insight.streak.detail", lang),
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
      title: tt("insight.growing.title", lang, { name: fastest.name }),
      detail: tt("insight.growing.detail", lang, { delta: String(fastest.delta) }),
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
        title: tt("insight.slowing.title", lang, { name: o.name }),
        detail: tt("insight.slowing.detail", lang),
        objectId: o.id,
      });
    }
  }

  return insights.slice(0, 4);
}
