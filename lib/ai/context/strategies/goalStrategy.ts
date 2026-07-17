import { getActiveGoals, getRecentNotes } from "../retriever";
import { rankMemories } from "../relevance";
import { noteSource, objectSource } from "../sources";
import { ContextStrategy } from "./types";

/**
 * Goal strategy — TODAY_FOCUS / REMINDER.
 * Needs: active goals/projects, recent memories, recent changes, time.
 */
export const goalStrategy: ContextStrategy = (signals, world) => {
  const activeGoals = getActiveGoals(world);
  const recent = getRecentNotes(world, 10);

  const goalNames = activeGoals.map((g) => g.name).join(" ");
  const relevant = rankMemories(recent, {
    query: [signals.query, goalNames].filter(Boolean).join(" "),
  }).slice(0, 5);

  return {
    sections: {
      goals: { activeGoals },
      memories: { recent, relevant },
      timeline: { recentEvents: recent.slice(0, 10) },
    },
    sources: [
      ...activeGoals.slice(0, 5).map(objectSource),
      ...relevant.map((m) => noteSource(m.note)),
    ],
    confidence: activeGoals.length > 0 || recent.length > 0 ? 0.7 : 0.2,
  };
};
