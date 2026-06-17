"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { TagSelect } from "../tag/TagSelect";
import { useTranslation } from "@/lib/useTranslation";

interface ObjectFormProps {
  initialDescription?: string;
  templateName?: string;
  type?: LifeObjectType;
  lockType?: boolean;
}

export function ObjectForm({
  initialDescription,
  templateName,
  type: initialType = "person",
  lockType = false,
}: ObjectFormProps) {
  const router = useRouter();
  const addObject = useObjectStore((s) => s.addObject);
  const { t } = useTranslation();
  const [type, setType] = useState<LifeObjectType>(initialType);
  const [name, setName] = useState("");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !submitting && name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      setError(t("objectNameRequired"));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const created = await addObject({
        type,
        name: trimmedName,
        description: trimmedDescription || undefined,
        tag_ids: tagIds,
      });
      router.push(`/objects/${created.id}`);
    } catch (err) {
      console.error("Failed to create object:", err);
      setError(err instanceof Error ? err.message : t("failedToCreateObject"));
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
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("type")}
        </label>
        <select
          name="type"
          value={type}
          disabled={lockType}
          onChange={(e) => setType(e.target.value as LifeObjectType)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
        >
          {LIFE_OBJECT_TYPES.map((typeOption) => (
            <option key={typeOption} value={typeOption}>
              {t(typeOption)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("name")}</label>
        <input
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("description")}
          </label>
          {templateName && (
            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
              {t("preFilledFromTemplate", { name: templateName })}
              <button
                type="button"
                onClick={() => setDescription("")}
                className="ml-1 rounded px-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                {t("clearTemplate")}
              </button>
            </span>
          )}
        </div>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          rows={8}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("tags")}</label>
        <TagSelect selectedTagIds={tagIds} onChange={setTagIds} />
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
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700"
        >
          {submitting ? t("creating") : t("createObjectTitle")}
        </button>
      </div>
    </form>
  );
}
