import { create } from "zustand";
import { Relation } from "@/lib/types";
import { storage } from "@/lib/storage";

interface RelationState {
  relations: Relation[];
  loaded: boolean;
  load: () => Promise<void>;
  addRelation: (
    relation: Omit<Relation, "id" | "created_at">
  ) => Promise<Relation>;
  removeRelation: (id: string) => Promise<void>;
  getByObjectId: (objectId: string) => Relation[];
}

export const useRelationStore = create<RelationState>((set, get) => ({
  relations: [],
  loaded: false,

  load: async () => {
    const relations = await storage.getRelations();
    set({ relations, loaded: true });
  },

  addRelation: async (relation) => {
    const created = await storage.createRelation(relation);
    set((state) => ({ relations: [created, ...state.relations] }));
    return created;
  },

  removeRelation: async (id) => {
    await storage.deleteRelation(id);
    set((state) => ({
      relations: state.relations.filter((r) => r.id !== id),
    }));
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
}));
