import { z } from "zod";
import { Language } from "@/lib/i18n";
import { LifeObject, Note } from "@/lib/types";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import {
  buildObjectProfilePrompt,
  buildObjectProfileUpdatePrompt,
} from "@/lib/ai/prompts/objectProfile";
import { buildPersonAdvicePrompt } from "@/lib/ai/prompts/personAdvice";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { memoryService } from "@/lib/memory/memoryService";
import { memoriesForObject } from "@/lib/memory/strategies/shared";
import { useMemoryStore } from "@/stores/memoryStore";
import { calculateConfidence } from "./confidence";
import { ObjectProfile } from "./types";
import { ObjectIntelligenceStrategy } from "./strategies/types";
import { personStrategy } from "./strategies/person";
import { goalStrategy } from "./strategies/goal";
import { projectStrategy } from "./strategies/project";
import { selfStrategy } from "./strategies/self";
import { placeStrategy } from "./strategies/place";

// ---------------------------------------------------------------------------
// Analyzer — AI profile generation and incremental updates. All AI calls go
// through the AI Router (postAI → /api/ai). Mock/privacy mode returns null.
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  summary: z.string().default(""),
  traits: z.array(z.string()).default([]),
  preferences: z.array(z.string()).default([]),
  importantEvents: z.array(z.string()).default([]),
  recentChanges: z.array(z.string()).default([]),
  relationshipSummary: z.string().default(""),
  communicationStyle: z.string().default(""),
  insights: z.array(z.string()).default([]),
  risk: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
});

const adviceSchema = z.object({
  understanding: z.string().default(""),
  advice: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  suggestedApproach: z.string().default(""),
  possibleReactions: z.array(z.string()).default([]),
});

export interface PersonAdvice {
  understanding: string;
  advice: string[];
  warnings: string[];
  suggestedApproach: string;
  possibleReactions: string[];
}

const STRATEGIES: Partial<Record<LifeObject["type"], ObjectIntelligenceStrategy>> = {
  person: personStrategy,
  goal: goalStrategy,
  project: projectStrategy,
  self: selfStrategy,
};

const GENERIC_INSTRUCTIONS = `这是一个普通对象。请总结：
1. summary：这个对象是什么、当前状态。
2. importantEvents：重要事件（按时间倒序）。
3. recentChanges：最近变化。
4. insights：值得记住的认知。`;

function strategyFor(object: LifeObject): ObjectIntelligenceStrategy {
  return (
    STRATEGIES[object.type] ??
    (object.type === ("place" as LifeObject["type"]) ? placeStrategy : { promptInstructions: () => GENERIC_INSTRUCTIONS })
  );
}

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function getNotesForObject(objectId: string, limit: number): Note[] {
  if (typeof window === "undefined") return [];
  return useNoteStore
    .getState()
    .notes.filter((n) => n.object_id === objectId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

function getRelatedObjectNames(object: LifeObject, allObjects: LifeObject[]): string[] {
  if (typeof window === "undefined") return [];
  const relations = useRelationStore.getState().relations;
  const relatedIds = new Set(
    relations
      .filter(
        (r) => r.source_object_id === object.id || r.target_object_id === object.id
      )
      .flatMap((r) => [r.source_object_id, r.target_object_id])
  );
  relatedIds.delete(object.id);
  return allObjects.filter((o) => relatedIds.has(o.id)).map((o) => o.name);
}

function toProfile(
  parsed: z.infer<typeof profileSchema>,
  object: LifeObject,
  memories: ReturnType<typeof memoriesForObject>,
  notes: Note[]
): ObjectProfile {
  return {
    summary: parsed.summary,
    traits: parsed.traits.slice(0, 5),
    preferences: parsed.preferences.slice(0, 5),
    importantEvents: parsed.importantEvents.slice(0, 8),
    recentChanges: parsed.recentChanges.slice(0, 5),
    relationshipSummary: parsed.relationshipSummary || undefined,
    communicationStyle: parsed.communicationStyle || undefined,
    insights: parsed.insights.slice(0, 5),
    risk: parsed.risk.slice(0, 5),
    opportunities: parsed.opportunities.slice(0, 5),
    confidence: calculateConfidence({ memories, notes, object }),
    lastUpdated: Date.now(),
  };
}

/** Generate a full profile from scratch. Null when AI unavailable/fails. */
export async function generateObjectProfile(
  object: LifeObject,
  allObjects: LifeObject[]
): Promise<ObjectProfile | null> {
  if (selectProviderForTask("OBJECT_PROFILE").isMock) return null;

  const memories = memoriesForObject(object.id, useMemoryStore.getState().memories);
  const notes = getNotesForObject(object.id, 15);
  const knowledgeLines = memoryService.getObjectKnowledgeSync(object.id);

  const prompt = buildObjectProfilePrompt({
    object,
    memories,
    notes,
    relatedObjectNames: getRelatedObjectNames(object, allObjects),
    typeInstructions: strategyFor(object).promptInstructions(object),
    knowledgeLines,
    language: getLanguage(),
  });

  try {
    const { content } = await postAI({
      task: "OBJECT_PROFILE",
      prompt,
      contextHint: { objectId: object.id },
      options: {
        schemaHint:
          '{"summary":"string","traits":[],"preferences":[],"importantEvents":[],"recentChanges":[],"relationshipSummary":"string","communicationStyle":"string","insights":[],"risk":[],"opportunities":[]}',
      },
    });
    const parsed = profileSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.warn("[object-intelligence] Profile schema mismatch:", parsed.error);
      return null;
    }
    return toProfile(parsed.data, object, memories, notes);
  } catch (err) {
    console.warn("[object-intelligence] Profile generation failed:", err);
    return null;
  }
}

/** Incremental update: existing profile + new material → refreshed profile. */
export async function updateObjectProfileIncremental(
  object: LifeObject,
  existing: ObjectProfile,
  newMemories: ReturnType<typeof memoriesForObject>,
  newNotes: Note[]
): Promise<ObjectProfile | null> {
  if (selectProviderForTask("OBJECT_PROFILE").isMock) return null;

  const prompt = buildObjectProfileUpdatePrompt({
    object,
    existingProfile: existing as unknown as Record<string, unknown>,
    newMemories,
    newNotes,
    language: getLanguage(),
  });

  try {
    const { content } = await postAI({
      task: "OBJECT_PROFILE",
      prompt,
      contextHint: { objectId: object.id },
    });
    const parsed = profileSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.warn("[object-intelligence] Update schema mismatch:", parsed.error);
      return null;
    }
    const allMemories = memoriesForObject(object.id, useMemoryStore.getState().memories);
    return toProfile(parsed.data, object, allMemories, getNotesForObject(object.id, 15));
  } catch (err) {
    console.warn("[object-intelligence] Incremental update failed:", err);
    return null;
  }
}

/** Communication Assistant (PERSON_ADVICE): situational guidance. */
export async function generateCommunicationAdvice(
  person: LifeObject,
  profile: ObjectProfile | null,
  situation: string
): Promise<PersonAdvice | null> {
  if (selectProviderForTask("PERSON_ADVICE").isMock) return null;

  const prompt = buildPersonAdvicePrompt({
    person,
    profile,
    situation,
    language: getLanguage(),
  });

  try {
    const { content } = await postAI({
      task: "PERSON_ADVICE",
      prompt,
      contextHint: { objectId: person.id, query: situation },
      options: {
        schemaHint:
          '{"understanding":"string","advice":[],"warnings":[],"suggestedApproach":"string","possibleReactions":[]}',
      },
    });
    const parsed = adviceSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.warn("[object-intelligence] Advice schema mismatch:", parsed.error);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.warn("[object-intelligence] Communication advice failed:", err);
    return null;
  }
}
