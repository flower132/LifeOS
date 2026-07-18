import { TimelineEvent, TimelineEventType } from "./types";

// ---------------------------------------------------------------------------
// Timeline Rank — which events matter most (for display and prompt TopK).
// ---------------------------------------------------------------------------

const TYPE_WEIGHT: Record<TimelineEventType, number> = {
  goal_created: 0.9,
  project_started: 0.9,
  decision: 0.85,
  relation_created: 0.8,
  relation_updated: 0.55,
  relation_discovered: 0.6,
  insight_generated: 0.65,
  object_created: 0.7,
  object_updated: 0.3,
  memory_created: 0.5,
  note_created: 0.35,
  reflection: 0.5,
  today_focus: 0.45,
  profile_updated: 0.3,
  summary_created: 0.4,
};

const DAY_MS = 1000 * 60 * 60 * 24;

/** 0..1 importance of one event. */
export function scoreEvent(event: TimelineEvent, now = Date.now()): number {
  const typeScore = TYPE_WEIGHT[event.type] ?? 0.4;
  const memoryImportance =
    typeof event.metadata.importance === "number" ? event.metadata.importance : 0.4;
  const ageDays = Math.max(0, (now - event.timestamp) / DAY_MS);
  const recency = Math.pow(0.5, ageDays / 90); // 90-day half-life
  return (
    Math.round(
      (0.5 * typeScore + 0.3 * memoryImportance + 0.2 * recency) * 1000
    ) / 1000
  );
}

/** Rank events by importance (descending), capped at topK. */
export function rankTimelineEvents(
  events: TimelineEvent[],
  topK = 20,
  now = Date.now()
): (TimelineEvent & { score: number })[] {
  return events
    .map((e) => ({ ...e, score: scoreEvent(e, now) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
