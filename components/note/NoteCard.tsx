import { Note } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-medium text-slate-400">
        {formatDateTime(note.created_at)}
      </div>
      <div className="note-content whitespace-pre-wrap text-sm text-slate-700">
        {note.content}
      </div>
    </div>
  );
}
