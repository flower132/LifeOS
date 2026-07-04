import { create } from "zustand";
import { ObjectDeletionSnapshot } from "@/lib/types";

const UNDO_WINDOW_MS = 5000;

interface ObjectDeletionUndoState {
  snapshot: ObjectDeletionSnapshot | null;
  count: number;
  timestamp: number | null;
  setDeletion: (snapshot: ObjectDeletionSnapshot) => void;
  clear: () => void;
}

export const useObjectDeletionUndoStore = create<ObjectDeletionUndoState>(
  (set) => ({
    snapshot: null,
    count: 0,
    timestamp: null,

    setDeletion: (snapshot) =>
      set({
        snapshot,
        count: snapshot.objects.length,
        timestamp: Date.now(),
      }),

    clear: () =>
      set({
        snapshot: null,
        count: 0,
        timestamp: null,
      }),
  })
);

export function isUndoAvailable(timestamp: number | null): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp < UNDO_WINDOW_MS;
}
