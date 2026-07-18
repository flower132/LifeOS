import { Language } from "@/lib/i18n";
import { LifeObject, Note } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { extractMemoryKnowledge } from "./extractor";
import { linkEntities } from "./linker";
import { calculateImportance } from "./importance";
import { Memory, MemorySourceType } from "./types";

// ---------------------------------------------------------------------------
// Memory Processing Pipeline:
//
//   Input (note / AI content)
//     → Create Raw Memory
//     → AI Extract (MEMORY_EXTRACT via Router, local fallback)
//     → Identify + Link Entities (linker)
//     → Generate Summary
//     → Calculate Importance
//     → Save (memoryService persists)
//     → Relations updated on the memory record
//
// Pure and storage-free: produces the Memory record; memoryService owns
// persistence. Never throws — a broken pipeline must not break note saving.
// ---------------------------------------------------------------------------

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function getObjects(): LifeObject[] {
  if (typeof window === "undefined") return [];
  return useObjectStore.getState().objects;
}

function sourceTypeOf(note?: Note): MemorySourceType {
  if (!note) return "ai";
  if (note.attachments.length > 0) {
    const mime = note.attachments[0]?.mimeType ?? "";
    if (mime.startsWith("image/")) return "image";
    return "file";
  }
  return "text";
}

function knownEntityNames(objects: LifeObject[]) {
  return {
    people: objects.filter((o) => o.type === "person").map((o) => o.name),
    projects: objects.filter((o) => o.type === "project").map((o) => o.name),
    goals: objects.filter((o) => o.type === "goal").map((o) => o.name),
  };
}

export interface ProcessResult {
  memory: Omit<Memory, "id" | "createdAt" | "updatedAt">;
  usedAI: boolean;
}

/** Process a user note into a Memory record. */
export async function processNote(note: Note): Promise<ProcessResult | null> {
  try {
    const objects = getObjects();
    const extraction = await extractMemoryKnowledge({
      text: note.content,
      images: note.attachments.map((a) => ({
        mimeType: a.mimeType,
        base64Data: a.base64Data,
      })),
      language: getLanguage(),
      knownEntities: knownEntityNames(objects),
    });

    const links = linkEntities(extraction, objects);

    // A note explicitly attached to an object always links to it.
    if (note.object_id && !links.relations.some((r) => r.targetId === note.object_id)) {
      const attached = objects.find((o) => o.id === note.object_id);
      if (attached) {
        links.relations.push({ targetId: attached.id, relation: "attached" });
        links.linkedObjects.push(attached);
        if (attached.type === "person") links.entities.people.push(attached.id);
        if (attached.type === "project") links.entities.projects.push(attached.id);
        if (attached.type === "goal") links.entities.goals.push(attached.id);
      }
    }

    const importance = calculateImportance({
      note,
      aiImportance: extraction.aiImportance,
      linkedObjects: links.linkedObjects,
      type: extraction.type,
      hasInsights: extraction.insights.length > 0,
    });

    return {
      usedAI: extraction.summary !== note.content.slice(0, 40),
      memory: {
        type: extraction.type,
        content: note.content,
        summary: extraction.summary || note.content.slice(0, 40),
        entities: links.entities,
        topics: extraction.topics,
        emotions: extraction.emotions.length > 0 ? extraction.emotions : undefined,
        insights: extraction.insights,
        importance,
        timestamp: new Date(note.created_at).getTime(),
        source: { type: sourceTypeOf(note), noteId: note.id },
        relations: links.relations,
      },
    };
  } catch (err) {
    console.warn("[memory] Pipeline failed for note, skipping:", err);
    return null;
  }
}

/** Process AI-generated content (e.g. companion outputs) into a Memory. */
export async function processAIContent(params: {
  content: string;
  type?: Memory["type"];
}): Promise<ProcessResult | null> {
  try {
    const objects = getObjects();
    const extraction = await extractMemoryKnowledge({
      text: params.content,
      language: getLanguage(),
      knownEntities: knownEntityNames(objects),
    });
    const links = linkEntities(extraction, objects);

    const importance = calculateImportance({
      aiImportance: extraction.aiImportance,
      linkedObjects: links.linkedObjects,
      type: params.type ?? extraction.type,
      hasInsights: extraction.insights.length > 0,
    });

    return {
      usedAI: true,
      memory: {
        type: params.type ?? extraction.type,
        content: params.content,
        summary: extraction.summary || params.content.slice(0, 40),
        entities: links.entities,
        topics: extraction.topics,
        emotions: extraction.emotions.length > 0 ? extraction.emotions : undefined,
        insights: extraction.insights,
        importance,
        timestamp: Date.now(),
        source: { type: "ai" },
        relations: links.relations,
      },
    };
  } catch (err) {
    console.warn("[memory] Pipeline failed for AI content, skipping:", err);
    return null;
  }
}
