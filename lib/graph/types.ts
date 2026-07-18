import { LifeObject, Relation, RelationType } from "@/lib/types";
import { Memory } from "@/lib/memory/types";

// ---------------------------------------------------------------------------
// Knowledge Graph Intelligence — shared types. Built on the existing
// Object + Relation + Memory systems; nothing here creates new object types.
// ---------------------------------------------------------------------------

/** A node reached by multi-hop traversal. */
export interface GraphPathNode {
  object: LifeObject;
  /** 0 = the origin object. */
  depth: number;
  /** The edge through which this node was reached (null for origin). */
  via: Relation | null;
  /** Breadcrumb path of object ids from origin to this node. */
  path: string[];
}

/** A ranked neighbor for prompt contexts (TopK). */
export interface RankedNeighbor {
  object: LifeObject;
  relation: Relation;
  depth: number;
  /** 0..1 composite rank score (see ranking.ts). */
  score: number;
  /** AI-computed relation strength 0..100 (see strength.ts). */
  strength: number;
}

/** Full graph context for one object — the input to every AI call. */
export interface GraphContext {
  focus: LifeObject;
  /** Ranked related objects (multi-hop, TopK). */
  neighbors: RankedNeighbor[];
  /** Relevant memories for the focus object (ranked, capped). */
  memories: Memory[];
  /** Latest interaction timestamp across neighbors (ms epoch, 0 if none). */
  lastInteractionAt: number;
  metadata: {
    generatedAt: number;
    hops: number;
    truncated: boolean;
  };
}

/** AI relation strength classification. */
export type RelationStrengthLevel = "strong" | "medium" | "weak";

export interface RelationStrength {
  /** 0..100. */
  score: number;
  level: RelationStrengthLevel;
  factors: {
    interactionCount: number;
    sharedProjects: number;
    sharedGoals: number;
    daysSinceLastContact: number;
    sharedEvents: number;
  };
}

/** Fully transparent explanation of a relation. */
export interface RelationExplanation {
  relationId: string;
  otherObjectId: string;
  otherObjectName: string;
  strength: RelationStrength;
  sharedProjects: { id: string; name: string }[];
  sharedGoals: { id: string; name: string }[];
  recentInteractions: number;
  sharedMemories: number;
  lastContactAt: string | null;
  /** Template-generated summary (data-only, no hallucination). */
  text: string;
}

/** A relation discovery suggestion — requires explicit user acceptance. */
export interface RelationSuggestion {
  id: string;
  fromObjectId: string;
  toObjectId: string;
  type: RelationType;
  label?: string;
  confidence: number;
  sourceMemoryId?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

/** Rule-based graph insight for the home page. */
export interface GraphInsight {
  id: string;
  kind: "contact_fading" | "goal_stalled" | "project_quiet" | "relation_growing";
  objectId: string;
  objectName: string;
  message: string;
  suggestion: string;
  /** Days since the relevant last activity. */
  days: number;
}

export function isValidRelationSuggestion(
  value: unknown
): value is RelationSuggestion {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.fromObjectId === "string" &&
    typeof r.toObjectId === "string" &&
    typeof r.type === "string" &&
    typeof r.confidence === "number" &&
    (r.status === "pending" || r.status === "accepted" || r.status === "rejected") &&
    typeof r.createdAt === "string" &&
    typeof r.updatedAt === "string"
  );
}
