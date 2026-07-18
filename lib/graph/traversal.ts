import { LifeObject, Relation } from "@/lib/types";
import { GraphPathNode } from "./types";

// ---------------------------------------------------------------------------
// Graph Traversal — bounded multi-hop BFS (1-3 hops). Never walks the whole
// graph: expansion is lazy (frontier-limited) and hard-capped.
// ---------------------------------------------------------------------------

const MAX_HOPS = 3;
const MAX_NODES = 40;
const MAX_FRONTIER_PER_NODE = 8;

export interface TraversalInput {
  originId: string;
  objects: LifeObject[];
  relations: Relation[];
  hops?: number;
}

/**
 * Breadth-first expansion from the origin up to `hops` levels, with per-node
 * frontier limits and a global node cap. Returns nodes in BFS order
 * (origin first, depth ascending).
 */
export function traverseGraph(input: TraversalInput): GraphPathNode[] {
  const { originId, objects, relations } = input;
  const hops = Math.min(input.hops ?? 2, MAX_HOPS);

  const objectById = new Map(objects.map((o) => [o.id, o]));
  const origin = objectById.get(originId);
  if (!origin) return [];

  // Adjacency: relations are bidirectional for traversal.
  const adjacency = new Map<string, { otherId: string; relation: Relation }[]>();
  for (const relation of relations) {
    const push = (from: string, to: string) => {
      const list = adjacency.get(from) ?? [];
      list.push({ otherId: to, relation });
      adjacency.set(from, list);
    };
    push(relation.source_object_id, relation.target_object_id);
    push(relation.target_object_id, relation.source_object_id);
  }

  const visited = new Map<string, GraphPathNode>();
  visited.set(originId, { object: origin, depth: 0, via: null, path: [originId] });

  let frontier: GraphPathNode[] = [visited.get(originId)!];

  for (let depth = 1; depth <= hops; depth++) {
    const next: GraphPathNode[] = [];
    for (const node of frontier) {
      const edges = (adjacency.get(node.object.id) ?? []).slice(0, MAX_FRONTIER_PER_NODE);
      for (const edge of edges) {
        if (visited.has(edge.otherId)) continue;
        const target = objectById.get(edge.otherId);
        if (!target) continue;
        const reached: GraphPathNode = {
          object: target,
          depth,
          via: edge.relation,
          path: [...node.path, edge.otherId],
        };
        visited.set(edge.otherId, reached);
        next.push(reached);
        if (visited.size >= MAX_NODES) return [...visited.values()];
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }

  return [...visited.values()];
}
