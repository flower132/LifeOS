import { LifeObjectType } from "@/lib/types";

// ---------------------------------------------------------------------------
// TimelineEvent — the unified time abstraction of the Knowledge Graph.
//
// EVERY change is an event; every event is DERIVED from existing graph data
// (objects / notes / memories / relations / suggestions / profiles / cache).
// Timeline data is never maintained separately — the builder synthesizes
// events with deterministic ids on demand (idempotent, cacheable).
// ---------------------------------------------------------------------------

export type TimelineEventType =
  | "object_created"
  | "object_updated"
  | "goal_created"
  | "project_started"
  | "note_created"
  | "memory_created"
  | "reflection"
  | "decision"
  | "today_focus"
  | "relation_created"
  | "relation_updated"
  | "relation_discovered" // AI found a relation (suggestion)
  | "insight_generated"
  | "profile_updated" // AI Summary 更新
  | "summary_created"; // AI 周期摘要/回放

export type TimelineActor = "user" | "ai" | "system";

export type TimelineSource =
  | "object"
  | "note"
  | "memory"
  | "relation"
  | "relation_suggestion"
  | "object_profile"
  | "intelligence_cache";

export interface TimelineEvent {
  /** Deterministic: `${type}:${sourceId}` — idempotent across rebuilds. */
  id: string;
  /** ms epoch. */
  timestamp: number;
  type: TimelineEventType;
  /** Primary object this event belongs to, when any. */
  objectId?: string;
  objectType?: LifeObjectType;
  objectName?: string;
  relationId?: string;
  projectId?: string;
  goalId?: string;
  actor: TimelineActor;
  source: TimelineSource;
  /** Source record id (for navigation/dedupe). */
  sourceId: string;
  /** Human-readable one-liner. */
  title: string;
  metadata: Record<string, unknown>;
}

/** Period stats used by diff / replay / time-travel. */
export interface TimelineStats {
  from: string;
  to: string;
  totalEvents: number;
  byType: Partial<Record<TimelineEventType, number>>;
  newObjects: number;
  newRelations: number;
  discoveredRelations: number;
  memoriesCreated: number;
  notesCreated: number;
  goalsProgressed: string[];
  projectsProgressed: string[];
  activePeople: { id: string; name: string; count: number }[];
  activeProjects: { id: string; name: string; count: number }[];
}

/** A point-in-time read-only snapshot (Time Travel). */
export interface TimeSnapshot {
  date: string;
  activeGoals: { id: string; name: string; status: string }[];
  activeProjects: { id: string; name: string; status: string }[];
  memoriesThatWeek: { id: string; date: string; text: string }[];
  peopleContacted: { id: string; name: string; count: number }[];
  todayFocusTitle?: string;
  reflectionQuestion?: string;
  graphSize: { objects: number; relations: number };
  events: TimelineEvent[];
}
