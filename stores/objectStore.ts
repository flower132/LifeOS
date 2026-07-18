import { create } from "zustand";
import { LifeObject, LIFE_OBJECT_TYPES, ObjectDeletionSnapshot } from "@/lib/types";
import { storage } from "@/lib/storage";
import { memoryService } from "@/lib/memory";
import { objectIntelligenceUpdater } from "@/lib/object-intelligence";
import { emit, subscribe } from "./storeEvents";

interface ObjectState {
  objects: LifeObject[];
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => void;
  addObject: (
    obj: Omit<LifeObject, "id" | "created_at" | "updated_at">
  ) => Promise<LifeObject>;
  updateObject: (
    id: string,
    updates: Partial<Omit<LifeObject, "id" | "created_at" | "updated_at">>
  ) => Promise<void>;
  removeObject: (id: string) => Promise<void>;
  removeObjects: (ids: string[]) => Promise<ObjectDeletionSnapshot>;
  restoreObjects: (snapshot: ObjectDeletionSnapshot) => Promise<void>;
  getById: (id: string) => LifeObject | undefined;
  getByType: (type: LifeObject["type"]) => LifeObject[];
}

export const useObjectStore = create<ObjectState>((set, get) => {
  // Subscribe to external store changes so in-memory state stays in sync
  // without creating circular imports between store modules.
  if (typeof window !== "undefined") {
    subscribe("tagsChanged", () => {
      void get().load();
    });
  }

  return {
    objects: [],
    loaded: false,
    _loading: false,
    error: null,

    load: async () => {
      set({ _loading: true, error: null });
      try {
        const objects = await storage.getObjects();
        set({ objects, loaded: true, _loading: false });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load objects";
        set({ error: message, loaded: true, _loading: false });
      }
    },
    hydrate: async () => get().load(),
    persist: () => undefined,

    addObject: async (obj) => {
      try {
        const created = await storage.createObject(obj);
        set((state) => ({ objects: [created, ...state.objects], error: null }));
        emit("tagsChanged");
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create object";
        set({ error: message });
        throw err;
      }
    },

    updateObject: async (id, updates) => {
      try {
        const updated = await storage.updateObject(id, updates);
        set((state) => ({
          objects: state.objects.map((o) => (o.id === id ? updated : o)),
          error: null,
        }));
        if (updates.tag_ids !== undefined) {
          emit("tagsChanged");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update object";
        set({ error: message });
        throw err;
      }
    },

    removeObject: async (id) => {
      try {
        await storage.deleteObject(id);
        set((state) => ({
          objects: state.objects.filter((o) => o.id !== id),
          error: null,
        }));
        // Memory policy: unlink, never delete history.
        void memoryService.unlinkObjects([id]);
        objectIntelligenceUpdater.notifyObjectsRemoved([id]);
        emit("objectsChanged");
        emit("tagsChanged");
        emit("notesChanged");
        emit("relationsChanged");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete object";
        set({ error: message });
        throw err;
      }
    },

    removeObjects: async (ids) => {
      try {
        const snapshot = await storage.deleteObjects(ids);
        const idSet = new Set(ids);
        set((state) => ({
          objects: state.objects.filter((o) => !idSet.has(o.id)),
          error: null,
        }));
        // Memory policy: unlink, never delete history.
        void memoryService.unlinkObjects(ids);
        objectIntelligenceUpdater.notifyObjectsRemoved(ids);
        emit("objectsChanged");
        emit("tagsChanged");
        emit("notesChanged");
        emit("relationsChanged");
        return snapshot;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete objects";
        set({ error: message });
        throw err;
      }
    },

    restoreObjects: async (snapshot) => {
      try {
        await storage.restoreObjects(snapshot);
        await get().load();
        emit("objectsChanged");
        emit("tagsChanged");
        emit("notesChanged");
        emit("relationsChanged");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to restore objects";
        set({ error: message });
        throw err;
      }
    },

    getById: (id) => get().objects.find((o) => o.id === id),

    getByType: (type) =>
      get()
        .objects.filter((o) => o.type === type)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ),
  };
});

export { LIFE_OBJECT_TYPES };
