import { AITask } from "@/lib/ai/types";
import { memoryService } from "@/lib/memory/memoryService";
import { getWorld } from "./retriever";
import { serializeContext } from "./contextBuilder";
import { dedupeSources } from "./sources";
import { objectStrategy } from "./strategies/objectStrategy";
import { relationshipStrategy } from "./strategies/relationshipStrategy";
import { goalStrategy } from "./strategies/goalStrategy";
import { memoryStrategy } from "./strategies/memoryStrategy";
import { selfStrategy } from "./strategies/selfStrategy";
import { ContextStrategy } from "./strategies/types";
import { AIContext, ContextSignals, SerializedContext } from "./types";

// ---------------------------------------------------------------------------
// Context Engine — orchestrates every AI call's understanding layer:
//
//   signals (task/objectId/query)
//     → strategy (per task family)
//     → retriever (existing stores)
//     → relevance ranking
//     → budget-trimmed serialization
//     → cached for short repeats
//
// Runs client-side (LifeOS data lives in browser storage); the serialized
// block is sent with the AI request and injected into the system prompt by
// the server router. Mock/privacy paths never reach this engine's output —
// they never call the server at all.
// ---------------------------------------------------------------------------

/** Context token budgets per task depth. */
const NORMAL_BUDGET_TOKENS = 5_000;
const DEEP_BUDGET_TOKENS = 20_000;

const DEEP_TASKS: ReadonlySet<AITask> = new Set([
  "OBJECT_ANALYSIS",
  "OBJECT_UPDATE",
  "PERSON_UPDATE",
  "RELATIONSHIP",
  "WEEKLY_REVIEW",
  "MONTHLY_STORY",
  "PATTERN",
]);

/** Task → strategy. Tasks absent here get NO context injection. */
const STRATEGY_MAP: Partial<Record<AITask, { name: string; fn: ContextStrategy }>> = {
  OBJECT_ANALYSIS: { name: "object", fn: objectStrategy },
  OBJECT_UPDATE: { name: "object", fn: objectStrategy },
  PERSON_UPDATE: { name: "object", fn: objectStrategy },
  RELATIONSHIP: { name: "relationship", fn: relationshipStrategy },
  TODAY_FOCUS: { name: "goal", fn: goalStrategy },
  REMINDER: { name: "goal", fn: goalStrategy },
  REFLECTION: { name: "self", fn: selfStrategy },
  WORKSPACE: { name: "self", fn: selfStrategy },
  WEEKLY_REVIEW: { name: "self", fn: selfStrategy },
  MONTHLY_STORY: { name: "self", fn: selfStrategy },
  SUMMARY: { name: "self", fn: selfStrategy },
  MEMORY_UNDERSTANDING: { name: "memory", fn: memoryStrategy },
  TODAY_STORY: { name: "memory", fn: memoryStrategy },
  PATTERN: { name: "memory", fn: memoryStrategy },
  CHAT: { name: "memory", fn: memoryStrategy },
  CONVERSATION: { name: "memory", fn: memoryStrategy },
  SEARCH: { name: "memory", fn: memoryStrategy },
};

const EMPTY_CONTEXT = (signals: ContextSignals, strategy: string): AIContext => ({
  user: { id: "local" },
  current: { task: signals.task, objectId: signals.objectId },
  memories: { recent: [], relevant: [] },
  relationships: { relatedPeople: [], relations: [], history: [] },
  goals: { activeGoals: [] },
  objects: { relatedObjects: [] },
  timeline: { recentEvents: [] },
  insights: { previousInsights: [] },
  knowledge: { lines: [], longTermMemories: [] },
  metadata: {
    generatedAt: Date.now(),
    confidence: 0,
    strategy,
    truncated: false,
  },
});

/** Build the structured context for a task — null when the task needs none. */
export function buildAIContext(signals: ContextSignals): AIContext | null {
  const strategy = STRATEGY_MAP[signals.task];
  if (!strategy) return null;

  const world = getWorld();
  if (!world) return null;

  const result = strategy.fn(signals, world);
  const ctx = EMPTY_CONTEXT(signals, strategy.name);

  // Merge strategy sections over the empty base.
  Object.assign(ctx, {
    ...result.sections,
    current: result.sections.current ?? ctx.current,
    memories: result.sections.memories ?? ctx.memories,
    relationships: result.sections.relationships ?? ctx.relationships,
    goals: result.sections.goals ?? ctx.goals,
    objects: result.sections.objects ?? ctx.objects,
    timeline: result.sections.timeline ?? ctx.timeline,
    insights: result.sections.insights ?? ctx.insights,
  });

  if (world.self) {
    ctx.user = {
      id: world.self.id,
      name: world.self.name || undefined,
      profile: world.self.aiProfile,
    };
  }
  ctx.metadata.confidence = result.confidence;

  // Memory & Knowledge Layer: every AI call automatically gets long-term
  // memory — durable knowledge lines + relevant long-term memories.
  try {
    const focusName = ctx.objects.focus?.name;
    const longTerm = memoryService.getRelevantMemoriesSync(
      {
        objectId: signals.objectId,
        objectName: focusName,
        query: signals.query,
      },
      5
    );
    ctx.knowledge.longTermMemories = longTerm.map((m) => ({
      id: m.id,
      date: new Date(m.timestamp).toISOString().slice(0, 10),
      text: m.summary ?? m.content.slice(0, 80),
    }));

    const lines = signals.objectId
      ? memoryService.getObjectKnowledgeSync(signals.objectId)
      : memoryService.getSelfKnowledgeSync();
    ctx.knowledge.lines = lines.slice(0, 6);
  } catch (err) {
    // Knowledge is best-effort; never break context building.
    console.warn("[context] Memory knowledge unavailable:", err);
  }

  return ctx;
}

// ---------------------------------------------------------------------------
// Short-term cache — repeated requests within the TTL reuse the serialized
// context (note edits simply miss on the next TTL boundary).
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; value: SerializedContext }>();

function cacheKey(signals: ContextSignals): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${signals.task}|${signals.objectId ?? "-"}|${day}`;
}

/**
 * Build (or reuse) the serialized context block for an AI request.
 * Returns null when the task gets no injection or no data exists.
 */
export function getSerializedContext(
  signals: ContextSignals
): SerializedContext | null {
  const key = cacheKey(signals);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.value;
  }

  const ctx = buildAIContext(signals);
  if (!ctx) return null;

  // Skip injection when there is genuinely nothing to say — the model must
  // then honestly report missing information instead of being nudged.
  const hasData =
    ctx.objects.focus !== undefined ||
    ctx.memories.recent.length > 0 ||
    ctx.goals.activeGoals.length > 0 ||
    ctx.insights.previousInsights.length > 0 ||
    ctx.knowledge.lines.length > 0 ||
    ctx.knowledge.longTermMemories.length > 0;
  if (!hasData) return null;

  const budget = DEEP_TASKS.has(signals.task)
    ? DEEP_BUDGET_TOKENS
    : NORMAL_BUDGET_TOKENS;

  const serialized = serializeContext(ctx, budget);
  serialized.sources = dedupeSources(serialized.sources);
  cache.set(key, { at: Date.now(), value: serialized });
  return serialized;
}
