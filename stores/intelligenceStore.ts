import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  IntelligenceCache,
  IntelligenceMeta,
  IntelligenceTodayStory,
} from "@/lib/types";
import { storage } from "@/lib/storage";

export interface IntelligenceState {
  cache: IntelligenceCache;
  meta: IntelligenceMeta;
  hydrated: boolean;
  setCache: (cache: IntelligenceCache) => Promise<void>;
  setMeta: (meta: IntelligenceMeta) => void;
  setTodayStories: (stories: IntelligenceTodayStory[]) => void;
  dismissPattern: (id: string) => Promise<void>;
  feedbackPattern: (id: string, feedback: "agree" | "disagree") => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => void;
}

const DEFAULT_CACHE: IntelligenceCache = {
  chapters: [],
  patterns: [],
  relationshipPatterns: [],
  decisions: [],
  decisionPatterns: [],
  growthSnapshots: [],
  themeSnapshots: [],
  crossObjectInsights: [],
  reflectionQuestions: [],
  todayStories: [],
};

const DEFAULT_META: IntelligenceMeta = {
  lastFullAnalysisAt: null,
  lastIncrementalAnalysisAt: null,
  analysisVersion: "1.0.0",
  pendingUpdate: false,
};

export const useIntelligenceStore = create<IntelligenceState>()(
  persist(
    (set, get) => ({
      cache: DEFAULT_CACHE,
      meta: DEFAULT_META,
      hydrated: false,

      setCache: async (cache) => {
        set({ cache });
        await storage.setIntelligenceCache(cache);
      },

      setMeta: (meta) => {
        set({ meta });
        void storage.setIntelligenceMeta(meta);
      },

      setTodayStories: (todayStories) => {
        set((state) => ({ cache: { ...state.cache, todayStories } }));
      },

      dismissPattern: async (id) => {
        const next = get().cache.patterns.map((p) =>
          p.id === id ? { ...p, status: "dismissed" as const } : p
        );
        await get().setCache({ ...get().cache, patterns: next });
      },

      feedbackPattern: async (id, feedback) => {
        const next = get().cache.patterns.map((p) =>
          p.id === id ? { ...p, userFeedback: feedback } : p
        );
        await get().setCache({ ...get().cache, patterns: next });
      },

      hydrate: async () => {
        try {
          const [cache, meta] = await Promise.all([
            storage.getIntelligenceCache(),
            storage.getIntelligenceMeta(),
          ]);
          set({ cache, meta, hydrated: true });
        } catch (err) {
          console.error("[IntelligenceStore] Hydration failed:", err);
          set({ hydrated: true });
        }
      },

      persist: () => {
        // Storage writes happen inline; this is a no-op placeholder.
      },
    }),
    {
      name: "lifeos_intelligence_store",
      skipHydration: true,
    }
  )
);
