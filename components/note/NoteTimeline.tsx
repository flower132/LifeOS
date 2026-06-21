import { Note } from "@/lib/types";
import { NoteCard } from "./NoteCard";

interface NoteTimelineProps {
  notes: Note[];
}

export function NoteTimeline({ notes }: NoteTimelineProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center">
        <p className="text-sm text-muted-foreground">No notes yet. Add one to build this object&apos;s timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
