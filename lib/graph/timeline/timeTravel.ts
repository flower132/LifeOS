import { Language } from "@/lib/i18n";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { buildTimeTravelPrompt } from "@/lib/ai/prompts/timeTravel";
import { useObjectStore } from "@/stores/objectStore";
import { useRelationStore } from "@/stores/relationStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TimeSnapshot } from "./types";
import { queryTimeline } from "./timelineQuery";

// ---------------------------------------------------------------------------
// Time Travel — read-only snapshot of a past date + AI advice. 禁止修改历史:
// this module performs zero writes.
// ---------------------------------------------------------------------------

const DAY_MS = 1000 * 60 * 60 * 24;
const IN_PROGRESS_STATUS = ["in_progress", "进行中", "active"];

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

export type TimeTravelPreset = "week" | "month" | "year";

export function presetDate(preset: TimeTravelPreset): Date {
  const days = preset === "week" ? 7 : preset === "month" ? 30 : 365;
  return new Date(Date.now() - days * DAY_MS);
}

/** The world "as of" a past date (data the timeline carries for it). */
export function getSnapshotAt(date: Date): TimeSnapshot {
  const objects = useObjectStore.getState().objects;
  const relations = useRelationStore.getState().relations;
  const memories = useMemoryStore.getState().memories;
  const cache = useIntelligenceStore.getState().cache;

  const dateKey = date.toISOString().slice(0, 10);
  const ts = date.getTime();
  const weekFrom = ts - 7 * DAY_MS;

  const activeAt = (status: unknown) =>
    IN_PROGRESS_STATUS.includes(String(status ?? "").toLowerCase());

  const weekMemories = memories
    .filter((m) => m.timestamp >= weekFrom && m.timestamp <= ts)
    .sort((a, b) => b.timestamp - a.timestamp);

  const peopleCount = new Map<string, number>();
  for (const m of weekMemories) {
    for (const personId of m.entities.people) {
      peopleCount.set(personId, (peopleCount.get(personId) ?? 0) + 1);
    }
  }

  const focus = (cache.todayFocuses ?? []).find((f) => f.date === dateKey);
  const reflection = (cache.reflections ?? []).find((r) => r.date === dateKey);

  return {
    date: dateKey,
    activeGoals: objects
      .filter((o) => o.type === "goal" && activeAt(o.properties?.status) && new Date(o.created_at).getTime() <= ts)
      .map((o) => ({ id: o.id, name: o.name, status: String(o.properties?.status ?? "") })),
    activeProjects: objects
      .filter((o) => o.type === "project" && activeAt(o.properties?.status) && new Date(o.created_at).getTime() <= ts)
      .map((o) => ({ id: o.id, name: o.name, status: String(o.properties?.status ?? "") })),
    memoriesThatWeek: weekMemories.slice(0, 10).map((m) => ({
      id: m.id,
      date: new Date(m.timestamp).toISOString().slice(0, 10),
      text: m.summary ?? m.content.slice(0, 60),
    })),
    peopleContacted: [...peopleCount.entries()]
      .map(([id, count]) => ({
        id,
        name: objects.find((o) => o.id === id)?.name ?? "?",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    todayFocusTitle: focus?.title,
    reflectionQuestion: reflection?.question,
    graphSize: {
      objects: objects.filter((o) => new Date(o.created_at).getTime() <= ts).length,
      relations: relations.filter((r) => new Date(r.created_at).getTime() <= ts).length,
    },
    events: queryTimeline({ from: weekFrom, to: ts, limit: 30 }),
  };
}

/** AI: "如果回到那一天，你最应该做什么？"（只读，零写入） */
export async function generateTimeTravelAdvice(
  snapshot: TimeSnapshot
): Promise<string | null> {
  if (selectProviderForTask("TIME_TRAVEL").isMock) return null;
  if (snapshot.events.length === 0 && snapshot.memoriesThatWeek.length === 0) {
    return null;
  }
  try {
    const { content } = await postAI({
      task: "TIME_TRAVEL",
      prompt: buildTimeTravelPrompt({ snapshot, language: getLanguage() }),
      options: { jsonMode: false },
    });
    const text = content
      .trim()
      .replace(/^```(?:json|text|markdown)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    return text || null;
  } catch (err) {
    console.warn("[timeline] Time travel advice failed:", err);
    return null;
  }
}
