import { Language } from "@/lib/i18n";
import { LifeObject, Note } from "@/lib/types";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";
import { analyzeObjectUpdate } from "./analyzeObjectUpdate";
import { useObjectStore } from "@/stores/objectStore";

export interface TriggerBackgroundUpdateOptions {
  forceMock?: boolean;
  language?: Language;
}

export async function triggerBackgroundObjectUpdate(
  object: LifeObject,
  newNote: Note,
  options: TriggerBackgroundUpdateOptions = {}
): Promise<void> {
  if (!object || object.type !== "self") return;

  const noteStore = (await import("@/stores/noteStore")).useNoteStore.getState();
  const existingNotes = noteStore.notes.filter(
    (n) => n.object_id === object.id && n.id !== newNote.id
  );

  const input: AIAnalysisInput = {
    textInput: newNote.content,
    images:
      newNote.attachments?.map((a) => ({
        mimeType: a.mimeType,
        base64Data: a.base64Data,
      })) ?? [],
  };

  try {
    const result = await analyzeObjectUpdate(
      object.type,
      object,
      existingNotes,
      input,
      options
    );

    if (!result.success) {
      console.warn("[triggerBackgroundObjectUpdate] Analysis failed:", result.error);
      return;
    }

    const { mergedObject } = result.data;
    await useObjectStore.getState().updateObject(object.id, mergedObject);
  } catch (err) {
    console.error("[triggerBackgroundObjectUpdate] Unexpected error:", err);
  }
}
