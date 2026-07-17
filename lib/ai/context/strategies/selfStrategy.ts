import { getRecentNotes } from "../retriever";
import { rankMemories } from "../relevance";
import { insightSource, noteSource, objectSource } from "../sources";
import { ContextStrategy } from "./types";

/**
 * Self strategy — REFLECTION / WORKSPACE / WEEKLY_REVIEW / MONTHLY_STORY /
 * SUMMARY.
 * Needs: the user's self profile, recent memories, active patterns, and
 * previous insights about the user.
 */
export const selfStrategy: ContextStrategy = (signals, world) => {
  const self = world.self;
  const recent = getRecentNotes(world, 10);
  const relevant = rankMemories(recent, { query: signals.query }).slice(0, 5);

  const patternInsights = world.patterns
    .filter((p) => p.status === "active")
    .slice(0, 5)
    .map((p) => `[${p.category}] ${p.title}: ${p.description}`);
  const selfInsights = (self?.aiInsights ?? [])
    .slice(0, 5)
    .map((i) => `[${i.category}] ${i.title}: ${i.description}`);

  return {
    sections: {
      memories: { recent, relevant },
      timeline: { recentEvents: recent },
      insights: { previousInsights: [...patternInsights, ...selfInsights] },
    },
    sources: [
      ...(self ? [objectSource(self)] : []),
      ...relevant.map((m) => noteSource(m.note)),
      ...world.patterns
        .filter((p) => p.status === "active")
        .slice(0, 3)
        .map((p) => insightSource(self?.id ?? "self", p.title)),
    ],
    confidence: recent.length > 0 ? 0.7 : 0.2,
  };
};
