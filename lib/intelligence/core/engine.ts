import {
  LifeObject,
  Note,
  IntelligenceCache,
  IntelligencePattern,
  IntelligenceTodayStory,
} from "@/lib/types";
import { storage } from "@/lib/storage";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { AIProvider, AIStructuredGenerationRequest } from "@/lib/ai/types";

import {
  IntelligenceContext,
  IntelligenceRunOptions,
  PatternEngineInput,
  TodayStoryEngineInput,
  RelatedMemory,
} from "./types";
import { discoverPatterns } from "../engines/patternEngine";
import { buildPatternPrompt } from "@/lib/ai/prompts/pattern";
import { buildTodayStoryPrompt } from "@/lib/ai/prompts/todayStory";
import { buildRelatedMemoriesPrompt } from "@/lib/ai/prompts/memoryUnderstanding";
import {
  mapTodayStoryOutput,
  buildMockTodayStory,
} from "../engines/todayStoryEngine";
import { mapRelatedMemoriesOutput } from "../engines/relatedMemoriesEngine";
import { useIntelligenceStore } from "@/stores/intelligenceStore";

const DEFAULT_ANALYSIS_WINDOW_DAYS = 180;
const MAX_NOTES_FOR_PROMPT = 50;

function getSelfObject(objects: LifeObject[]): (LifeObject & { type: "self" }) | null {
  const self = objects.find((o) => o.type === "self");
  return self ? (self as LifeObject & { type: "self" }) : null;
}

function filterNotesForPrompt(notes: Note[], maxNotes: number): Note[] {
  if (notes.length <= maxNotes) return notes;
  // Keep most recent notes; older notes are less likely to be relevant for incremental analysis.
  return notes
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, maxNotes)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

async function buildContext(opts?: { noteId?: string; maxNotes?: number }): Promise<IntelligenceContext | null> {
  const objects = useObjectStore.getState().objects;
  const notes = useNoteStore.getState().notes;
  const relations = useRelationStore.getState().relations;
  const settings = useSettingsStore.getState();

  const self = getSelfObject(objects);
  if (!self) return null;

  const maxNotes = opts?.maxNotes ?? MAX_NOTES_FOR_PROMPT;
  const relevantNotes = opts?.noteId
    ? filterNotesForPrompt(
        notes.filter((n) => n.id === opts.noteId || n.object_id === self.id),
        maxNotes
      )
    : filterNotesForPrompt(notes, maxNotes);

  const to = new Date().toISOString();
  const from = new Date(Date.now() - DEFAULT_ANALYSIS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  return {
    userId: self.id,
    self,
    objects,
    notes: relevantNotes,
    relations,
    language: settings.language ?? "zh",
    analysisWindow: { from, to },
  };
}

async function callStructured(
  provider: AIProvider,
  prompt: string,
  schemaHint?: string
): Promise<unknown> {
  const request: AIStructuredGenerationRequest = {
    prompt,
    schemaHint,
    objectType: "self",
  };
  const text = await provider.generateStructuredObject(request);
  return JSON.parse(text);
}

export class IntelligenceService {
  async runIncremental(opts?: IntelligenceRunOptions): Promise<void> {
    const { provider, isMock } = selectProviderForTask("PATTERN");
    if (isMock && !opts?.force) {
      console.log("[Intelligence] Skipping incremental analysis: mock provider.");
      return;
    }

    const context = await buildContext({ noteId: opts?.noteId });
    if (!context) return;

    const store = useIntelligenceStore.getState();
    const existingCache = store.cache;

    const patterns = await this.runPatternEngine(context, provider, existingCache.patterns);

    const nextCache: IntelligenceCache = {
      ...existingCache,
      patterns,
    };

    await store.setCache(nextCache);

    const meta = await storage.getIntelligenceMeta();
    await storage.setIntelligenceMeta({
      ...meta,
      lastIncrementalAnalysisAt: new Date().toISOString(),
      pendingUpdate: false,
    });
    store.setMeta({ ...store.meta, lastIncrementalAnalysisAt: new Date().toISOString(), pendingUpdate: false });
  }

  async runFull(opts?: IntelligenceRunOptions): Promise<void> {
    const { provider, isMock } = selectProviderForTask("PATTERN");
    if (isMock && !opts?.force) {
      console.log("[Intelligence] Skipping full analysis: mock provider.");
      return;
    }

    const context = await buildContext();
    if (!context) return;

    const store = useIntelligenceStore.getState();
    const existingCache = store.cache;

    const patterns = await this.runPatternEngine(context, provider, existingCache.patterns);

    const nextCache: IntelligenceCache = {
      ...existingCache,
      patterns,
    };

    await store.setCache(nextCache);

    const meta = await storage.getIntelligenceMeta();
    await storage.setIntelligenceMeta({
      ...meta,
      lastFullAnalysisAt: new Date().toISOString(),
      pendingUpdate: false,
    });
    store.setMeta({ ...store.meta, lastFullAnalysisAt: new Date().toISOString(), pendingUpdate: false });
  }

  async generateTodayStory(
    date: string,
    opts?: { force?: boolean }
  ): Promise<IntelligenceTodayStory | null> {
    if (!opts?.force) {
      const cached = await storage.getTodayStory(date);
      if (cached) return cached;
    }

    const { provider, isMock } = selectProviderForTask("TODAY_STORY");

    const context = await buildContext({ maxNotes: 100 });
    if (!context) return null;

    const input: TodayStoryEngineInput = {
      self: context.self,
      notes: context.notes,
      language: context.language,
      date,
    };

    let story: IntelligenceTodayStory | null;
    if (isMock) {
      story = buildMockTodayStory(input, date);
    } else {
      const prompt = buildTodayStoryPrompt(input);
      const rawOutput = await callStructured(provider, prompt);
      story = mapTodayStoryOutput(rawOutput, date);
    }

    if (!story) return null;

    await storage.createTodayStory(story);
    const store = useIntelligenceStore.getState();
    store.setTodayStories([story, ...store.cache.todayStories.filter((s) => s.date !== date)].slice(0, 30));
    return story;
  }

  async findRelatedMemories(noteId: string): Promise<RelatedMemory[]> {
    const { provider, isMock } = selectProviderForTask("MEMORY_UNDERSTANDING");
    const notes = useNoteStore.getState().notes;
    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote) return [];
    if (isMock) return [];

    const settings = useSettingsStore.getState();
    const otherNotes = notes.filter((n) => n.id !== noteId).slice(0, 40);
    const otherNotesText = otherNotes
      .map((n) => `[note:${n.id}] ${n.created_at}\n${n.content}`)
      .join("\n\n---\n\n");

    const prompt = buildRelatedMemoriesPrompt({
      targetNoteId: noteId,
      targetContent: `[note:${targetNote.id}] ${targetNote.created_at}\n${targetNote.content}`,
      otherNotesText,
      language: settings.language ?? "zh",
    });

    const rawOutput = await callStructured(provider, prompt);
    return mapRelatedMemoriesOutput(rawOutput);
  }

  private async runPatternEngine(
    context: IntelligenceContext,
    provider: AIProvider,
    existingPatterns: IntelligencePattern[]
  ): Promise<IntelligencePattern[]> {
    const input: PatternEngineInput = {
      self: context.self,
      objects: context.objects,
      notes: context.notes,
      relations: context.relations,
      language: context.language,
    };

    const prompt = buildPatternPrompt(input);
    const rawOutput = await callStructured(provider, prompt);
    return discoverPatterns(rawOutput, input, existingPatterns);
  }
}

export const intelligenceService = new IntelligenceService();
