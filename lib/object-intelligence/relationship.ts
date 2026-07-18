import { LifeObject, Relation } from "@/lib/types";
import { Memory } from "@/lib/memory/types";

// ---------------------------------------------------------------------------
// Relationship Engine — the Object ↔ Object relationship graph, derived from
// user-curated relations plus memory co-occurrence. Data-only (Graph View
// comes later).
// ---------------------------------------------------------------------------

export interface RelationshipNode {
  id: string;
  name: string;
  type: LifeObject["type"];
}

export interface RelationshipEdge {
  sourceId: string;
  targetId: string;
  /** User-curated relation type, or "co_mentioned" when derived from memories. */
  type: string;
  strength?: number;
  /** Number of memories linking both objects. */
  sharedMemories: number;
  /** True when the edge exists only via memory co-occurrence. */
  inferred: boolean;
}

export interface RelationshipGraph {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

/** Count memories that link both objects. */
function countSharedMemories(
  a: string,
  b: string,
  memories: Memory[]
): number {
  return memories.filter(
    (m) =>
      m.relations.some((r) => r.targetId === a) &&
      m.relations.some((r) => r.targetId === b)
  ).length;
}

export function buildRelationshipGraph(params: {
  objects: LifeObject[];
  relations: Relation[];
  memories: Memory[];
  /** Center the graph on one object (ego view) when provided. */
  focusObjectId?: string;
}): RelationshipGraph {
  const { objects, relations, memories, focusObjectId } = params;

  let scopeObjects = objects;
  if (focusObjectId) {
    const neighborIds = new Set<string>([focusObjectId]);
    for (const r of relations) {
      if (r.source_object_id === focusObjectId) neighborIds.add(r.target_object_id);
      if (r.target_object_id === focusObjectId) neighborIds.add(r.source_object_id);
    }
    for (const m of memories) {
      if (m.relations.some((r) => r.targetId === focusObjectId)) {
        for (const r of m.relations) neighborIds.add(r.targetId);
      }
    }
    scopeObjects = objects.filter((o) => neighborIds.has(o.id));
  }

  const nodes: RelationshipNode[] = scopeObjects.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
  }));
  const nodeIds = new Set(nodes.map((n) => n.id));

  const edges: RelationshipEdge[] = relations
    .filter((r) => nodeIds.has(r.source_object_id) && nodeIds.has(r.target_object_id))
    .map((r) => ({
      sourceId: r.source_object_id,
      targetId: r.target_object_id,
      type: r.type,
      strength: r.strength,
      sharedMemories: countSharedMemories(r.source_object_id, r.target_object_id, memories),
      inferred: false,
    }));

  // Inferred edges: co-mentioned in ≥2 memories without a curated relation.
  const hasEdge = new Set(edges.map((e) => `${e.sourceId}|${e.targetId}`));
  const scopedMemories = memories.filter((m) =>
    m.relations.some((r) => nodeIds.has(r.targetId))
  );
  for (const a of nodeIds) {
    for (const b of nodeIds) {
      if (a >= b) continue;
      if (hasEdge.has(`${a}|${b}`) || hasEdge.has(`${b}|${a}`)) continue;
      const shared = countSharedMemories(a, b, scopedMemories);
      if (shared >= 2) {
        edges.push({
          sourceId: a,
          targetId: b,
          type: "co_mentioned",
          sharedMemories: shared,
          inferred: true,
        });
      }
    }
  }

  return { nodes, edges };
}
