import { Note } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const { t } = useTranslation();
  const sourceLabel = note.sourceType
    ? t(`noteSource${note.sourceType.charAt(0).toUpperCase() + note.sourceType.slice(1)}`)
    : t("noteSourceText");

  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span>{formatDateTime(note.created_at)}</span>
        {note.sourceType && note.sourceType !== "text" && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">
            {sourceLabel}
          </span>
        )}
      </div>
      <div className="note-content whitespace-pre-wrap text-sm text-foreground">
        {note.content}
      </div>
      {note.attachments && note.attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {note.attachments.map((attachment, index) => (
            <div
              key={`${attachment.mimeType}-${index}`}
              className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${attachment.mimeType};base64,${attachment.base64Data}`}
                alt={t("aiImagePreview")}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
