import { LifeObject, Relation } from "@/lib/types";
import { Memory } from "@/lib/memory/types";
import { memoriesForObject } from "@/lib/memory/strategies/shared";
import { RelationStrength, RelationStrengthLevel } from "./types";

// ---------------------------------------------------------------------------
// Relation Strength — AI-computed 0..100 edge strength from real activity
// (never user input, never hallucination):
//
//   chat/interaction count · shared projects · shared goals ·
//   recency of last contact · shared events · interaction frequency
// ---------------------------------------------------------------------------

const DAY_MS = 1000 * 60 * 60 * 24;

export interface StrengthInput {
  objectA: LifeObject;
  objectB: LifeObject;
  memories: Memory[];
  relations: Relation[];
  now?: number;
}

function clamp(value: number, max: number): number {
  return Math.min(value, max);
}

export function computeRelationStrength(input: StrengthInput): RelationStrength {
  const now = input.now ?? Date.now();
  const { objectA, objectB, memories } = input;

  // Memories touching each object.
  const memoriesA = new Set(memoriesForObject(objectA.id, memories).map((m) => m.id));
  const memoriesB = new Set(memoriesForObject(objectB.id, memories).map((m) => m.id));
  const shared = [...memoriesA].filter((id) => memoriesB.has(id));

  const allRelatedTimestamps = [...memoriesA, ...memoriesB]
    .map((id) => memories.find((m) => m.id === id)?.timestamp ?? 0)
    .filter((t) => t > 0);
  const lastContact = Math.max(0, ...allRelatedTimestamps);
  const daysSinceLastContact =
    lastContact === 0 ? 365 : Math.floor((now - lastContact) / DAY_MS);

  // Interactions in the last 90 days (either object, shared counts double).
  const cutoff = now - 90 * DAY_MS;
  const recentShared = shared.filter((id) => {
    const m = memories.find((mem) => mem.id === id);
    return m && m.timestamp >= cutoff;
  }).length;
  const recentA = [...memoriesA].filter((id) => {
    const m = memories.find((mem) => mem.id === id);
    return m && m.timestamp >= cutoff;
  }).length;
  const interactionCount = recentShared * 2 + Math.min(recentA, 10);

  // Shared projects/goals: objects co-linked with both in the graph.
  const linkedProjectsOf = (objectId: string) =>
    new Set(
      memoriesForObject(objectId, memories).flatMap((m) => m.entities.projects)
    );
  const linkedGoalsOf = (objectId: string) =>
    new Set(
      memoriesForObject(objectId, memories).flatMap((m) => m.entities.goals)
    );
  const projectsA = linkedProjectsOf(objectA.id);
  const projectsB = linkedProjectsOf(objectB.id);
  const goalsA = linkedGoalsOf(objectA.id);
  const goalsB = linkedGoalsOf(objectB.id);
  const sharedProjects = [...projectsA].filter((p) => projectsB.has(p)).length;
  const sharedGoals = [...goalsA].filter((g) => goalsB.has(g)).length;

  // Shared events: co-mentioned event-type memories.
  const sharedEvents = shared.filter((id) => {
    const m = memories.find((mem) => mem.id === id);
    return m?.type === "event";
  }).length;

  const recencyScore =
    daysSinceLastContact <= 7
      ? 25
      : daysSinceLastContact <= 30
        ? 18
        : daysSinceLastContact <= 90
          ? 10
          : 3;

  const score = Math.round(
    clamp(interactionCount * 4, 30) +
      clamp(sharedProjects * 10, 20) +
      clamp(sharedGoals * 10, 20) +
      recencyScore +
      clamp(sharedEvents * 3, 15)
  );

  const clamped = Math.min(100, score);
  const level: RelationStrengthLevel =
    clamped >= 70 ? "strong" : clamped >= 40 ? "medium" : "weak";

  return {
    score: clamped,
    level,
    factors: {
      interactionCount,
      sharedProjects,
      sharedGoals,
      daysSinceLastContact,
      sharedEvents,
    },
  };
}
