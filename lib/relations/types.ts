import { LifeObject, Relation, RelationType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Relation Engine — types for the Knowledge Graph edge layer. Edges reuse the
// existing Relation model (extended with V2 optional fields); no parallel
// object/relation system is created.
// ---------------------------------------------------------------------------

/** One relation extraction candidate produced by AI. */
export interface ExtractedRelation {
  /** Display names as written in the source text ("我" resolves to self). */
  fromName: string;
  toName: string;
  /** Coarse type mapped onto the existing RelationType enum. */
  type: RelationType;
  /** Free-form predicate (e.g. "合作项目", "准备"). */
  label?: string;
  /** 0..1 extraction confidence. */
  confidence: number;
}

export interface NeighborEntry {
  object: LifeObject;
  relation: Relation;
  /** "outgoing" = objectId is the source; "incoming" = it is the target. */
  direction: "outgoing" | "incoming";
}

export interface UpsertRelationInput {
  fromObjectId: string;
  toObjectId: string;
  type: RelationType;
  label?: string;
  confidence?: number;
  sourceMemoryId?: string;
  note?: string;
  createdBy: "ai" | "user";
}
