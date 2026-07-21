// ---------------------------------------------------------------------------
// Graph Timeline — the time dimension of the Knowledge Graph. Unified entry
// for every AI/UI consumer; nothing here maintains separate timeline data.
// ---------------------------------------------------------------------------

// Types
export type {
  TimelineEvent,
  TimelineEventType,
  TimelineActor,
  TimelineSource,
  TimelineStats,
  TimeSnapshot,
} from "./types";

// Builder (derived, cached, lazy)
export {
  buildTimeline,
  getTimelineEvents,
  buildObjectTimeline,
  buildRelationTimeline,
  buildGoalTimeline,
} from "./timelineBuilder";

// Query
export { queryTimeline, parseTimeExpression, matchEventsForQuestion } from "./timelineQuery";
export type { TimelineQuery, ParsedTimeRange } from "./timelineQuery";

// Rank
export { scoreEvent, rankTimelineEvents } from "./timelineRank";

// Summary (AI, timeline-fed)
export {
  summarizeTimeline,
  summarizeObjectEvolution,
  summarizeRelationEvolution,
  getCachedEvolution,
  getCachedTimelineSummary,
} from "./timelineSummary";
export type { TimelinePeriod } from "./timelineSummary";

// Diff (comparison)
export { computeTimelineStats, compareTimeline, compareRecentWindows } from "./timelineDiff";
export type { TimelineComparison } from "./timelineDiff";

// Chapters
export {
  generateAIChapters,
  renameChapter,
  mergeChapters,
  splitChapter,
} from "./chapters";

// Time Travel (read-only)
export { getSnapshotAt, presetDate, generateTimeTravelAdvice } from "./timeTravel";
export type { TimeTravelPreset } from "./timeTravel";

// Life Replay
export { getReplay, generateReplay, replayRange } from "./replay";
export type { ReplayPeriod } from "./replay";

// Insights (home card)
export { computeTimelineInsights } from "./insights";
export type { TimelineInsight } from "./insights";

// Timeline Q&A (grounded)
export { answerTimelineQuestion } from "./qa";
