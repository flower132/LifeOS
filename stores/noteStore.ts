import { create } from "zustand";
import { Note } from "@/lib/types";
import { storage } from "@/lib/storage";
import { subscribe } from "./storeEvents";

interface NoteState {
  notes: Note[];
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => void;
  addNote: (note: Omit<Note, "id" | "created_at">) => Promise<Note>;
  removeNote: (id: string) => Promise<void>;
  getByObjectId: (objectId: string) => Note[];
  getRecent: (limit?: number) => Note[];
}

export const useNoteStore = create<NoteState>((set, get) => {
  if (typeof window !== "undefined") {
    subscribe("notesChanged", () => {
      void get().load();
    });
  }

  return {
    notes: [],
    loaded: false,
    _loading: false,
    error: null,

    load: async () => {
      set({ _loading: true, error: null });
      try {
        const notes = await storage.getNotes();
        set({ notes, loaded: true, _loading: false });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load notes";
        set({ error: message, loaded: true, _loading: false });
      }
    },
    hydrate: async () => get().load(),
    persist: () => undefined,

    addNote: async (note) => {
      try {
        const created = await storage.createNote(note);
        set((state) => ({ notes: [created, ...state.notes], error: null }));
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create note";
        set({ error: message });
        throw err;
      }
    },

    removeNote: async (id) => {
      try {
        await storage.deleteNote(id);
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          error: null,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete note";
        set({ error: message });
        throw err;
      }
    },

    getByObjectId: (objectId) =>
      get()
        .notes.filter((n) => n.object_id === objectId)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),

    getRecent: (limit = 10) =>
      get()
        .notes.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, limit),
  };
});
