import { create } from "zustand";
import { Note } from "@/lib/types";
import { storage } from "@/lib/storage";

interface NoteState {
  notes: Note[];
  loaded: boolean;
  load: () => Promise<void>;
  addNote: (note: Omit<Note, "id" | "created_at">) => Promise<Note>;
  removeNote: (id: string) => Promise<void>;
  getByObjectId: (objectId: string) => Note[];
  getRecent: (limit?: number) => Note[];
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loaded: false,

  load: async () => {
    const notes = await storage.getNotes();
    set({ notes, loaded: true });
  },

  addNote: async (note) => {
    const created = await storage.createNote(note);
    set((state) => ({ notes: [created, ...state.notes] }));
    return created;
  },

  removeNote: async (id) => {
    await storage.deleteNote(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }));
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
      .notes
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit),
}));
