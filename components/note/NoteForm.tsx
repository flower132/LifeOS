"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNoteStore } from "@/stores/noteStore";
import { useObjectStore } from "@/stores/objectStore";
import { useTranslation } from "@/lib/useTranslation";

interface NoteFormProps {
  initialObjectId?: string;
}

export function NoteForm({ initialObjectId }: NoteFormProps) {
  const router = useRouter();
  const objects = useObjectStore((s) => s.objects);
  const objectsLoaded = useObjectStore((s) => s.loaded);
  const objectsLoading = useObjectStore((s) => s._loading);
  const loadObjects = useObjectStore((s) => s.load);
  const addNote = useNoteStore((s) => s.addNote);
  const { t } = useTranslation();
  const [objectId, setObjectId] = useState(initialObjectId || "");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!objectsLoaded && !objectsLoading) {
      void loadObjects();
    }
  }, [objectsLoaded, objectsLoading, loadObjects]);

  const sortedObjects = useMemo(
    () => objects.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [objects]
  );

  const canSubmit =
    objectsLoaded &&
    sortedObjects.length > 0 &&
    !submitting &&
    objectId.trim().length > 0 &&
    content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const selectedObjectId = objectId.trim();
    const noteContent = content.trim();
    if (
      !selectedObjectId ||
      !objects.some((object) => object.id === selectedObjectId)
    ) {
      setError(t("pleaseSelectObject"));
      return;
    }
    if (!noteContent) {
      setError(t("noteContentRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await addNote({
        object_id: selectedObjectId,
        content: noteContent,
      });
      router.push(`/objects/${created.object_id}`);
    } catch (err) {
      console.error("Failed to create note:", err);
      setError(err instanceof Error ? err.message : t("failedToCreateNote"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("linkToObject")}</label>
        <select
          value={objectId}
          name="object_id"
          onChange={(e) => setObjectId(e.target.value)}
          disabled={!objectsLoaded || sortedObjects.length === 0}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="" disabled>
            {!objectsLoaded ? t("loading") : t("selectObject")}
          </option>
          {sortedObjects.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.name} ({t(obj.type)})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("content")}</label>
        <textarea
          value={content}
          name="content"
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
          rows={8}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("saving") : t("saveNote")}
        </button>
      </div>
    </form>
  );
}
