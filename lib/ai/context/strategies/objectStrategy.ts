import {
  getNotesForObject,
  getObjectById,
  getRelatedObjects,
  getRelationsFor,
} from "../retriever";
import { rankMemories } from "../relevance";
import { insightSource, noteSource, objectSource } from "../sources";
import { ContextStrategy } from "./types";

/**
 * Object strategy — OBJECT_ANALYSIS / OBJECT_UPDATE / PERSON_UPDATE.
 * Needs: the focus object (profile, properties, insights), its memories,
 * and objects connected via relations.
 */
export const objectStrategy: ContextStrategy = (signals, world) => {
  const focus = signals.objectId
    ? getObjectById(world, signals.objectId)
    : undefined;

  if (!focus) {
    return { sections: {}, sources: [], confidence: 0.1 };
  }

  const objectNotes = getNotesForObject(world, focus.id);
  const relevant = rankMemories(objectNotes, {
    objectId: focus.id,
    objectName: focus.name,
    query: signals.query,
  }).slice(0, 8);

  const relatedObjects = getRelatedObjects(world, focus.id);
  const relations = getRelationsFor(world, focus.id);
  const insights = (focus.aiInsights ?? [])
    .slice(0, 5)
    .map((i) => `[${i.category}] ${i.title}: ${i.description}`);

  return {
    sections: {
      current: {
        task: signals.task,
        objectId: focus.id,
        entityType: focus.type,
      },
      objects: { focus, relatedObjects },
      memories: { recent: objectNotes.slice(0, 5), relevant },
      relationships: {
        relatedPeople: relatedObjects.filter((o) => o.type === "person"),
        relations,
        history: objectNotes.slice(0, 10),
      },
      insights: { previousInsights: insights },
    },
    sources: [
      objectSource(focus),
      ...relevant.map((m) => noteSource(m.note)),
      ...relatedObjects.slice(0, 5).map(objectSource),
      ...(focus.aiInsights ?? []).slice(0, 3).map((i) => insightSource(focus.id, i.title)),
    ],
    confidence: objectNotes.length > 0 ? 0.85 : 0.5,
  };
};
