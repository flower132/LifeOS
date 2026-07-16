import { create } from "zustand";
import {
  Anniversary,
  DecisionMemory,
  Highlight,
  LifeChapter,
  MemoryMoment,
  MemoryRelationEdge,
} from "@/lib/types";
import { storage } from "@/lib/storage";

/**
 * LongTermMemoryStore — 长期记忆状态。
 *
 * Store 只负责状态持有与持久化转发，不包含业务逻辑。
 * 所有派生计算由 lib/services 下的引擎完成，
 * 通过 longTermMemoryService.refresh() 驱动。
 */

interface LongTermMemoryState {
  moments: MemoryMoment[];
  chapters: LifeChapter[];
  memoryRelations: MemoryRelationEdge[];
  anniversaries: Anniversary[];
  highlights: Highlight[];
  decisions: DecisionMemory[];
  loaded: boolean;
  _loading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  load: () => Promise<void>;
  persist: () => void;

  /** 由 longTermMemoryService 统一写入引擎输出 */
  setDerived: (data: {
    moments?: MemoryMoment[];
    chapters?: LifeChapter[];
    memoryRelations?: MemoryRelationEdge[];
    anniversaries?: Anniversary[];
    highlights?: Highlight[];
  }) => Promise<void>;

  /** Decision Memory 是用户可编辑的一手数据，提供 CRUD */
  addDecision: (
    decision: Omit<DecisionMemory, "id" | "createdAt" | "updatedAt">
  ) => Promise<DecisionMemory>;
  updateDecision: (
    id: string,
    updates: Partial<Omit<DecisionMemory, "id" | "createdAt">>
  ) => Promise<DecisionMemory>;
  removeDecision: (id: string) => Promise<void>;
}

export const useLongTermMemoryStore = create<LongTermMemoryState>((set, get) => ({
  moments: [],
  chapters: [],
  memoryRelations: [],
  anniversaries: [],
  highlights: [],
  decisions: [],
  loaded: false,
  _loading: false,
  error: null,

  load: async () => {
    set({ _loading: true, error: null });
    try {
      const [moments, chapters, memoryRelations, anniversaries, highlights, decisions] =
        await Promise.all([
          storage.getMoments(),
          storage.getChapters(),
          storage.getMemoryRelations(),
          storage.getAnniversaries(),
          storage.getHighlights(),
          storage.getDecisions(),
        ]);
      set({
        moments,
        chapters,
        memoryRelations,
        anniversaries,
        highlights,
        decisions,
        loaded: true,
        _loading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load long-term memory";
      set({ error: message, loaded: true, _loading: false });
    }
  },

  hydrate: async () => get().load(),
  persist: () => undefined,

  setDerived: async (data) => {
    const current = get();
    const next = {
      moments: data.moments ?? current.moments,
      chapters: data.chapters ?? current.chapters,
      memoryRelations: data.memoryRelations ?? current.memoryRelations,
      anniversaries: data.anniversaries ?? current.anniversaries,
      highlights: data.highlights ?? current.highlights,
    };
    set(next);
    // 持久化与同步由 storage 层（hybrid → sync）统一处理
    const writes: Promise<void>[] = [];
    if (data.moments) writes.push(storage.setMoments(data.moments));
    if (data.chapters) writes.push(storage.setChapters(data.chapters));
    if (data.memoryRelations) writes.push(storage.setMemoryRelations(data.memoryRelations));
    if (data.anniversaries) writes.push(storage.setAnniversaries(data.anniversaries));
    if (data.highlights) writes.push(storage.setHighlights(data.highlights));
    await Promise.all(writes);
  },

  addDecision: async (decision) => {
    const created = await storage.createDecision(decision);
    set((state) => ({ decisions: [created, ...state.decisions] }));
    return created;
  },

  updateDecision: async (id, updates) => {
    const updated = await storage.updateDecision(id, updates);
    set((state) => ({
      decisions: state.decisions.map((d) => (d.id === id ? updated : d)),
    }));
    return updated;
  },

  removeDecision: async (id) => {
    await storage.deleteDecision(id);
    set((state) => ({
      decisions: state.decisions.filter((d) => d.id !== id),
    }));
  },
}));
