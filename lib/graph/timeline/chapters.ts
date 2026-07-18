import { z } from "zod";
import { Language } from "@/lib/i18n";
import { LifeChapter } from "@/lib/types";
import { storage } from "@/lib/storage";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { buildLifeChapterPrompt } from "@/lib/ai/prompts/lifeChapter";
import { useObjectStore } from "@/stores/objectStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useLongTermMemoryStore } from "@/stores/longTermMemoryStore";
import { getTimelineEvents } from "./timelineBuilder";

// ---------------------------------------------------------------------------
// Life Chapter — AI clustering of the timeline into named chapters, written
// into the EXISTING LifeChapter storage (same entity as the rule-based
// chapterEngine; sync included). User operations: rename / merge / split.
// ---------------------------------------------------------------------------

const chapterSchema = z.object({
  chapters: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().default(""),
        startDate: z.string(),
        endDate: z.string().nullable().optional(),
        people: z.array(z.string()).default([]),
        goals: z.array(z.string()).default([]),
        places: z.array(z.string()).default([]),
        growth: z.string().default(""),
      })
    )
    .max(5)
    .default([]),
});

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function getChapters(): LifeChapter[] {
  return useLongTermMemoryStore.getState().chapters;
}

async function refreshStore(): Promise<void> {
  await useLongTermMemoryStore.getState().load();
}

async function persistChapter(chapter: LifeChapter): Promise<void> {
  await storage.updateChapter(chapter.id, chapter);
  await refreshStore();
}

async function removeChapter(id: string): Promise<void> {
  await storage.deleteChapter(id);
  await refreshStore();
}

function dedupeKeyFor(startDate: string): string {
  return `chapter:${startDate.slice(0, 10)}`;
}

/**
 * Generate AI chapters from the timeline and persist NEW ones (deduped by
 * start date against existing chapters — rule-based and AI chapters coexist).
 * Returns the newly created chapters.
 */
export async function generateAIChapters(): Promise<LifeChapter[]> {
  if (selectProviderForTask("LIFE_CHAPTER").isMock) return [];

  const events = getTimelineEvents();
  if (events.length < 5) return [];

  const existing = getChapters();
  const objects = useObjectStore.getState().objects;

  try {
    const { content } = await postAI({
      task: "LIFE_CHAPTER",
      prompt: buildLifeChapterPrompt({
        events,
        existingChapterTitles: existing.map((c) => c.title),
        language: getLanguage(),
      }),
      options: {
        schemaHint:
          '{"chapters":[{"title":"string","description":"string","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD|null","people":[],"goals":[],"places":[],"growth":"string"}]}',
      },
    });

    const parsed = chapterSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.warn("[timeline] Chapter schema mismatch:", parsed.error);
      return [];
    }

    const existingKeys = new Set(existing.map((c) => c.dedupeKey));
    const createdChapters: LifeChapter[] = [];

    for (const candidate of parsed.data.chapters) {
      const dedupeKey = dedupeKeyFor(candidate.startDate);
      if (existingKeys.has(dedupeKey)) continue;
      existingKeys.add(dedupeKey);

      const peopleIds = candidate.people
        .map((name) => objects.find((o) => o.type === "person" && o.name === name)?.id)
        .filter((id): id is string => Boolean(id));
      const goalIds = candidate.goals
        .map((name) => objects.find((o) => (o.type === "goal" || o.type === "project") && o.name === name)?.id)
        .filter((id): id is string => Boolean(id));

      const chapter: LifeChapter = {
        id: crypto.randomUUID(),
        dedupeKey,
        title: candidate.title,
        description: candidate.growth
          ? `${candidate.description} 成长：${candidate.growth}`
          : candidate.description,
        startDate: new Date(candidate.startDate).toISOString(),
        endDate: candidate.endDate ? new Date(candidate.endDate).toISOString() : undefined,
        people: peopleIds,
        goals: goalIds,
        places: candidate.places,
        representativeMemoryIds: [],
        status: candidate.endDate ? "closed" : "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await storage.createChapter(chapter);
      createdChapters.push(chapter);
    }

    if (createdChapters.length > 0) {
      await refreshStore();
    }
    return createdChapters;
  } catch (err) {
    console.warn("[timeline] AI chapter generation failed:", err);
    return [];
  }
}

/** Rename a chapter (user edit, synced). */
export async function renameChapter(id: string, title: string): Promise<void> {
  const chapter = getChapters().find((c) => c.id === id);
  if (!chapter || !title.trim()) return;
  await persistChapter({
    ...chapter,
    title: title.trim(),
    updatedAt: new Date().toISOString(),
  });
}

/** Merge chapters into the earliest one; others are removed. */
export async function mergeChapters(ids: string[]): Promise<void> {
  const chapters = getChapters().filter((c) => ids.includes(c.id));
  if (chapters.length < 2) return;

  const sorted = [...chapters].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const head = sorted[0];
  const tail = sorted[sorted.length - 1];

  const merged: LifeChapter = {
    ...head,
    description: sorted.map((c) => c.description || c.title).join(" / "),
    startDate: head.startDate,
    endDate: sorted.some((c) => !c.endDate) ? undefined : tail.endDate,
    people: [...new Set(sorted.flatMap((c) => c.people))],
    goals: [...new Set(sorted.flatMap((c) => c.goals))],
    places: [...new Set(sorted.flatMap((c) => c.places))],
    representativeMemoryIds: [...new Set(sorted.flatMap((c) => c.representativeMemoryIds))],
    status: sorted.some((c) => !c.endDate) ? "active" : "closed",
    updatedAt: new Date().toISOString(),
  };

  await persistChapter(merged);
  for (const chapter of sorted.slice(1)) {
    await removeChapter(chapter.id);
  }
}

/** Split a chapter at a date: [start, at) and [at, end]. */
export async function splitChapter(id: string, atDate: string): Promise<void> {
  const chapter = getChapters().find((c) => c.id === id);
  if (!chapter) return;

  const at = new Date(atDate);
  if (Number.isNaN(at.getTime())) return;
  if (at.toISOString() <= chapter.startDate) return;
  if (chapter.endDate && at.toISOString() >= chapter.endDate) return;

  const first: LifeChapter = {
    ...chapter,
    endDate: at.toISOString(),
    status: "closed",
    updatedAt: new Date().toISOString(),
  };
  const second: LifeChapter = {
    ...chapter,
    id: crypto.randomUUID(),
    dedupeKey: dedupeKeyFor(atDate),
    title: `${chapter.title}（续）`,
    startDate: at.toISOString(),
    status: chapter.endDate ? "closed" : "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await persistChapter(first);
  await storage.createChapter(second);
  await refreshStore();
}
