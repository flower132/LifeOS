import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  IntelligenceCache,
  IntelligenceMeta,
  IntelligenceTodayStory,
  CompanionMeta,
  CompanionFeedback,
} from "@/lib/types";
import { storage } from "@/lib/storage";

export interface IntelligenceState {
  cache: IntelligenceCache;
  meta: IntelligenceMeta;
  companionMeta: CompanionMeta;
  hydrated: boolean;
  setCache: (cache: IntelligenceCache) => Promise<void>;
  setMeta: (meta: IntelligenceMeta) => void;
  setCompanionMeta: (meta: CompanionMeta) => Promise<void>;
  setTodayStories: (stories: IntelligenceTodayStory[]) => void;
  setTodayFocuses: (focuses: IntelligenceCache["todayFocuses"]) => Promise<void>;
  setReminders: (reminders: IntelligenceCache["reminders"]) => Promise<void>;
  setReflections: (reflections: IntelligenceCache["reflections"]) => Promise<void>;
  setDailyTimelines: (timelines: IntelligenceCache["dailyTimelines"]) => Promise<void>;
  setWeeklyReviews: (reviews: IntelligenceCache["weeklyReviews"]) => Promise<void>;
  setMonthlyStories: (stories: IntelligenceCache["monthlyStories"]) => Promise<void>;
  addFeedback: (feedback: CompanionFeedback) => Promise<void>;
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
  todayFocuses: [],
  reminders: [],
  reflections: [],
  dailyTimelines: [],
  weeklyReviews: [],
  monthlyStories: [],
  feedback: [],
};

const DEFAULT_COMPANION_META: CompanionMeta = {
  lastFocusDate: null,
  lastReminderDate: null,
  lastReflectionDate: null,
  lastWeeklyWeekKey: null,
  lastMonthlyMonthKey: null,
  consecutiveRejections: 0,
  lastAppearanceAt: null,
  appearanceCountToday: 0,
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
      companionMeta: DEFAULT_COMPANION_META,
      hydrated: false,

      setCache: async (cache) => {
        set({ cache });
        await storage.setIntelligenceCache(cache);
      },

      setMeta: (meta) => {
        set({ meta });
        void storage.setIntelligenceMeta(meta);
      },

      setCompanionMeta: async (meta) => {
        set({ companionMeta: meta });
        await storage.setCompanionMeta(meta);
      },

      setTodayStories: (todayStories) => {
        set((state) => ({ cache: { ...state.cache, todayStories } }));
      },

      setTodayFocuses: async (todayFocuses) => {
        const nextCache = { ...get().cache, todayFocuses };
        set({ cache: nextCache });
        await storage.setIntelligenceCache(nextCache);
      },

      setReminders: async (reminders) => {
        const nextCache = { ...get().cache, reminders };
        set({ cache: nextCache });
        await storage.setIntelligenceCache(nextCache);
      },

      setReflections: async (reflections) => {
        const nextCache = { ...get().cache, reflections };
        set({ cache: nextCache });
        await storage.setIntelligenceCache(nextCache);
      },

      setDailyTimelines: async (dailyTimelines) => {
        const nextCache = { ...get().cache, dailyTimelines };
        set({ cache: nextCache });
        await storage.setIntelligenceCache(nextCache);
      },

      setWeeklyReviews: async (weeklyReviews) => {
        const nextCache = { ...get().cache, weeklyReviews };
        set({ cache: nextCache });
        await storage.setIntelligenceCache(nextCache);
      },

      setMonthlyStories: async (monthlyStories) => {
        const nextCache = { ...get().cache, monthlyStories };
        set({ cache: nextCache });
        await storage.setIntelligenceCache(nextCache);
      },

      addFeedback: async (feedback) => {
        const nextCache = {
          ...get().cache,
          feedback: [feedback, ...get().cache.feedback],
        };
        set({ cache: nextCache });
        await storage.setIntelligenceCache(nextCache);
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
          const [cache, meta, companionMeta] = await Promise.all([
            storage.getIntelligenceCache(),
            storage.getIntelligenceMeta(),
            storage.getCompanionMeta(),
          ]);
          set({ cache, meta, companionMeta, hydrated: true });
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
