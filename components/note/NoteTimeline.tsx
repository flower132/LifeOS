import { Note } from "@/lib/types";
import { NoteCard } from "./NoteCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/lib/useTranslation";

interface NoteTimelineProps {
  notes: Note[];
}

export function NoteTimeline({ notes }: NoteTimelineProps) {
  const { t } = useTranslation();

  if (notes.length === 0) {
    return (
      <EmptyState description={t("notesTimelineEmpty")} />
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
