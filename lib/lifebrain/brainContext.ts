import { useObjectStore } from "@/stores/objectStore";
import { AIContextSource } from "@/lib/ai/types";
import { brainCacheComputeSync, BRAIN_CACHE_TTL } from "./brainCache";
import { BrainContext, BrainDecision, BrainRetrieval } from "./brainTypes";

// ---------------------------------------------------------------------------
// Brain Context — assembles the ranked, budgeted world model for one answer
// and serializes it for prompt injection (Context Compression inside).
// ---------------------------------------------------------------------------

const MEMORY_PREVIEW = 120;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 1.5);
}

/** Assemble the BrainContext from a retrieval bundle + decision. */
export function createBrainContext(params: {
  retrieval: BrainRetrieval;
  decision: BrainDecision;
}): BrainContext {
  const { retrieval, decision } = params;
  const self = useObjectStore.getState().objects.find((o) => o.type === "self");

  const memories = retrieval.memories.slice(0, 10).map((m) => ({
    id: m.id,
    date: new Date(m.timestamp).toISOString().slice(0, 10),
    text: (m.summary ?? m.content).slice(0, MEMORY_PREVIEW),
    importance: m.importance,
  }));

  const timeline = retrieval.timelineEvents.slice(0, 15).map((e) => ({
    id: e.id,
    date: new Date(e.timestamp).toISOString().slice(0, 10),
    title: e.title.slice(0, 80),
    type: e.type,
  }));

  return {
    intent: decision.intent,
    decision,
    self: self ? { id: self.id, name: self.name || undefined } : undefined,
    focusObject: retrieval.focusObject,
    neighbors: retrieval.relatedObjects.slice(0, 12),
    relations: retrieval.relations.slice(0, 10),
    memories,
    timeline,
    reflections: retrieval.reflections,
    knowledgeLines: retrieval.knowledgeLines,
    insightLines: retrieval.insightLines,
    metadata: {
      generatedAt: Date.now(),
      truncated: false,
      estimatedTokens: 0,
    },
  };
}

/** Cached variant — repeated questions within TTL reuse the assembly. */
export function createBrainContextCached(params: {
  cacheKey: string;
  retrieval: BrainRetrieval;
  decision: BrainDecision;
}): BrainContext {
  return brainCacheComputeSync(
    `brainContext:${params.cacheKey}`,
    BRAIN_CACHE_TTL.graphContext,
    () => createBrainContext(params)
  );
}

// ---------------------------------------------------------------------------
// Serialization with Context Ranking + Token Budget.
// Sections are emitted by priority and trimmed to the decision budget.
// ---------------------------------------------------------------------------

interface Section {
  priority: number;
  title: string;
  body: string;
}

function buildSections(ctx: BrainContext): Section[] {
  const sections: Section[] = [];

  if (ctx.focusObject) {
    const o = ctx.focusObject;
    const lines = [`${o.name}（${o.type}）`];
    if (o.description) lines.push(`描述：${o.description}`);
    sections.push({ priority: 1, title: "当前讨论对象", body: lines.join("\n") });
  }

  if (ctx.knowledgeLines.length > 0) {
    sections.push({ priority: 2, title: "长期知识", body: ctx.knowledgeLines.join("\n") });
  }

  if (ctx.memories.length > 0) {
    sections.push({
      priority: 3,
      title: "相关记忆",
      body: ctx.memories.map((m) => `[memory:${m.id}] ${m.date} ${m.text}`).join("\n"),
    });
  }

  if (ctx.neighbors.length > 0) {
    sections.push({
      priority: 4,
      title: "关系图谱",
      body: ctx.neighbors
        .map(
          (n) =>
            `${n.object.name}（${n.object.type}，关系：${n.relation.label ?? n.relation.type}，强度 ${n.strength}，${n.depth} 跳）`
        )
        .join("\n"),
    });
  }

  if (ctx.timeline.length > 0) {
    sections.push({
      priority: 5,
      title: "时间线",
      body: ctx.timeline.map((e) => `${e.date} [${e.type}] ${e.title}`).join("\n"),
    });
  }

  if (ctx.insightLines.length > 0) {
    sections.push({ priority: 6, title: "历史洞察", body: ctx.insightLines.join("\n") });
  }

  if (ctx.reflections.length > 0) {
    sections.push({
      priority: 7,
      title: "近期反思",
      body: ctx.reflections.map((r) => `${r.date} ${r.question}`).join("\n"),
    });
  }

  return sections.sort((a, b) => a.priority - b.priority);
}

export interface SerializedBrainContext {
  block: string;
  truncated: boolean;
  estimatedTokens: number;
  /** Origins of the injected context (source transparency). */
  sources: AIContextSource[];
}

/** Context Ranking + Compression: the block that enters the system prompt. */
export function serializeBrainContext(ctx: BrainContext): SerializedBrainContext {
  const budget = ctx.decision.budgetTokens;
  let block = `用户：${ctx.self?.name ?? "当前用户"}`;
  let truncated = false;

  for (const section of buildSections(ctx)) {
    const candidate = `${block}\n\n【${section.title}】\n${section.body}`;
    if (estimateTokens(candidate) <= budget) {
      block = candidate;
      continue;
    }
    const header = `${block}\n\n【${section.title}】\n`;
    const remainingChars = Math.floor((budget - estimateTokens(header)) * 1.5);
    if (remainingChars > 200) {
      block = `${header}${section.body.slice(0, remainingChars)}…（已截断）`;
    }
    truncated = true;
    break;
  }

  const sources: AIContextSource[] = [
    ...(ctx.focusObject
      ? [{ kind: "object" as const, id: ctx.focusObject.id, label: ctx.focusObject.name }]
      : []),
    ...ctx.memories.slice(0, 10).map((m) => ({
      kind: "memory" as const,
      id: m.id,
      label: m.text.slice(0, 60),
      date: m.date,
    })),
    ...ctx.neighbors.slice(0, 5).map((n) => ({
      kind: "object" as const,
      id: n.object.id,
      label: n.object.name,
    })),
  ].slice(0, 20);

  return { block, truncated, estimatedTokens: estimateTokens(block), sources };
}
