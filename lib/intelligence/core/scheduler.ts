import { intelligenceService } from "./engine";
import { useIntelligenceStore } from "@/stores/intelligenceStore";

const FULL_ANALYSIS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const INCREMENTAL_DELAY_MS = 30 * 1000; // 30s

let incrementalTimer: ReturnType<typeof setTimeout> | null = null;
let fullTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleIdle(callback: () => void, delayMs: number): ReturnType<typeof setTimeout> {
  const run = () => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: delayMs });
    } else {
      callback();
    }
  };
  return setTimeout(run, delayMs);
}

export const intelligenceScheduler = {
  markPending(): void {
    const store = useIntelligenceStore.getState();
    store.setMeta({ ...store.meta, pendingUpdate: true });
  },

  scheduleIncremental(noteId?: string): void {
    if (incrementalTimer) {
      clearTimeout(incrementalTimer);
    }
    incrementalTimer = scheduleIdle(() => {
      void intelligenceService.runIncremental({ noteId });
    }, INCREMENTAL_DELAY_MS);
  },

  scheduleFull(): void {
    const store = useIntelligenceStore.getState();
    const lastFull = store.meta.lastFullAnalysisAt;
    if (lastFull && Date.now() - new Date(lastFull).getTime() < FULL_ANALYSIS_COOLDOWN_MS) {
      return;
    }
    if (fullTimer) {
      clearTimeout(fullTimer);
    }
    fullTimer = scheduleIdle(() => {
      void intelligenceService.runFull();
    }, FULL_ANALYSIS_COOLDOWN_MS);
  },

  async runIfDue(): Promise<void> {
    const store = useIntelligenceStore.getState();
    if (store.meta.pendingUpdate) {
      await intelligenceService.runIncremental();
      return;
    }
    const lastFull = store.meta.lastFullAnalysisAt;
    if (!lastFull || Date.now() - new Date(lastFull).getTime() >= FULL_ANALYSIS_COOLDOWN_MS) {
      await intelligenceService.runFull();
    }
  },
};
