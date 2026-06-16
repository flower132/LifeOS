import { create } from "zustand";
import { Tag } from "@/lib/types";
import { storage } from "@/lib/storage";
import { emit, subscribe } from "./storeEvents";

interface TagState {
  tags: Tag[];
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => void;
  addTag: (tag: Omit<Tag, "id" | "createdAt" | "usageCount">) => Promise<Tag>;
  updateTag: (
    id: string,
    updates: Partial<Omit<Tag, "id" | "createdAt">>
  ) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  getById: (id: string) => Tag | undefined;
  getSortedByUsage: () => Tag[];
  searchTags: (query: string) => Tag[];
  incrementUsage: (tagId: string) => Promise<void>;
}

export const useTagStore = create<TagState>((set, get) => {
  if (typeof window !== "undefined") {
    subscribe("objectsChanged", () => {
      void get().load();
    });
  }

  return {
    tags: [],
    loaded: false,
    _loading: false,
    error: null,

    load: async () => {
      set({ _loading: true, error: null });
      try {
        const tags = await storage.getTags();
        set({ tags, loaded: true, _loading: false });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load tags";
        set({ error: message, loaded: true, _loading: false });
      }
    },
    hydrate: async () => get().load(),
    persist: () => undefined,

    addTag: async (tag) => {
      try {
        const created = await storage.createTag(tag);
        set((state) => ({ tags: [...state.tags, created], error: null }));
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create tag";
        set({ error: message });
        throw err;
      }
    },

    updateTag: async (id, updates) => {
      try {
        const updated = await storage.updateTag(id, updates);
        set((state) => ({
          tags: state.tags.map((t) => (t.id === id ? updated : t)),
          error: null,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update tag";
        set({ error: message });
        throw err;
      }
    },

    removeTag: async (id) => {
      try {
        await storage.deleteTag(id);
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          error: null,
        }));
        emit("objectsChanged");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete tag";
        set({ error: message });
        throw err;
      }
    },

    getById: (id) => get().tags.find((t) => t.id === id),

    getSortedByUsage: () =>
      get()
        .tags.slice()
        .sort(
          (a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name)
        ),

    searchTags: (query) => {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) return get().tags;
      return get().tags.filter((tag) =>
        tag.name.toLowerCase().includes(trimmed)
      );
    },

    incrementUsage: async (tagId) => {
      const tag = get().getById(tagId);
      if (!tag) return;
      try {
        await get().updateTag(tagId, { usageCount: tag.usageCount + 1 });
      } catch (err) {
        // Usage increment is best-effort; do not surface to UI.
        console.error("Failed to increment tag usage:", err);
      }
    },
  };
});
