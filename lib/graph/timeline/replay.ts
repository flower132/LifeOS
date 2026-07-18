import { Language } from "@/lib/i18n";
import { storage } from "@/lib/storage";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { buildReplayPrompt } from "@/lib/ai/prompts/timelineSummary";
import { useMemoryStore } from "@/stores/memoryStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { computeTimelineStats } from "./timelineDiff";
import { queryTimeline } from "./timelineQuery";
import { rankTimelineEvents } from "./timelineRank";

// ---------------------------------------------------------------------------
// Life Replay — AI-generated yearly / quarterly / monthly replays, persisted
// as "summary" memories (deduped per period, zero re-generation on revisit).
// ---------------------------------------------------------------------------

export type ReplayPeriod = "month" | "quarter" | "year";

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function replayRange(period: ReplayPeriod, at: Date): { from: number; to: number; key: string; label: string } {
  const DAY = 24 * 60 * 60 * 1000;
  const to = at.getTime();
  if (period === "month") {
    const first = new Date(at.getFullYear(), at.getMonth(), 1);
    const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
    return { from: first.getTime(), to, key, label: `${key} 月` };
  }
  if (period === "quarter") {
    const quarter = Math.floor(at.getMonth() / 3);
    const first = new Date(at.getFullYear(), quarter * 3, 1);
    return { from: first.getTime(), to, key: `${at.getFullYear()}-Q${quarter + 1}`, label: `${at.getFullYear()} 年第 ${quarter + 1} 季度` };
  }
  const first = new Date(at.getFullYear(), 0, 1);
  void DAY;
  return { from: first.getTime(), to, key: `${at.getFullYear()}`, label: `${at.getFullYear()} 年` };
}

/** Read a previously generated replay (null when absent). */
export function getReplay(period: ReplayPeriod, at = new Date()): string | null {
  const { key } = replayRange(period, at);
  const existing = useMemoryStore
    .getState()
    .memories.find(
      (m) => m.type === "summary" && m.topics.includes(`life_replay:${period}:${key}`)
    );
  return existing?.content ?? null;
}

/** Get-or-generate the replay for a period. */
export async function generateReplay(
  period: ReplayPeriod,
  at = new Date()
): Promise<string | null> {
  const range = replayRange(period, at);
  const cached = getReplay(period, at);
  if (cached) return cached;

  if (selectProviderForTask("LIFE_REPLAY").isMock) return null;

  const stats = computeTimelineStats(range.from, range.to, range.label);
  if (stats.totalEvents === 0) return null;

  const topEvents = rankTimelineEvents(
    queryTimeline({ from: range.from, to: range.to, limit: 200 }),
    15
  );

  try {
    const { content } = await postAI({
      task: "LIFE_REPLAY",
      prompt: buildReplayPrompt({
        periodLabel: range.label,
        stats,
        topEvents,
        language: getLanguage(),
      }),
      options: { jsonMode: false },
    });
    const text = content
      .trim()
      .replace(/^```(?:json|text|markdown)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    if (!text) return null;

    const created = await storage.createMemory({
      type: "summary",
      content: text,
      summary: text.slice(0, 40),
      entities: { people: [], projects: [], goals: [], places: [] },
      topics: [`life_replay:${period}:${range.key}`],
      insights: [],
      importance: 0.7,
      timestamp: Date.now(),
      source: { type: "ai" },
      relations: [],
    });
    useMemoryStore.getState().upsertLocal(created);
    return text;
  } catch (err) {
    console.warn("[timeline] Life replay failed:", err);
    return null;
  }
}
