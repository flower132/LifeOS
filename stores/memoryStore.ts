import { create } from "zustand";
import { storage } from "@/lib/storage";
import { Memory } from "@/lib/memory/types";

interface MemoryState {
  memories: Memory[];
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  /** Insert or replace one record in local state (persistence via storage). */
  upsertLocal: (memory: Memory) => void;
  removeLocal: (id: string) => void;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  loaded: false,
  _loading: false,
  error: null,

  load: async () => {
    set({ _loading: true, error: null });
    try {
      const memories = await storage.getMemories();
      set({ memories, loaded: true, _loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load memories";
      set({ error: message, loaded: true, _loading: false });
    }
  },
  hydrate: async () => get().load(),

  upsertLocal: (memory) => {
    set((state) => {
      const exists = state.memories.some((m) => m.id === memory.id);
      return {
        memories: exists
          ? state.memories.map((m) => (m.id === memory.id ? memory : m))
          : [memory, ...state.memories],
      };
    });
  },

  removeLocal: (id) => {
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== id),
    }));
  },
}));
