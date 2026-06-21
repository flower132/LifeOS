import { Note } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {formatDateTime(note.created_at)}
      </div>
      <div className="note-content whitespace-pre-wrap text-sm text-foreground">
        {note.content}
      </div>
    </div>
  );
}
