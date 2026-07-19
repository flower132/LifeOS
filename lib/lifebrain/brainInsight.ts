import { recommendInsights } from "@/lib/graph/recommendations";
import { GraphInsight } from "@/lib/graph/types";
import { computeTimelineInsights, TimelineInsight } from "@/lib/graph/timeline/insights";
import { brainCacheComputeSync, BRAIN_CACHE_TTL } from "./brainCache";

// ---------------------------------------------------------------------------
// Brain Insight — the daily insight bundle for the home page, computed from
// Knowledge Graph + Timeline (never raw DB scans, never LLM hallucination).
//
//   Relationship / Goal / Project / Life / Habit / Time insights,
//   all unified under one provider: the Brain.
// ---------------------------------------------------------------------------

export interface BrainInsightBundle {
  generatedAt: number;
  graph: GraphInsight[];
  timeline: TimelineInsight[];
  /** One headline insight for "Today's Insight" display. */
  headline: { title: string; detail: string; objectId?: string } | null;
}

function pickHeadline(bundle: Omit<BrainInsightBundle, "headline">): BrainInsightBundle["headline"] {
  const firstTimeline = bundle.timeline[0];
  if (firstTimeline) {
    return {
      title: firstTimeline.title,
      detail: firstTimeline.detail,
      objectId: firstTimeline.objectId,
    };
  }
  const firstGraph = bundle.graph[0];
  if (firstGraph) {
    return {
      title: firstGraph.message,
      detail: firstGraph.suggestion,
      objectId: firstGraph.objectId,
    };
  }
  return null;
}

/** Today's insight bundle (cached; recomputed only when data changes). */
export function generateInsight(): BrainInsightBundle {
  return brainCacheComputeSync("brainInsight:daily", BRAIN_CACHE_TTL.graphContext, () => {
    const graph = recommendInsights();
    const timeline = computeTimelineInsights();
    const partial = { generatedAt: Date.now(), graph, timeline };
    return { ...partial, headline: pickHeadline(partial) };
  });
}
