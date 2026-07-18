import { create } from "zustand";
import { storage } from "@/lib/storage";
import { StoredObjectProfile } from "@/lib/object-intelligence/types";

interface ObjectIntelligenceState {
  /** Keyed by objectId — one profile per object. */
  profiles: Record<string, StoredObjectProfile>;
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  upsertLocal: (profile: StoredObjectProfile) => void;
  removeByObjectId: (objectId: string) => void;
  getByObjectId: (objectId: string) => StoredObjectProfile | undefined;
}

export const useObjectIntelligenceStore = create<ObjectIntelligenceState>((set, get) => ({
  profiles: {},
  loaded: false,
  _loading: false,
  error: null,

  load: async () => {
    set({ _loading: true, error: null });
    try {
      const list = await storage.getObjectProfiles();
      const profiles: Record<string, StoredObjectProfile> = {};
      // One record per object — newest wins.
      for (const profile of list) {
        const existing = profiles[profile.objectId];
        if (!existing || existing.updatedAt < profile.updatedAt) {
          profiles[profile.objectId] = profile;
        }
      }
      set({ profiles, loaded: true, _loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load object profiles";
      set({ error: message, loaded: true, _loading: false });
    }
  },
  hydrate: async () => get().load(),

  upsertLocal: (profile) => {
    set((state) => ({
      profiles: { ...state.profiles, [profile.objectId]: profile },
    }));
  },

  removeByObjectId: (objectId) => {
    set((state) => {
      const next = { ...state.profiles };
      delete next[objectId];
      return { profiles: next };
    });
  },

  getByObjectId: (objectId) => get().profiles[objectId],
}));
