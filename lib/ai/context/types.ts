import { AITask } from "@/lib/ai/types";
import { LifeObject, Note, Relation } from "@/lib/types";

// ---------------------------------------------------------------------------
// AI Context — the structured "user's life" snapshot injected into every AI
// call. Built client-side (the stores live in the browser), serialized by
// contextBuilder, injected into the system prompt by the server router.
// ---------------------------------------------------------------------------

export type { AIContextSource } from "@/lib/ai/types";
import type { AIContextSource } from "@/lib/ai/types";

/** What the engine knows about the current request. */
export interface ContextSignals {
  task: AITask;
  /** Current object of discussion, when known. */
  objectId?: string;
  /** Free-form user input used for semantic matching. */
  query?: string;
}

export interface ScoredMemory {
  note: Note;
  /** 0..1 composite relevance score (see relevance.ts). */
  score: number;
}

export interface AIContext {
  user: {
    id: string;
    name?: string;
    /** Self-object AI profile, when available. */
    profile?: unknown;
  };
  current: {
    task: AITask;
    objectId?: string;
    entityType?: string;
  };
  memories: {
    /** Latest notes regardless of relevance. */
    recent: Note[];
    /** Relevance-ranked notes for this task. */
    relevant: ScoredMemory[];
  };
  relationships: {
    relatedPeople: LifeObject[];
    relations: Relation[];
    /** Interaction history with the focus person/object. */
    history: Note[];
  };
  goals: {
    activeGoals: LifeObject[];
  };
  objects: {
    /** The object currently under discussion. */
    focus?: LifeObject;
    relatedObjects: LifeObject[];
  };
  timeline: {
    /** Most recent notes across the whole space. */
    recentEvents: Note[];
  };
  insights: {
    previousInsights: string[];
  };
  /** Memory & Knowledge Layer: long-term memories + durable knowledge. */
  knowledge: {
    /** Durable knowledge lines (e.g. "老板偏好风险控制"). */
    lines: string[];
    longTermMemories: { id: string; date: string; text: string }[];
  };
  /** Knowledge Graph: ranked multi-hop neighbors of the focus object. */
  graph: {
    neighbors: {
      id: string;
      name: string;
      type: string;
      relationLabel?: string;
      /** 0..100 AI-computed edge strength. */
      strength: number;
      /** Hops from the focus object. */
      depth: number;
    }[];
  };
  metadata: {
    generatedAt: number;
    /** 0..1 — how much real data backed this context. */
    confidence: number;
    strategy: string;
    truncated: boolean;
  };
}

/** Serialized, budget-trimmed context ready for prompt injection. */
export interface SerializedContext {
  block: string;
  sources: AIContextSource[];
  truncated: boolean;
  /** Rough token estimate of `block`. */
  estimatedTokens: number;
}
