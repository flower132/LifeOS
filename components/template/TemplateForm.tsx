"use client";

import { useState } from "react";
import { Template, TemplateCategory, TEMPLATE_CATEGORIES } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

interface TemplateFormProps {
  initial?: Template;
  onSave: (
    template: Omit<
      Template,
      "id" | "createdAt" | "updatedAt" | "usageCount"
    >
  ) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function TemplateForm({
  initial,
  onSave,
  onCancel,
  saving = false,
}: TemplateFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<TemplateCategory>(
    initial?.category ?? "custom"
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("objectNameRequired"));
      return;
    }
    setError(null);
    onSave({
      name: trimmedName,
      category,
      isDefault: false,
      content: content.trim(),
      templateVersion: 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("templateName")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("templateCategory")}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TemplateCategory)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        >
          {TEMPLATE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t(`templateCategory_${cat}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("templateContent")}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
          rows={10}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t("saving") : t("saveTemplate")}
        </button>
      </div>
    </form>
  );
}
