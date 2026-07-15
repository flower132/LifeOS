"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNoteStore } from "@/stores/noteStore";
import { useObjectStore } from "@/stores/objectStore";
import { PenLine } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { triggerBackgroundObjectUpdate } from "@/lib/ai/objectIntelligence/update";
import { intelligenceScheduler } from "@/lib/intelligence";

export function QuickCapture() {
  const router = useRouter();
  const objects = useObjectStore((s) => s.objects);
  const addNote = useNoteStore((s) => s.addNote);
  const { t } = useTranslation();
  const [objectId, setObjectId] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sortedObjects = objects.slice().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectId || !content.trim()) return;

    setSubmitting(true);
    try {
      const created = await addNote({
        object_id: objectId,
        content: content.trim(),
        sourceType: "text",
        attachments: [],
      });
      setContent("");
      setObjectId("");

      const targetObject = objects.find((o) => o.id === objectId);
      if (targetObject?.type === "self") {
        void triggerBackgroundObjectUpdate(targetObject, created);
      }

      intelligenceScheduler.markPending();
      intelligenceScheduler.scheduleIncremental(created.id);

      router.push(`/objects/${created.object_id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <PenLine className="h-4 w-4" />
          <span className="text-sm font-medium">{t("quickCaptureTitle")}</span>
        </div>

        <select
          value={objectId}
          onChange={(e) => setObjectId(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        >
          <option value="" disabled>{t("linkToObject")}</option>
          {sortedObjects.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.name} ({t(obj.type)})
            </option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("noteContentPlaceholder")}
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !objectId || !content.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting ? t("saving") : t("saveNote")}
          </button>
        </div>
      </form>
    </div>
  );
}
