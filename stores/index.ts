import { useObjectStore } from "./objectStore";
import { useNoteStore } from "./noteStore";
import { useRelationStore } from "./relationStore";
import { useTagStore } from "./tagStore";
import { useTemplateStore } from "./templateStore";
import { useSettingsStore } from "./settingsStore";
import { useIntelligenceStore } from "./intelligenceStore";

/**
 * Rehydrate all stores from persistent storage.
 * Call once at app startup inside a client-only effect.
 */
export async function hydrateStores(): Promise<void> {
  await Promise.all([
    useObjectStore.getState().hydrate(),
    useNoteStore.getState().hydrate(),
    useRelationStore.getState().hydrate(),
    useTagStore.getState().hydrate(),
    useTemplateStore.getState().hydrate(),
    useSettingsStore.getState().hydrate(),
    useIntelligenceStore.getState().hydrate(),
  ]);
}

/**
 * Persist all stores immediately.
 * Most writes are already persisted; this is a no-op placeholder
 * for future explicit flush scenarios.
 */
export function persistStores(): void {
  useObjectStore.getState().persist();
  useNoteStore.getState().persist();
  useRelationStore.getState().persist();
  useTagStore.getState().persist();
  useTemplateStore.getState().persist();
  useSettingsStore.getState().persist();
  useIntelligenceStore.getState().persist();
}
