import { create } from "zustand";
import { Relation } from "@/lib/types";
import { storage } from "@/lib/storage";
import { subscribe } from "./storeEvents";

interface RelationState {
  relations: Relation[];
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => void;
  addRelation: (
    relation: Omit<Relation, "id" | "created_at">
  ) => Promise<Relation>;
  removeRelation: (id: string) => Promise<void>;
  getByObjectId: (objectId: string) => Relation[];
}

export const useRelationStore = create<RelationState>((set, get) => {
  if (typeof window !== "undefined") {
    subscribe("relationsChanged", () => {
      void get().load();
    });
  }

  return {
    relations: [],
    loaded: false,
    _loading: false,
    error: null,

    load: async () => {
      set({ _loading: true, error: null });
      try {
        const relations = await storage.getRelations();
        set({ relations, loaded: true, _loading: false });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load relations";
        set({ error: message, loaded: true, _loading: false });
      }
    },
    hydrate: async () => get().load(),
    persist: () => undefined,

    addRelation: async (relation) => {
      try {
        const created = await storage.createRelation(relation);
        set((state) => ({
          relations: [created, ...state.relations],
          error: null,
        }));
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create relation";
        set({ error: message });
        throw err;
      }
    },

    removeRelation: async (id) => {
      try {
        await storage.deleteRelation(id);
        set((state) => ({
          relations: state.relations.filter((r) => r.id !== id),
          error: null,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete relation";
        set({ error: message });
        throw err;
      }
    },

    getByObjectId: (objectId) =>
      get()
        .relations.filter(
          (r) =>
            r.source_object_id === objectId || r.target_object_id === objectId
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
  };
});
