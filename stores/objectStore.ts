import { create } from "zustand";
import { LifeObject, LIFE_OBJECT_TYPES } from "@/lib/types";
import { storage } from "@/lib/storage";

interface ObjectState {
  objects: LifeObject[];
  loaded: boolean;
  load: () => Promise<void>;
  addObject: (
    obj: Omit<LifeObject, "id" | "created_at" | "updated_at">
  ) => Promise<LifeObject>;
  updateObject: (
    id: string,
    updates: Partial<Omit<LifeObject, "id" | "created_at" | "updated_at">>
  ) => Promise<void>;
  removeObject: (id: string) => Promise<void>;
  getById: (id: string) => LifeObject | undefined;
  getByType: (type: LifeObject["type"]) => LifeObject[];
}

export const useObjectStore = create<ObjectState>((set, get) => ({
  objects: [],
  loaded: false,

  load: async () => {
    const objects = await storage.getObjects();
    set({ objects, loaded: true });
  },

  addObject: async (obj) => {
    const created = await storage.createObject(obj);
    set((state) => ({ objects: [created, ...state.objects] }));
    return created;
  },

  updateObject: async (id, updates) => {
    const updated = await storage.updateObject(id, updates);
    set((state) => ({
      objects: state.objects.map((o) => (o.id === id ? updated : o)),
    }));
  },

  removeObject: async (id) => {
    await storage.deleteObject(id);
    set((state) => ({
      objects: state.objects.filter((o) => o.id !== id),
    }));
  },

  getById: (id) => get().objects.find((o) => o.id === id),

  getByType: (type) =>
    get().objects.filter((o) => o.type === type).sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ),
}));

export { LIFE_OBJECT_TYPES };
