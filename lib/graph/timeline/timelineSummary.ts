import { Language } from "@/lib/i18n";
import { storage } from "@/lib/storage";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import {
  buildEvolutionPrompt,
  buildTimelineSummaryPrompt,
} from "@/lib/ai/prompts/timelineSummary";
import { useMemoryStore } from "@/stores/memoryStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TimelineEvent } from "./types";
import { queryTimeline } from "./timelineQuery";
import { buildObjectTimeline, buildRelationTimeline } from "./timelineBuilder";

// ---------------------------------------------------------------------------
// Timeline Summary — AI period summaries and evolution narratives, all fed
// by the Timeline Engine (no repeated DB scans). Results persist as
// "summary" memories (deduped by topic tag).
// ---------------------------------------------------------------------------

export type TimelinePeriod = "day" | "week" | "month" | "quarter" | "year";

const STALE_MS: Record<string, number> = {
  evolution: 24 * 60 * 60 * 1000,
};

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json|text|markdown)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function periodRange(period: TimelinePeriod, at: Date): { from: number; to: number; key: string; label: string } {
  const to = at.getTime();
  const DAY = 24 * 60 * 60 * 1000;
  const iso = at.toISOString().slice(0, 10);
  switch (period) {
    case "day":
      return { from: to - DAY, to, key: `day:${iso}`, label: `今天（${iso}）` };
    case "week":
      return { from: to - 7 * DAY, to, key: `week:${iso}`, label: "最近一周" };
    case "month":
      return { from: to - 30 * DAY, to, key: `month:${iso.slice(0, 7)}`, label: "最近一个月" };
    case "quarter":
      return { from: to - 90 * DAY, to, key: `quarter:${iso.slice(0, 7)}`, label: "最近三个月" };
    case "year":
      return { from: to - 365 * DAY, to, key: `year:${iso.slice(0, 4)}`, label: "最近一年" };
  }
}

async function persistSummary(topic: string, text: string): Promise<void> {
  const store = useMemoryStore.getState();
  const existing = store.memories.find((m) => m.type === "summary" && m.topics.includes(topic));
  if (existing) {
    const updated = await storage.updateMemory(existing.id, {
      content: text,
      summary: text.slice(0, 40),
      timestamp: Date.now(),
    });
    useMemoryStore.getState().upsertLocal(updated);
    return;
  }
  const created = await storage.createMemory({
    type: "summary",
    content: text,
    summary: text.slice(0, 40),
    entities: { people: [], projects: [], goals: [], places: [] },
    topics: [topic],
    insights: [],
    importance: 0.6,
    timestamp: Date.now(),
    source: { type: "ai" },
    relations: [],
  });
  useMemoryStore.getState().upsertLocal(created);
}

function readSummary(topic: string, staleMs?: number): string | null {
  const existing = useMemoryStore
    .getState()
    .memories.find((m) => m.type === "summary" && m.topics.includes(topic));
  if (!existing) return null;
  if (staleMs && Date.now() - existing.timestamp > staleMs) return null;
  return existing.content;
}

async function summarizeWithAI(topic: string, prompt: string): Promise<string | null> {
  if (selectProviderForTask("TIMELINE_SUMMARY").isMock) return null;
  try {
    const { content } = await postAI({
      task: "TIMELINE_SUMMARY",
      prompt,
      options: { jsonMode: false },
    });
    const text = stripFences(content);
    if (!text) return null;
    await persistSummary(topic, text);
    return text;
  } catch (err) {
    console.warn("[timeline] Summary failed:", err);
    return null;
  }
}

/** Get-or-generate a period summary from the timeline event stream. */
export async function summarizeTimeline(
  period: TimelinePeriod,
  at = new Date()
): Promise<string | null> {
  const range = periodRange(period, at);
  const topic = `timeline_summary:${range.key}`;

  const cached = readSummary(topic);
  if (cached) return cached;

  const events = queryTimeline({ from: range.from, to: range.to, limit: 60 });
  if (events.length === 0) return null;

  return summarizeWithAI(
    topic,
    buildTimelineSummaryPrompt({
      periodLabel: range.label,
      events,
      language: getLanguage(),
    })
  );
}

function evolutionTopic(kind: string, id: string): string {
  return `timeline_evolution:${kind}:${id}`;
}

/** Relationship Evolution for a person/object (cached 24h). */
export async function summarizeObjectEvolution(
  objectId: string,
  objectName: string,
  kind: "relationship" | "project" | "goal"
): Promise<string | null> {
  const topic = evolutionTopic(kind, objectId);
  const cached = readSummary(topic, STALE_MS.evolution);
  if (cached) return cached;

  const events = buildObjectTimeline(objectId);
  if (events.length < 2) return null;

  return summarizeWithAI(
    topic,
    buildEvolutionPrompt({
      subjectName: objectName,
      subjectKind: kind,
      events,
      language: getLanguage(),
    })
  );
}

/** Relation Evolution for one edge (cached 24h). */
export async function summarizeRelationEvolution(
  relationId: string,
  subjectName: string
): Promise<string | null> {
  const topic = evolutionTopic("relation", relationId);
  const cached = readSummary(topic, STALE_MS.evolution);
  if (cached) return cached;

  const events = buildRelationTimeline(relationId);
  if (events.length < 2) return null;

  return summarizeWithAI(
    topic,
    buildEvolutionPrompt({
      subjectName,
      subjectKind: "relationship",
      events,
      language: getLanguage(),
    })
  );
}

/** Read-only access for UI (null when absent or stale). */
export function getCachedEvolution(kind: string, id: string): string | null {
  return readSummary(evolutionTopic(kind, id), STALE_MS.evolution);
}

export function getCachedTimelineSummary(period: TimelinePeriod, at = new Date()): string | null {
  return readSummary(`timeline_summary:${periodRange(period, at).key}`);
}

/** Extra export to keep TimelineEvent referenced for doc tooling. */
export type { TimelineEvent };
