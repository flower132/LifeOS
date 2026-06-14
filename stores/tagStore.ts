import { create } from "zustand";
import { Tag } from "@/lib/types";
import { storage } from "@/lib/storage";

interface TagState {
  tags: Tag[];
  loaded: boolean;
  load: () => Promise<void>;
  addTag: (tag: Omit<Tag, "id">) => Promise<Tag>;
  removeTag: (id: string) => Promise<void>;
  getById: (id: string) => Tag | undefined;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  loaded: false,

  load: async () => {
    const tags = await storage.getTags();
    set({ tags, loaded: true });
  },

  addTag: async (tag) => {
    const created = await storage.createTag(tag);
    set((state) => ({ tags: [...state.tags, created] }));
    return created;
  },

  removeTag: async (id) => {
    await storage.deleteTag(id);
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    }));
  },

  getById: (id) => get().tags.find((t) => t.id === id),
}));
