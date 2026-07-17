import {
  getNotesForObject,
  getObjectById,
  getPeople,
  getRelationsFor,
} from "../retriever";
import { rankMemories } from "../relevance";
import { insightSource, noteSource, objectSource } from "../sources";
import { ContextStrategy } from "./types";

/**
 * Relationship strategy — RELATIONSHIP (Advisor 关系洞察).
 * Needs: the person object, relationship records, interaction history,
 * and previous insights about this person.
 */
export const relationshipStrategy: ContextStrategy = (signals, world) => {
  const focus = signals.objectId
    ? getObjectById(world, signals.objectId)
    : undefined;

  // Without a known person, surface the people landscape only.
  if (!focus || focus.type !== "person") {
    const people = getPeople(world, 5);
    return {
      sections: {
        relationships: { relatedPeople: people, relations: [], history: [] },
      },
      sources: people.map(objectSource),
      confidence: people.length > 0 ? 0.3 : 0.1,
    };
  }

  const history = getNotesForObject(world, focus.id);
  const relevantHistory = rankMemories(history, {
    objectId: focus.id,
    objectName: focus.name,
    query: signals.query,
  }).slice(0, 10);

  const relations = getRelationsFor(world, focus.id);
  const previousInsights = (focus.aiInsights ?? [])
    .slice(0, 5)
    .map((i) => `[${i.category}] ${i.title}: ${i.description}`);

  return {
    sections: {
      current: { task: signals.task, objectId: focus.id, entityType: focus.type },
      objects: { focus, relatedObjects: [] },
      relationships: {
        relatedPeople: [focus],
        relations,
        history: relevantHistory.map((m) => m.note),
      },
      memories: { recent: history.slice(0, 5), relevant: relevantHistory },
      insights: { previousInsights },
    },
    sources: [
      objectSource(focus),
      ...relevantHistory.map((m) => noteSource(m.note)),
      ...(focus.aiInsights ?? []).slice(0, 3).map((i) => insightSource(focus.id, i.title)),
    ],
    confidence: history.length > 0 ? 0.85 : 0.5,
  };
};
