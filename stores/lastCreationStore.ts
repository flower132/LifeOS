import { create } from "zustand";

interface LastCreationState {
  createdIds: string[];
  count: number;
  timestamp: number | null;
  setLastCreation: (ids: string[]) => void;
  clear: () => void;
}

const UNDO_WINDOW_MS = 5000;

export const useLastCreationStore = create<LastCreationState>((set) => ({
  createdIds: [],
  count: 0,
  timestamp: null,

  setLastCreation: (ids) =>
    set({
      createdIds: ids,
      count: ids.length,
      timestamp: Date.now(),
    }),

  clear: () =>
    set({
      createdIds: [],
      count: 0,
      timestamp: null,
    }),
}));

export function isUndoAvailable(timestamp: number | null): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp < UNDO_WINDOW_MS;
}
