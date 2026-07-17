import { getObjectById, getRecentNotes } from "../retriever";
import { rankMemories } from "../relevance";
import { noteSource, objectSource } from "../sources";
import { ContextStrategy } from "./types";

/**
 * Memory strategy — MEMORY_UNDERSTANDING / TODAY_STORY / PATTERN /
 * CHAT / CONVERSATION / SEARCH.
 * Needs: the current memory plus semantically relevant past memories.
 */
export const memoryStrategy: ContextStrategy = (signals, world) => {
  const focus = signals.objectId
    ? getObjectById(world, signals.objectId)
    : undefined;

  const recent = getRecentNotes(world, 10);
  const relevant = rankMemories(world.notes, {
    objectId: focus?.id,
    objectName: focus?.name,
    query: signals.query,
  }).slice(0, 10);

  return {
    sections: {
      current: focus
        ? { task: signals.task, objectId: focus.id, entityType: focus.type }
        : undefined,
      objects: focus ? { focus, relatedObjects: [] } : undefined,
      memories: { recent, relevant },
    },
    sources: [
      ...(focus ? [objectSource(focus)] : []),
      ...relevant.map((m) => noteSource(m.note)),
    ],
    confidence: relevant.length > 0 ? 0.7 : 0.2,
  };
};
