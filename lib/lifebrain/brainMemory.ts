import { create } from "zustand";
import { memoryService } from "@/lib/memory/memoryService";
import { Memory } from "@/lib/memory/types";
import { SessionTurn, WorkingMemory } from "./brainTypes";

// ---------------------------------------------------------------------------
// Brain Memory — three tiers under one manager:
//
//   Working Memory  — built per answer (scratchpad: intent, entities, steps)
//   Short Memory    — the current session's conversation turns
//   Long Memory     — the Memory & Knowledge Layer (Brain only READS it)
//
// Session state is in-memory (not synced); long-term persistence stays in
// the Knowledge Graph / Memory layer, never duplicated here.
// ---------------------------------------------------------------------------

const MAX_SHORT_TURNS = 20;
const MAX_WORKING = 10;

interface BrainMemoryState {
  shortMemory: SessionTurn[];
  workingMemory: WorkingMemory[];
  currentWorking: WorkingMemory | null;
  pushTurn: (turn: Omit<SessionTurn, "id" | "createdAt">) => SessionTurn;
  beginWorking: (wm: Omit<WorkingMemory, "id" | "createdAt">) => WorkingMemory;
  clearSession: () => void;
}

function makeId(): string {
  return `bm:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export const useBrainMemoryStore = create<BrainMemoryState>((set) => ({
  shortMemory: [],
  workingMemory: [],
  currentWorking: null,

  pushTurn: (turn) => {
    const full: SessionTurn = { ...turn, id: makeId(), createdAt: Date.now() };
    set((state) => ({
      shortMemory: [...state.shortMemory, full].slice(-MAX_SHORT_TURNS),
    }));
    return full;
  },

  beginWorking: (wm) => {
    const full: WorkingMemory = { ...wm, id: makeId(), createdAt: Date.now() };
    set((state) => ({
      currentWorking: full,
      workingMemory: [...state.workingMemory, full].slice(-MAX_WORKING),
    }));
    return full;
  },

  clearSession: () => {
    set({ shortMemory: [], workingMemory: [], currentWorking: null });
  },
}));

// ── Long Memory accessors (delegation — Brain never owns long-term data) ───

export function getLongTermMemories(
  signals: { objectId?: string; objectName?: string; query?: string },
  limit = 10
): Memory[] {
  return memoryService.getRelevantMemoriesSync(signals, limit);
}

export function getShortMemoryText(limit = 6): string {
  return useBrainMemoryStore
    .getState()
    .shortMemory.slice(-limit)
    .map((t) => `${t.role === "user" ? "用户" : "助手"}：${t.content.slice(0, 120)}`)
    .join("\n");
}
