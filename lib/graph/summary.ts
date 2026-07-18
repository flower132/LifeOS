import { Language } from "@/lib/i18n";
import { storage } from "@/lib/storage";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { buildGraphSummaryPrompt } from "@/lib/ai/prompts/graphSummary";
import { useMemoryStore } from "@/stores/memoryStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Memory } from "@/lib/memory/types";
import { buildGraphContext } from "./contextBuilder";

// ---------------------------------------------------------------------------
// AI Graph Summary — narrative summary of an object's graph context,
// persisted as a "summary" Memory (deduped by topic tag) and refreshed in
// the background when stale. Never blocks UI.
// ---------------------------------------------------------------------------

const STALE_MS = 24 * 60 * 60 * 1000; // refresh daily
const TOPIC_PREFIX = "graph_summary:";

/** Models sometimes wrap free text in markdown fences even with jsonMode off. */
function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json|text|markdown)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function summaryMemoryFor(objectId: string): Memory | undefined {
  return useMemoryStore
    .getState()
    .memories.find(
      (m) => m.type === "summary" && m.topics.includes(`${TOPIC_PREFIX}${objectId}`)
    );
}

/** Cached graph summary text, if present and fresh. */
export function getGraphSummary(objectId: string): string | null {
  const existing = summaryMemoryFor(objectId);
  return existing?.content ?? null;
}

export function isGraphSummaryStale(objectId: string): boolean {
  const existing = summaryMemoryFor(objectId);
  if (!existing) return true;
  return Date.now() - existing.timestamp > STALE_MS;
}

/**
 * Generate + persist the graph summary (background). Returns the text, or
 * null when AI is unavailable or there is no graph data to summarize.
 */
export async function generateGraphSummary(objectId: string): Promise<string | null> {
  if (selectProviderForTask("GRAPH_SUMMARY").isMock) return null;

  const context = buildGraphContext(objectId, { hops: 2 });
  if (!context || context.neighbors.length + context.memories.length === 0) {
    return null;
  }

  try {
    const { content } = await postAI({
      task: "GRAPH_SUMMARY",
      prompt: buildGraphSummaryPrompt({ context, language: getLanguage() }),
      contextHint: { objectId },
      options: { jsonMode: false },
    });
    const text = stripMarkdownFences(content);
    if (!text) return null;

    const existing = summaryMemoryFor(objectId);
    if (existing) {
      const updated = await storage.updateMemory(existing.id, {
        content: text,
        summary: text.slice(0, 40),
        timestamp: Date.now(),
      });
      useMemoryStore.getState().upsertLocal(updated);
    } else {
      const created = await storage.createMemory({
        type: "summary",
        content: text,
        summary: text.slice(0, 40),
        entities: { people: [], projects: [], goals: [], places: [] },
        topics: [`${TOPIC_PREFIX}${objectId}`],
        insights: [],
        importance: 0.6,
        timestamp: Date.now(),
        source: { type: "ai" },
        relations: [{ targetId: objectId, relation: "summarizes" }],
      });
      useMemoryStore.getState().upsertLocal(created);
    }

    return text;
  } catch (err) {
    console.warn("[graph] Graph summary failed:", err);
    return null;
  }
}

/** Fire-and-forget refresh when stale — used by the object page. */
export function ensureGraphSummary(objectId: string): void {
  if (typeof window === "undefined") return;
  if (!isGraphSummaryStale(objectId)) return;
  void generateGraphSummary(objectId);
}
