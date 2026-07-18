import { Language } from "@/lib/i18n";
import { LifeObject, Note } from "@/lib/types";
import { storage } from "@/lib/storage";
import { useMemoryStore } from "@/stores/memoryStore";
import { useObjectStore } from "@/stores/objectStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { rankMemories } from "@/lib/ai/context/relevance";
import { applyExtractedRelations } from "@/lib/relations";
import { processAIContent, processNote } from "./processor";
import { periodKey, summarizePeriod, SummaryPeriod } from "./summarizer";
import { buildTimeline, groupByMonth, TimelineEntry } from "./timeline";
import { LONG_TERM_THRESHOLD, Memory } from "./types";
import { personMemory } from "./strategies/personMemory";
import { goalMemory } from "./strategies/goalMemory";
import { projectMemory } from "./strategies/projectMemory";
import { eventMemory } from "./strategies/eventMemory";
import { selfMemory } from "./strategies/selfMemory";
import { memoriesForObject, ObjectKnowledgeStrategy } from "./strategies/shared";

// ---------------------------------------------------------------------------
// Memory Service — the public facade of the Memory & Knowledge Layer.
//
//   Raw Input → processor pipeline → persisted Memory
//   AI consumers → getRelevantMemories / getObjectKnowledge / getTimeline
//
// Persistence flows through the active storage adapter (Local Mode and
// Cloud Mode share the same record shape; sync keeps ids/timestamps/relations
// intact across migration).
// ---------------------------------------------------------------------------

const TYPE_STRATEGIES: Partial<Record<LifeObject["type"], ObjectKnowledgeStrategy>> = {
  person: personMemory,
  goal: goalMemory,
  project: projectMemory,
  event: eventMemory,
};

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

async function ensureLoaded(): Promise<Memory[]> {
  const store = useMemoryStore.getState();
  if (!store.loaded && !store._loading) {
    await store.load();
  }
  return useMemoryStore.getState().memories;
}

/** Kick off a background load on first read; returns current state. */
function readSync(): Memory[] {
  if (typeof window === "undefined") return [];
  const store = useMemoryStore.getState();
  if (!store.loaded && !store._loading) {
    void store.load();
  }
  return store.memories;
}

/** Adapt a Memory to the Note shape the relevance scorer expects. */
function asScoreableNote(memory: Memory): Note {
  return {
    id: memory.id,
    object_id: memory.relations[0]?.targetId ?? null,
    content: `${memory.summary ?? ""}\n${memory.content}\n${memory.topics.join(" ")}`,
    sourceType: "text",
    attachments: [],
    created_at: new Date(memory.timestamp).toISOString(),
  };
}

class MemoryService {
  /**
   * Process a newly saved note through the pipeline and persist the Memory.
   * Also applies AI-extracted relations to the Knowledge Graph.
   * Fire-and-forget from the note store — never throws.
   */
  async ingestNote(note: Note): Promise<Memory | null> {
    const result = await processNote(note);
    if (!result) return null;
    const created = await storage.createMemory(result.memory);
    useMemoryStore.getState().upsertLocal(created);

    // Knowledge Graph: relation extraction is a best-effort side effect.
    if (result.extractedRelations.length > 0) {
      try {
        await applyExtractedRelations({
          relations: result.extractedRelations,
          objects: useObjectStore.getState().objects,
          sourceMemoryId: created.id,
        });
      } catch (err) {
        console.warn("[memory] Relation extraction failed:", err);
      }
    }

    return created;
  }

  /** Process AI-generated content into a Memory. */
  async ingestAIContent(content: string, type?: Memory["type"]): Promise<Memory | null> {
    const result = await processAIContent({ content, type });
    if (!result) return null;
    const created = await storage.createMemory(result.memory);
    useMemoryStore.getState().upsertLocal(created);

    if (result.extractedRelations.length > 0) {
      try {
        await applyExtractedRelations({
          relations: result.extractedRelations,
          objects: useObjectStore.getState().objects,
          sourceMemoryId: created.id,
        });
      } catch (err) {
        console.warn("[memory] Relation extraction failed:", err);
      }
    }

    return created;
  }

  /**
   * Long-term memories relevant to the current task — feeds the Context
   * Engine. Long-term (high-importance) memories rank first, then relevance.
   */
  async getRelevantMemories(
    signals: { objectId?: string; objectName?: string; query?: string },
    limit = 5
  ): Promise<Memory[]> {
    const memories = await ensureLoaded();
    if (memories.length === 0) return [];

    const byId = new Map(memories.map((m) => [m.id, m]));
    return rankMemories(memories.map(asScoreableNote), signals)
      .slice(0, limit * 2)
      .map((scored) => byId.get(scored.note.id)!)
      .filter(Boolean)
      .sort(
        (a, b) =>
          Number(b.importance >= LONG_TERM_THRESHOLD) -
            Number(a.importance >= LONG_TERM_THRESHOLD) || b.importance - a.importance
      )
      .slice(0, limit);
  }

  /** Durable knowledge lines about an object, built from linked memories. */
  async getObjectKnowledge(objectId: string): Promise<string[]> {
    const memories = await ensureLoaded();
    const linked = memoriesForObject(objectId, memories);
    if (linked.length === 0) return [];

    const objects = useObjectStore.getState().objects;
    const object = objects.find((o) => o.id === objectId);
    if (!object) return [];

    if (object.type === "self") return selfMemory(linked);
    const strategy = TYPE_STRATEGIES[object.type];
    return strategy ? strategy(object, linked) : [];
  }

  /** Personal knowledge lines across all memories (for self contexts). */
  async getSelfKnowledge(): Promise<string[]> {
    const memories = await ensureLoaded();
    const longTerm = memories.filter((m) => m.importance >= LONG_TERM_THRESHOLD);
    return selfMemory(longTerm.length > 0 ? longTerm : memories.slice(0, 20));
  }

  /** Life timeline from important memories. */
  async getTimeline(): Promise<TimelineEntry[]> {
    return buildTimeline(await ensureLoaded());
  }

  async getTimelineByMonth(): Promise<{ monthKey: string; entries: TimelineEntry[] }[]> {
    return groupByMonth(await this.getTimeline());
  }

  /**
   * Get-or-generate a period summary, stored as a "summary" Memory so future
   * AI consumes the summary instead of raw text.
   */
  async summarize(period: SummaryPeriod, at = new Date()): Promise<Memory | null> {
    const key = periodKey(period, at);
    const memories = await ensureLoaded();

    const existing = memories.find(
      (m) => m.type === "summary" && m.topics.includes(key)
    );
    if (existing) return existing;

    const inPeriod = memories.filter((m) => m.type !== "summary" && m.topics.length >= 0 && inPeriodRange(period, key, m.timestamp));
    const text = await summarizePeriod({
      period,
      key,
      memories: inPeriod,
      language: getLanguage(),
    });
    if (!text) return null;

    const created = await storage.createMemory({
      type: "summary",
      content: text,
      summary: text.slice(0, 40),
      entities: { people: [], projects: [], goals: [], places: [] },
      topics: [key],
      insights: [],
      importance: 0.7,
      timestamp: at.getTime(),
      source: { type: "ai" },
      relations: [],
    });
    useMemoryStore.getState().upsertLocal(created);
    return created;
  }

  // ── Sync readers (Context Engine — synchronous, store-backed) ────────────

  /** Sync variant of getRelevantMemories for the (sync) Context Engine. */
  getRelevantMemoriesSync(
    signals: { objectId?: string; objectName?: string; query?: string },
    limit = 5
  ): Memory[] {
    const memories = readSync();
    if (memories.length === 0) return [];
    const byId = new Map(memories.map((m) => [m.id, m]));
    return rankMemories(memories.map(asScoreableNote), signals)
      .slice(0, limit * 2)
      .map((scored) => byId.get(scored.note.id)!)
      .filter(Boolean)
      .sort(
        (a, b) =>
          Number(b.importance >= LONG_TERM_THRESHOLD) -
            Number(a.importance >= LONG_TERM_THRESHOLD) || b.importance - a.importance
      )
      .slice(0, limit);
  }

  /** Sync variant of getObjectKnowledge for the Context Engine. */
  getObjectKnowledgeSync(objectId: string): string[] {
    const linked = memoriesForObject(objectId, readSync());
    if (linked.length === 0) return [];
    const objects = useObjectStore.getState().objects;
    const object = objects.find((o) => o.id === objectId);
    if (!object) return [];
    if (object.type === "self") return selfMemory(linked);
    const strategy = TYPE_STRATEGIES[object.type];
    return strategy ? strategy(object, linked) : [];
  }

  /** Sync variant of getSelfKnowledge for the Context Engine. */
  getSelfKnowledgeSync(): string[] {
    const memories = readSync();
    if (memories.length === 0) return [];
    const longTerm = memories.filter((m) => m.importance >= LONG_TERM_THRESHOLD);
    return selfMemory(longTerm.length > 0 ? longTerm : memories.slice(0, 20));
  }

  /**
   * Object deletion policy: memories are NEVER deleted with the object —
   * links are removed and history is preserved (Test 4 requirement).
   */
  async unlinkObjects(objectIds: string[]): Promise<void> {    if (objectIds.length === 0) return;
    const ids = new Set(objectIds);
    const store = useMemoryStore.getState();
    const affected = store.memories.filter(
      (m) =>
        m.relations.some((r) => ids.has(r.targetId)) ||
        m.entities.people.some((id) => ids.has(id)) ||
        m.entities.projects.some((id) => ids.has(id)) ||
        m.entities.goals.some((id) => ids.has(id))
    );

    for (const memory of affected) {
      const updated = await storage.updateMemory(memory.id, {
        relations: memory.relations.filter((r) => !ids.has(r.targetId)),
        entities: {
          people: memory.entities.people.filter((id) => !ids.has(id)),
          projects: memory.entities.projects.filter((id) => !ids.has(id)),
          goals: memory.entities.goals.filter((id) => !ids.has(id)),
          places: memory.entities.places,
        },
      });
      store.upsertLocal(updated);
    }
  }
}

function inPeriodRange(period: SummaryPeriod, key: string, timestamp: number): boolean {
  const date = new Date(timestamp).toISOString().slice(0, 10);
  switch (period) {
    case "day":
      return `day:${date}` === key;
    case "week":
      return periodKey("week", new Date(timestamp)) === key;
    case "month":
      return `month:${date.slice(0, 7)}` === key;
    case "year":
      return `year:${date.slice(0, 4)}` === key;
  }
}

export const memoryService = new MemoryService();
