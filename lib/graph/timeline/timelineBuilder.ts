import { LifeObject } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { useRelationSuggestionStore } from "@/stores/relationSuggestionStore";
import { useObjectIntelligenceStore } from "@/stores/objectIntelligenceStore";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { TimelineEvent, TimelineEventType } from "./types";

// ---------------------------------------------------------------------------
// Timeline Builder — derives the unified event stream from graph data.
//
//   禁止单独维护 Timeline 数据：events are synthesized on demand with
//   deterministic ids, cached per data-version, rebuilt lazily only when
//   the underlying stores change (never a full-graph rescan per query).
// ---------------------------------------------------------------------------

function isoToMs(iso: string): number {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function event(
  type: TimelineEventType,
  sourceId: string,
  timestamp: number,
  title: string,
  extra: Partial<TimelineEvent> = {}
): TimelineEvent | null {
  if (!sourceId || timestamp <= 0) return null;
  return {
    id: `${type}:${sourceId}`,
    timestamp,
    type,
    actor: "user",
    source: "object",
    sourceId,
    title,
    metadata: {},
    ...extra,
  };
}

/** Full derivation pass over current store state. */
function deriveEvents(): TimelineEvent[] {
  const objects = useObjectStore.getState().objects;
  const notes = useNoteStore.getState().notes;
  const relations = useRelationStore.getState().relations;
  const memories = useMemoryStore.getState().memories;
  const suggestions = useRelationSuggestionStore.getState().suggestions;
  const profiles = useObjectIntelligenceStore.getState().profiles;
  const cache = useIntelligenceStore.getState().cache;

  const objectById = new Map(objects.map((o) => [o.id, o]));
  const objectRef = (o: LifeObject) => ({
    objectId: o.id,
    objectType: o.type,
    objectName: o.name,
    ...(o.type === "goal" ? { goalId: o.id } : {}),
    ...(o.type === "project" ? { projectId: o.id } : {}),
  });

  const events: TimelineEvent[] = [];
  const push = (e: TimelineEvent | null) => {
    if (e) events.push(e);
  };

  // ── Objects ────────────────────────────────────────────────────────────
  for (const o of objects) {
    const createdType: TimelineEventType =
      o.type === "goal" ? "goal_created" : o.type === "project" ? "project_started" : "object_created";
    push(
      event(createdType, o.id, isoToMs(o.created_at), `创建${o.type}「${o.name}」`, {
        ...objectRef(o),
        actor: "user",
      })
    );
    if (o.updated_at && o.updated_at !== o.created_at) {
      push(
        event("object_updated", `${o.id}:${o.updated_at}`, isoToMs(o.updated_at), `更新「${o.name}」`, {
          ...objectRef(o),
        })
      );
    }
    for (const insight of o.aiInsights ?? []) {
      push(
        event("insight_generated", insight.id, isoToMs(insight.createdAt), `AI 洞察：${insight.title}`, {
          ...objectRef(o),
          actor: "ai",
          source: "object",
          metadata: { category: insight.category },
        })
      );
    }
  }

  // ── Notes ──────────────────────────────────────────────────────────────
  for (const n of notes) {
    const target = n.object_id ? objectById.get(n.object_id) : undefined;
    push(
      event("note_created", n.id, isoToMs(n.created_at), n.content.slice(0, 50), {
        source: "note",
        ...(target ? objectRef(target) : {}),
      })
    );
  }

  // ── Unified memories ───────────────────────────────────────────────────
  for (const m of memories) {
    const type: TimelineEventType =
      m.type === "reflection" ? "reflection" : m.type === "decision" ? "decision" : m.type === "summary" ? "summary_created" : "memory_created";
    const primaryTarget = m.relations[0]
      ? objectById.get(m.relations[0].targetId)
      : undefined;
    push(
      event(type, m.id, m.timestamp, m.summary ?? m.content.slice(0, 50), {
        source: "memory",
        actor: m.source.type === "ai" ? "ai" : "user",
        metadata: { importance: m.importance, memoryType: m.type, topics: m.topics },
        ...(primaryTarget ? objectRef(primaryTarget) : {}),
      })
    );
  }

  // ── Relations ──────────────────────────────────────────────────────────
  for (const r of relations) {
    const source = objectById.get(r.source_object_id);
    const target = objectById.get(r.target_object_id);
    const label = `${source?.name ?? "?"} · ${r.label ?? r.type} · ${target?.name ?? "?"}`;
    push(
      event("relation_created", r.id, isoToMs(r.created_at), `建立关系：${label}`, {
        source: "relation",
        relationId: r.id,
        actor: r.createdBy === "ai" ? "ai" : "user",
        ...(source ? objectRef(source) : {}),
        metadata: { otherObjectId: r.target_object_id, relationType: r.type, label: r.label },
      })
    );
    if (r.updated_at && r.updated_at !== r.created_at) {
      push(
        event("relation_updated", `${r.id}:${r.updated_at}`, isoToMs(r.updated_at), `关系变化：${label}`, {
          source: "relation",
          relationId: r.id,
          actor: r.createdBy === "ai" ? "ai" : "user",
          ...(source ? objectRef(source) : {}),
          metadata: { otherObjectId: r.target_object_id, confidence: r.confidence },
        })
      );
    }
  }

  // ── AI relation discovery (suggestions) ────────────────────────────────
  for (const s of suggestions) {
    const from = objectById.get(s.fromObjectId);
    push(
      event("relation_discovered", s.id, isoToMs(s.createdAt), `AI 发现关系：${from?.name ?? "?"} · ${s.label ?? s.type} · ${objectById.get(s.toObjectId)?.name ?? "?"}`, {
        source: "relation_suggestion",
        actor: "ai",
        ...(from ? objectRef(from) : {}),
        metadata: { status: s.status, confidence: s.confidence },
      })
    );
  }

  // ── AI profiles (AI Summary 更新) ──────────────────────────────────────
  for (const p of Object.values(profiles)) {
    const o = objectById.get(p.objectId);
    push(
      event("profile_updated", `${p.id}:${p.updatedAt}`, isoToMs(p.updatedAt), `AI 画像更新：${o?.name ?? "?"}`, {
        source: "object_profile",
        actor: "ai",
        ...(o ? objectRef(o) : {}),
        metadata: { confidence: p.profile.confidence },
      })
    );
  }

  // ── Companion cache: reflections + today focus ─────────────────────────
  for (const r of cache.reflections ?? []) {
    push(
      event("reflection", r.id, isoToMs(r.createdAt), `反思：${r.question}`, {
        source: "intelligence_cache",
        actor: "ai",
        metadata: { status: r.status, date: r.date },
      })
    );
  }
  for (const f of cache.todayFocuses ?? []) {
    const target = f.objectId ? objectById.get(f.objectId) : undefined;
    push(
      event("today_focus", `${f.id}:${f.date}`, isoToMs(`${f.date}T09:00:00`), `今日焦点：${f.title}`, {
        source: "intelligence_cache",
        actor: "ai",
        relationId: f.relationId,
        ...(target ? objectRef(target) : {}),
        metadata: { date: f.date, sourceType: f.sourceType },
      })
    );
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// ---------------------------------------------------------------------------
// Versioned cache — rebuild only when the underlying data actually changed.
// ---------------------------------------------------------------------------

interface CacheEntry {
  version: string;
  events: TimelineEvent[];
}

let cacheEntry: CacheEntry | null = null;

function computeVersion(): string {
  const objects = useObjectStore.getState().objects;
  const notes = useNoteStore.getState().notes;
  const relations = useRelationStore.getState().relations;
  const memories = useMemoryStore.getState().memories;
  const suggestions = useRelationSuggestionStore.getState().suggestions;
  const profiles = useObjectIntelligenceStore.getState().profiles;
  const cache = useIntelligenceStore.getState().cache;

  const maxUpdated = Math.max(
    0,
    ...objects.map((o) => isoToMs(o.updated_at)),
    ...relations.map((r) => isoToMs(r.updated_at ?? r.created_at)),
    ...memories.map((m) => m.timestamp),
    ...Object.values(profiles).map((p) => isoToMs(p.updatedAt))
  );

  return [
    objects.length,
    notes.length,
    relations.length,
    memories.length,
    suggestions.length,
    Object.keys(profiles).length,
    (cache.reflections ?? []).length,
    (cache.todayFocuses ?? []).length,
    maxUpdated,
  ].join("|");
}

/**
 * The unified timeline event stream (newest first). Lazy Build: derives on
 * first call, then only when store data changes.
 */
export function getTimelineEvents(): TimelineEvent[] {
  if (typeof window === "undefined") return [];
  const version = computeVersion();
  if (cacheEntry && cacheEntry.version === version) {
    return cacheEntry.events;
  }
  const events = deriveEvents();
  cacheEntry = { version, events };
  return events;
}

/** Object Timeline: every event touching this object (memories via links). */
export function buildObjectTimeline(objectId: string): TimelineEvent[] {
  const memories = useMemoryStore.getState().memories;
  const linkedMemoryIds = new Set(
    memories
      .filter((m) => m.relations.some((r) => r.targetId === objectId))
      .map((m) => m.id)
  );
  return getTimelineEvents().filter(
    (e) =>
      e.objectId === objectId ||
      e.goalId === objectId ||
      e.projectId === objectId ||
      (e.source === "memory" && linkedMemoryIds.has(e.sourceId)) ||
      (e.metadata.otherObjectId === objectId)
  );
}

/** Relation Timeline: events for one edge + shared-memory events. */
export function buildRelationTimeline(relationId: string): TimelineEvent[] {
  const relation = useRelationStore.getState().relations.find((r) => r.id === relationId);
  if (!relation) return [];
  const pair = [relation.source_object_id, relation.target_object_id];
  return getTimelineEvents().filter(
    (e) =>
      e.relationId === relationId ||
      (e.source === "memory" &&
        pair.every((id) => {
          const m = useMemoryStore.getState().memories.find((mem) => mem.id === e.sourceId);
          return m?.relations.some((r) => r.targetId === id);
        }))
  );
}

/** Goal/Project Roadmap: milestone events for one goal/project. */
export function buildGoalTimeline(goalId: string): TimelineEvent[] {
  return buildObjectTimeline(goalId).filter((e) =>
    [
      "goal_created",
      "project_started",
      "memory_created",
      "note_created",
      "insight_generated",
      "summary_created",
      "today_focus",
      "reflection",
      "decision",
      "profile_updated",
    ].includes(e.type)
  );
}

/** Alias matching the module contract. */
export function buildTimeline(): TimelineEvent[] {
  return getTimelineEvents();
}
