import { CompanionContext } from "./types";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { getLocalDateString } from "./utils/date";

export function buildCompanionContext(): CompanionContext {
  const objects = useObjectStore.getState().objects;
  const notes = useNoteStore.getState().notes;
  const relations = useRelationStore.getState().relations;
  const patterns = useIntelligenceStore.getState().cache.patterns;
  const language = useSettingsStore.getState().language ?? "zh";
  const self = objects.find((o) => o.type === "self") ?? null;

  return {
    self,
    objects,
    notes,
    relations,
    patterns,
    today: getLocalDateString(),
    language,
  };
}
