"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNoteStore } from "@/stores/noteStore";
import { useObjectStore } from "@/stores/objectStore";
import { PenLine } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

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
      });
      setContent("");
      setObjectId("");
      router.push(`/objects/${created.object_id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <PenLine className="h-4 w-4" />
          <span className="text-sm font-medium">{t("quickCaptureTitle")}</span>
        </div>

        <select
          value={objectId}
          onChange={(e) => setObjectId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !objectId || !content.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700"
          >
            {submitting ? t("saving") : t("saveNote")}
          </button>
        </div>
      </form>
    </div>
  );
}
