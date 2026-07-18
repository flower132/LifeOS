import { Relation } from "@/lib/types";
import { useRelationStore } from "@/stores/relationStore";
import { useObjectStore } from "@/stores/objectStore";
import { NeighborEntry, UpsertRelationInput } from "./types";

// ---------------------------------------------------------------------------
// Relation Engine — the Graph Query API and write path for the Knowledge
// Graph. Future Graph Visualization and AI Reasoning consume ONLY this
// facade; storage details stay behind it.
// ---------------------------------------------------------------------------

function relationStore() {
  return useRelationStore.getState();
}

function objectStore() {
  return useObjectStore.getState();
}

/** Unordered pair key — relations are treated as bidirectional for dedupe. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Semantic dedupe key: pair + coarse type + optional label. */
function dedupeKey(a: string, b: string, type: string, label?: string): string {
  return `${pairKey(a, b)}|${type}|${label ?? ""}`;
}

class RelationEngine {
  // ── Graph Query API ──────────────────────────────────────────────────────

  /** All edges touching an object (both directions), newest first. */
  getRelations(objectId: string): Relation[] {
    return relationStore().getByObjectId(objectId);
  }

  /** Neighbor objects with their connecting edge and direction. */
  getNeighbors(objectId: string): NeighborEntry[] {
    const objects = objectStore().objects;
    return this.getRelations(objectId)
      .map((relation) => {
        const outgoing = relation.source_object_id === objectId;
        const otherId = outgoing
          ? relation.target_object_id
          : relation.source_object_id;
        const object = objects.find((o) => o.id === otherId);
        if (!object) return null;
        return {
          object,
          relation,
          direction: outgoing ? ("outgoing" as const) : ("incoming" as const),
        };
      })
      .filter((entry): entry is NeighborEntry => entry !== null);
  }

  /** The edge(s) between two objects, if any (either direction). */
  getRelationBetween(a: string, b: string): Relation | undefined {
    const key = pairKey(a, b);
    return relationStore().relations.find(
      (r) => pairKey(r.source_object_id, r.target_object_id) === key
    );
  }

  /** Keyword search over edge semantics + the other object's name. */
  searchRelations(keyword: string): Relation[] {
    const query = keyword.trim().toLowerCase();
    if (!query) return [];
    const objects = objectStore().objects;
    const nameOf = (id: string) =>
      objects.find((o) => o.id === id)?.name.toLowerCase() ?? "";
    return relationStore().relations.filter((r) => {
      return (
        r.type.toLowerCase().includes(query) ||
        (r.label ?? "").toLowerCase().includes(query) ||
        (r.note ?? "").toLowerCase().includes(query) ||
        nameOf(r.source_object_id).includes(query) ||
        nameOf(r.target_object_id).includes(query)
      );
    });
  }

  // ── Write path (dedupe + reinforcement) ──────────────────────────────────

  /**
   * Insert or reinforce an edge. Dedupe is semantic (pair + type + label):
   * an existing edge is updated (confidence = max, refreshed timestamp and
   * provenance) instead of duplicated.
   */
  async upsertRelation(input: UpsertRelationInput): Promise<Relation> {
    if (input.fromObjectId === input.toObjectId) {
      throw new Error("Cannot create a self-loop relation");
    }

    const key = dedupeKey(
      input.fromObjectId,
      input.toObjectId,
      input.type,
      input.label
    );
    const existing = relationStore().relations.find(
      (r) =>
        dedupeKey(r.source_object_id, r.target_object_id, r.type, r.label) === key
    );

    if (existing) {
      const confidence = Math.max(
        existing.confidence ?? 0,
        input.confidence ?? 0
      );
      return relationStore().updateRelation(existing.id, {
        confidence: confidence > 0 ? confidence : existing.confidence,
        sourceMemoryId: existing.sourceMemoryId ?? input.sourceMemoryId,
        note: existing.note ?? input.note,
      });
    }

    return relationStore().addRelation({
      source_object_id: input.fromObjectId,
      target_object_id: input.toObjectId,
      type: input.type,
      label: input.label,
      confidence: input.confidence,
      sourceMemoryId: input.sourceMemoryId,
      note: input.note,
      createdBy: input.createdBy,
    });
  }

  async updateRelation(
    id: string,
    updates: Parameters<ReturnType<typeof relationStore>["updateRelation"]>[1]
  ): Promise<Relation> {
    return relationStore().updateRelation(id, updates);
  }

  async removeRelation(id: string): Promise<void> {
    return relationStore().removeRelation(id);
  }
}

export const relationEngine = new RelationEngine();
