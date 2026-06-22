"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LifeObjectType,
  LIFE_OBJECT_TYPES,
  ObjectProperties,
} from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { TagSelect } from "../tag/TagSelect";
import { useTranslation } from "@/lib/useTranslation";
import { ObjectPropertyEditor } from "./ObjectPropertyEditor";

interface ObjectFormProps {
  initialDescription?: string;
  initialProperties?: ObjectProperties;
  templateName?: string;
  type?: LifeObjectType;
  lockType?: boolean;
}

export function ObjectForm({
  initialDescription,
  initialProperties,
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
  const [properties, setProperties] = useState<ObjectProperties>(
    initialProperties ?? {}
  );
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
        properties,
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
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("type")}
        </label>
        <select
          name="type"
          value={type}
          disabled={lockType}
          onChange={(e) => setType(e.target.value as LifeObjectType)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:bg-muted"
        >
          {LIFE_OBJECT_TYPES.map((typeOption) => (
            <option key={typeOption} value={typeOption}>
              {t(typeOption)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("name")}</label>
        <input
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {t("properties")}
          </label>
          {templateName && (
            <span className="inline-flex items-center gap-1 text-xs text-accent">
              {t("preFilledFromTemplate", { name: templateName })}
            </span>
          )}
        </div>
        <ObjectPropertyEditor
          type={type}
          properties={properties}
          onChange={setProperties}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("description")}
        </label>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          rows={8}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("tags")}</label>
        <TagSelect selectedTagIds={tagIds} onChange={setTagIds} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("creating") : t("createObjectTitle")}
        </button>
      </div>
    </form>
  );
}
