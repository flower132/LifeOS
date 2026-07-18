import { Relation } from "@/lib/types";
import { Memory } from "@/lib/memory/types";
import { GraphPathNode, RankedNeighbor } from "./types";
import { computeRelationStrength } from "./strength";

// ---------------------------------------------------------------------------
// Graph Ranking — TopK selection for prompt contexts. Never dump the whole
// graph into a prompt; rank and cap.
//
//   score = 0.25 * relationshipWeight (AI strength / 100)
//         + 0.20 * recentActivity
//         + 0.15 * memoryImportance
//         + 0.15 * pinned (user-set relation.strength)
//         + 0.15 * aiImportance (relation.confidence)
//         + 0.10 * interactionCount (normalized)
//         − depth penalty (0.1 per hop)
// ---------------------------------------------------------------------------

const DEFAULT_TOP_K = 20;
const DAY_MS = 1000 * 60 * 60 * 24;

export interface RankInput {
  originId: string;
  nodes: GraphPathNode[];
  memories: Memory[];
  relations: Relation[];
  now?: number;
}

function recencyScore(memories: Memory[], now: number): number {
  const latest = Math.max(0, ...memories.map((m) => m.timestamp));
  if (latest === 0) return 0;
  const days = (now - latest) / DAY_MS;
  return Math.pow(0.5, days / 30); // 30-day half-life
}

/** Rank traversal results; returns the TopK neighbors. */
export function rankContext(input: RankInput, topK = DEFAULT_TOP_K): RankedNeighbor[] {
  const now = input.now ?? Date.now();
  const { originId, nodes, memories, relations } = input;
  const origin = nodes.find((n) => n.object.id === originId)?.object;

  const ranked: RankedNeighbor[] = [];

  for (const node of nodes) {
    if (node.depth === 0 || !node.via) continue;

    const nodeMemories = memories.filter((m) =>
      m.relations.some((r) => r.targetId === node.object.id)
    );

    const strength = origin
      ? computeRelationStrength({
          objectA: origin,
          objectB: node.object,
          memories,
          relations,
          now,
        }).score
      : 0;

    const relationshipWeight = strength / 100;
    const recentActivity = recencyScore(nodeMemories, now);
    const memoryImportance = nodeMemories.length
      ? Math.max(...nodeMemories.map((m) => m.importance))
      : 0;
    const pinned = node.via.strength ?? 0;
    const aiImportance = node.via.confidence ?? 0;
    const interactionCount = Math.min(1, nodeMemories.length / 10);
    const depthPenalty = 0.1 * (node.depth - 1);

    const score =
      0.25 * relationshipWeight +
      0.2 * recentActivity +
      0.15 * memoryImportance +
      0.15 * pinned +
      0.15 * aiImportance +
      0.1 * interactionCount -
      depthPenalty;

    ranked.push({
      object: node.object,
      relation: node.via,
      depth: node.depth,
      score: Math.round(score * 1000) / 1000,
      strength,
    });
  }

  return ranked.sort((a, b) => b.score - a.score).slice(0, topK);
}
