import { useObjectStore } from "@/stores/objectStore";
import { useRelationStore } from "@/stores/relationStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { rankMemories } from "@/lib/ai/context/relevance";
import { memoriesForObject } from "@/lib/memory/strategies/shared";
import { traverseGraph } from "./traversal";
import { rankContext } from "./ranking";
import { GraphContext } from "./types";

// ---------------------------------------------------------------------------
// AI Context Builder — the single entry every AI consumer uses:
//
//   buildGraphContext(objectId)
//
// Multi-hop traversal (lazy, capped) → ranking (TopK) → relevant memories.
// Business code never assembles graph prompts by hand.
// ---------------------------------------------------------------------------

const TOP_K_NEIGHBORS = 20;
const TOP_MEMORIES = 10;

export interface BuildGraphContextOptions {
  hops?: number;
  query?: string;
  topK?: number;
}

export function buildGraphContext(
  objectId: string,
  options: BuildGraphContextOptions = {}
): GraphContext | null {
  if (typeof window === "undefined") return null;

  const objects = useObjectStore.getState().objects;
  const relations = useRelationStore.getState().relations;
  const memories = useMemoryStore.getState().memories;

  const focus = objects.find((o) => o.id === objectId);
  if (!focus) return null;

  const hops = options.hops ?? 2;
  const nodes = traverseGraph({ originId: objectId, objects, relations, hops });
  const neighbors = rankContext(
    { originId: objectId, nodes, memories, relations },
    options.topK ?? TOP_K_NEIGHBORS
  );

  const focusMemories = memoriesForObject(objectId, memories);
  const rankedMemories = rankMemories(
    focusMemories.map((m) => ({
      id: m.id,
      object_id: objectId,
      content: `${m.summary ?? ""}\n${m.content}`,
      sourceType: "text" as const,
      attachments: [],
      created_at: new Date(m.timestamp).toISOString(),
    })),
    { objectId, objectName: focus.name, query: options.query }
  )
    .slice(0, TOP_MEMORIES)
    .map((scored) => focusMemories.find((m) => m.id === scored.note.id)!)
    .filter(Boolean);

  const lastInteractionAt = Math.max(
    0,
    ...focusMemories.map((m) => m.timestamp)
  );

  return {
    focus,
    neighbors,
    memories: rankedMemories,
    lastInteractionAt,
    metadata: {
      generatedAt: Date.now(),
      hops,
      truncated: neighbors.length >= (options.topK ?? TOP_K_NEIGHBORS),
    },
  };
}
