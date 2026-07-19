import { AITask, AIContextSource } from "@/lib/ai/types";
import { LifeObject, Relation } from "@/lib/types";
import { Memory } from "@/lib/memory/types";
import { TimelineEvent } from "@/lib/graph/timeline/types";
import { RankedNeighbor } from "@/lib/graph/types";

// ---------------------------------------------------------------------------
// Life Brain — types for the single AI Context Provider of LifeOS.
//
// Knowledge Graph is the memory. Timeline is time. Life Brain is thinking.
// Brain NEVER owns data: it interprets the graph/timeline/memory layers.
// ---------------------------------------------------------------------------

/** What the user is asking about (drives the Decision Engine). */
export type BrainIntent =
  | "chat"
  | "question"
  | "search"
  | "relationship"
  | "goal"
  | "project"
  | "reflection"
  | "workspace";

/** Decision Engine output: which layers enter the context and the budget. */
export interface BrainDecision {
  intent: BrainIntent;
  includeGraph: boolean;
  graphHops: 0 | 1 | 2;
  timelineDays: 0 | 7 | 30 | 90 | 365;
  includeMemories: boolean;
  includeProfile: boolean;
  includeReflections: boolean;
  includeInsights: boolean;
  /** Token budget for the serialized context block. */
  budgetTokens: number;
  /** Why these layers were chosen (transparency). */
  reason: string;
}

/** A retrieval result bundle (before compression). */
export interface BrainRetrieval {
  focusObject?: LifeObject;
  relatedObjects: RankedNeighbor[];
  relations: Relation[];
  memories: Memory[];
  timelineEvents: TimelineEvent[];
  reflections: { id: string; date: string; question: string }[];
  knowledgeLines: string[];
  insightLines: string[];
}

/** The assembled, ranked, budgeted world model for one answer. */
export interface BrainContext {
  intent: BrainIntent;
  decision: BrainDecision;
  self?: { id: string; name?: string };
  focusObject?: LifeObject;
  neighbors: RankedNeighbor[];
  relations: Relation[];
  memories: { id: string; date: string; text: string; importance: number }[];
  timeline: { id: string; date: string; title: string; type: string }[];
  reflections: { id: string; date: string; question: string }[];
  knowledgeLines: string[];
  insightLines: string[];
  metadata: {
    generatedAt: number;
    truncated: boolean;
    estimatedTokens: number;
  };
}

/** Reasoning trace — why the answer is grounded (data-only). */
export interface BrainReasoningStep {
  step: "understand" | "decide" | "retrieve" | "rank" | "compress" | "generate";
  detail: string;
}

/** Working Memory — built for every answer. */
export interface WorkingMemory {
  id: string;
  question: string;
  intent: BrainIntent;
  focusObjectId?: string;
  retrievedEntityIds: string[];
  steps: BrainReasoningStep[];
  createdAt: number;
}

/** Session conversation turn (Short Memory). */
export interface SessionTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: BrainIntent;
  createdAt: number;
}

/** The unified answer from brain.answer(). */
export interface BrainAnswer {
  content: string;
  intent: BrainIntent;
  task: AITask;
  sources: AIContextSource[];
  steps: BrainReasoningStep[];
  workingMemoryId: string;
  provider: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  latency: number;
}

/** brain.answer() request — the single AI entry point. */
export interface BrainAnswerRequest {
  question: string;
  intent?: BrainIntent;
  objectId?: string;
  images?: { mimeType: string; base64Data: string }[];
  /** Additional context hint (e.g. the situation for advice). */
  situation?: string;
}

// ---------------------------------------------------------------------------
// Reserved capabilities — interfaces only, NO implementation (未来能力预留).
// ---------------------------------------------------------------------------

/** Reserved: multi-step agent planning (not implemented). */
export interface BrainAgentPlan {
  steps: { action: string; input: unknown }[];
}

/** Reserved: tool calling / MCP surface (not implemented). */
export interface BrainToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Reserved: workflow automation hooks (not implemented). */
export interface BrainWorkflowHook {
  trigger: "schedule" | "event";
  run: () => Promise<void>;
}
