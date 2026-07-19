import { LifeObject } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { useRelationStore } from "@/stores/relationStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { traverseGraph } from "@/lib/graph/traversal";
import { rankContext } from "@/lib/graph/ranking";
import { memoriesForObject } from "@/lib/memory/strategies/shared";
import { memoryService } from "@/lib/memory/memoryService";
import { queryTimeline } from "@/lib/graph/timeline/timelineQuery";
import { BrainDecision, BrainRetrieval } from "./brainTypes";

// ---------------------------------------------------------------------------
// Brain Retriever — given the question + decision, selects exactly which
// objects / relations / memories / timeline events / reflections enter the
// context. Nothing else reaches the prompt.
// ---------------------------------------------------------------------------

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

/** Find the object the user is talking about (by explicit id or name mention). */
export function resolveFocusObject(
  question: string,
  explicitObjectId?: string
): LifeObject | undefined {
  const objects = useObjectStore.getState().objects;
  if (explicitObjectId) {
    return objects.find((o) => o.id === explicitObjectId);
  }
  const q = normalize(question);
  if (!q) return undefined;

  // Longest-name-first so "张伟（老板）" wins over "张伟".
  const byNameLength = [...objects].sort((a, b) => b.name.length - a.name.length);
  return byNameLength.find((o) => {
    const name = normalize(o.name);
    return name.length >= 2 && q.includes(name);
  });
}

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Retrieve the world slice for this question.
 * Only the decision-approved layers are populated.
 */
export function retrieveContext(params: {
  question: string;
  decision: BrainDecision;
  focusObjectId?: string;
}): BrainRetrieval {
  const { question, decision } = params;
  const result: BrainRetrieval = {
    relatedObjects: [],
    relations: [],
    memories: [],
    timelineEvents: [],
    reflections: [],
    knowledgeLines: [],
    insightLines: [],
  };
  if (typeof window === "undefined") return result;

  const focus = resolveFocusObject(question, params.focusObjectId);
  result.focusObject = focus;

  const relations = useRelationStore.getState().relations;
  const memories = useMemoryStore.getState().memories;

  // ── Graph layer (Graph Intelligence computes; Brain never recomputes) ──
  if (decision.includeGraph) {
    const originId = focus?.id ?? useObjectStore.getState().objects.find((o) => o.type === "self")?.id;
    if (originId) {
      const nodes = traverseGraph({
        originId,
        objects: useObjectStore.getState().objects,
        relations,
        hops: decision.graphHops || 1,
      });
      result.relatedObjects = rankContext(
        { originId, nodes, memories, relations },
        12
      );
    }
    result.relations = focus
      ? relations.filter(
          (r) => r.source_object_id === focus.id || r.target_object_id === focus.id
        )
      : [];
  }

  // ── Memory layer (long-term knowledge + relevant memories) ──
  if (decision.includeMemories) {
    result.memories = focus
      ? memoriesForObject(focus.id, memories).slice(0, 10)
      : memoryService.getRelevantMemoriesSync({ query: question }, 10);
    if (focus) {
      result.knowledgeLines = memoryService.getObjectKnowledgeSync(focus.id).slice(0, 6);
    } else {
      result.knowledgeLines = memoryService.getSelfKnowledgeSync().slice(0, 6);
    }
  }

  // ── Timeline layer (the single time source) ──
  if (decision.timelineDays > 0) {
    result.timelineEvents = queryTimeline({
      from: Date.now() - decision.timelineDays * DAY_MS,
      objectId: focus?.id,
      limit: 20,
    });
  }

  // ── Reflection layer ──
  if (decision.includeReflections) {
    result.reflections = (useIntelligenceStore.getState().cache.reflections ?? [])
      .slice(0, 5)
      .map((r) => ({ id: r.id, date: r.date, question: r.question }));
  }

  // ── Insight layer ──
  if (decision.includeInsights && focus) {
    result.insightLines = (focus.aiInsights ?? [])
      .slice(0, 5)
      .map((i) => `[${i.category}] ${i.title}`);
  }

  return result;
}
