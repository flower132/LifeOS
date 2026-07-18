import { create } from "zustand";
import { storage } from "@/lib/storage";
import { RelationSuggestion } from "@/lib/graph/types";

/**
 * Pure helper — safe for useMemo. NEVER call this inside a useStore
 * selector: it filters (new array per call) and would break React 18's
 * getSnapshot referential-stability requirement (infinite render loop).
 */
export function getPendingSuggestionsForObject(
  suggestions: RelationSuggestion[],
  objectId: string
): RelationSuggestion[] {
  return suggestions.filter(
    (s) =>
      s.status === "pending" &&
      (s.fromObjectId === objectId || s.toObjectId === objectId)
  );
}

interface RelationSuggestionState {
  suggestions: RelationSuggestion[];
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  upsertLocal: (suggestion: RelationSuggestion) => void;
}

export const useRelationSuggestionStore = create<RelationSuggestionState>((set, get) => ({
  suggestions: [],
  loaded: false,
  _loading: false,
  error: null,

  load: async () => {
    set({ _loading: true, error: null });
    try {
      const suggestions = await storage.getRelationSuggestions();
      set({ suggestions, loaded: true, _loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load relation suggestions";
      set({ error: message, loaded: true, _loading: false });
    }
  },
  hydrate: async () => get().load(),

  upsertLocal: (suggestion) => {
    set((state) => {
      const exists = state.suggestions.some((s) => s.id === suggestion.id);
      return {
        suggestions: exists
          ? state.suggestions.map((s) => (s.id === suggestion.id ? suggestion : s))
          : [suggestion, ...state.suggestions],
      };
    });
  },
}));
