import { LifeObject } from "@/lib/types";
import { Memory } from "@/lib/memory/types";
import { useObjectStore } from "@/stores/objectStore";
import { objectIntelligenceEngine } from "./engine";

// ---------------------------------------------------------------------------
// Background Updater — profiles are NEVER generated synchronously on page
// view. New memories mark objects dirty; a debounced queue refreshes
// profiles incrementally in the background (max batch per cycle).
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 20_000;
const MAX_BATCH_PER_CYCLE = 3;

const dirtyMemories = new Map<string, Memory[]>();
let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;

function findObject(objectId: string): LifeObject | undefined {
  return useObjectStore.getState().objects.find((o) => o.id === objectId);
}

async function processQueue(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const batch = Array.from(dirtyMemories.keys()).slice(0, MAX_BATCH_PER_CYCLE);
    for (const objectId of batch) {
      const memories = dirtyMemories.get(objectId) ?? [];
      dirtyMemories.delete(objectId);
      const object = findObject(objectId);
      if (!object) continue; // object deleted — profile cleanup happens separately
      try {
        await objectIntelligenceEngine.updateProfileIncremental(object, memories);
      } catch (err) {
        console.warn(`[object-intelligence] Background update failed for ${object.name}:`, err);
      }
    }
  } finally {
    running = false;
    if (dirtyMemories.size > 0) schedule();
  }
}

function schedule(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void processQueue();
  }, DEBOUNCE_MS);
}

export const objectIntelligenceUpdater = {
  /** Called by the memory pipeline after a memory is persisted. */
  notifyMemory(memory: Memory): void {
    if (typeof window === "undefined") return;
    const objectIds = new Set(memory.relations.map((r) => r.targetId));
    for (const objectId of objectIds) {
      const list = dirtyMemories.get(objectId) ?? [];
      list.push(memory);
      dirtyMemories.set(objectId, list);
    }
    if (objectIds.size > 0) schedule();
  },

  /** Queue a full profile build for an object missing one (background). */
  ensureProfile(objectId: string): void {
    if (typeof window === "undefined") return;
    if (objectIntelligenceEngine.getProfile(objectId)) return;
    if (dirtyMemories.has(objectId)) return;
    dirtyMemories.set(objectId, []);
    schedule();
  },

  /** Object deleted: drop queued work and the cached profile. */
  notifyObjectsRemoved(objectIds: string[]): void {
    for (const id of objectIds) dirtyMemories.delete(id);
    void objectIntelligenceEngine.removeProfilesFor(objectIds);
  },
};
