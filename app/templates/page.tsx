"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PlusCircle,
  Search,
  X,
  LayoutTemplate,
} from "lucide-react";
import { useTemplateStore } from "@/stores/templateStore";
import { useTranslation } from "@/lib/useTranslation";
import { Template, TemplateCategory, TEMPLATE_CATEGORIES } from "@/lib/types";
import { storage } from "@/lib/storage";
import { TemplateList } from "@/components/template/TemplateList";
import { TemplateForm } from "@/components/template/TemplateForm";

export default function TemplatesPage() {
  const { t } = useTranslation();
  const templates = useTemplateStore((s) => s.templates);
  const loaded = useTemplateStore((s) => s.loaded);
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const updateTemplate = useTemplateStore((s) => s.updateTemplate);
  const removeTemplate = useTemplateStore((s) => s.removeTemplate);
  const duplicateTemplate = useTemplateStore((s) => s.duplicateTemplate);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Replenish missing or outdated default templates when entering the library.
    void (async () => {
      await storage.ensureDefaultTemplates();
      await useTemplateStore.getState().load();
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesCategory =
        category === "all" || template.category === category;
      const matchesSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        template.content.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [templates, search, category]);

  const defaultTemplates = useMemo(
    () => filtered.filter((t) => t.isDefault),
    [filtered]
  );
  const myTemplates = useMemo(
    () => filtered.filter((t) => !t.isDefault),
    [filtered]
  );
  const recentTemplates = useMemo(
    () =>
      templates
        .filter((t) => t.lastUsedAt)
        .sort(
          (a, b) =>
            new Date(b.lastUsedAt!).getTime() -
            new Date(a.lastUsedAt!).getTime()
        )
        .slice(0, 5),
    [templates]
  );

  const handleSave = async (
    data: Omit<Template, "id" | "createdAt" | "updatedAt" | "usageCount"
  >) => {
    setSaving(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
      } else {
        await addTemplate(data);
      }
      setEditingTemplate(null);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save template:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!template.isDefault && confirm(t("confirmDeleteTemplate", { name: template.name }))) {
      await removeTemplate(template.id);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/home"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToHome")}
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <LayoutTemplate className="h-6 w-6 text-foreground" />
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {t("templatesTitle")}
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("templatesSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              <PlusCircle className="h-4 w-4" />
              {t("newTemplate")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchTemplates")}
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as TemplateCategory | "all")
            }
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          >
            <option value="all">{t("allCategories")}</option>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`templateCategory_${cat}`)}
              </option>
            ))}
          </select>
        </div>

        {recentTemplates.length > 0 && (
          <TemplateList
            title={t("recentTemplates")}
            templates={recentTemplates}
            emptyText={t("noRecentTemplates")}
            onEdit={setEditingTemplate}
            onDuplicate={(template) => void duplicateTemplate(template.id)}
            onDelete={handleDelete}
            onUse={(template) => {
              // Use is only meaningful in create-object flow; here it navigates there.
              window.location.href = `/create-object?type=${template.category}&template=${template.id}`;
            }}
          />
        )}

        <TemplateList
          title={t("defaultTemplates")}
          templates={defaultTemplates}
          emptyText={t("noDefaultTemplates")}
          onDuplicate={(template) => void duplicateTemplate(template.id)}
        />

        <TemplateList
          title={t("myTemplates")}
          templates={myTemplates}
          emptyText={t("noCustomTemplates")}
          onEdit={(template) => {
            setEditingTemplate(template);
            setShowForm(true);
          }}
          onDuplicate={(template) => void duplicateTemplate(template.id)}
          onDelete={handleDelete}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">
                {editingTemplate ? t("editTemplate") : t("newTemplate")}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                }}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <TemplateForm
              initial={editingTemplate ?? undefined}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingTemplate(null);
              }}
              saving={saving}
            />
          </div>
        </div>
      )}
    </div>
  );
}
