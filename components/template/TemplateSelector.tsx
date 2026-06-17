"use client";

import { useState, useMemo } from "react";
import { Template, TemplateCategory } from "@/lib/types";
import { useTemplateStore } from "@/stores/templateStore";
import { useTranslation } from "@/lib/useTranslation";
import { TemplateCard } from "./TemplateCard";
import { FileText } from "lucide-react";

type SelectorTab = "official" | "my" | "recent" | "blank";

interface TemplateSelectorProps {
  category: TemplateCategory;
  onSelect: (template: Template | null) => void;
}

export function TemplateSelector({ category, onSelect }: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SelectorTab>("official");
  const [search, setSearch] = useState("");
  const templates = useTemplateStore((s) => s.templates);
  const loaded = useTemplateStore((s) => s.loaded);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list: Template[] = [];

    switch (activeTab) {
      case "official":
        list = templates.filter(
          (t) => t.isDefault && (category === "custom" || t.category === category)
        );
        break;
      case "my":
        list = templates.filter(
          (t) =>
            !t.isDefault && (category === "custom" || t.category === category)
        );
        break;
      case "recent":
        list = templates
          .filter((t) => t.lastUsedAt)
          .sort(
            (a, b) =>
              new Date(b.lastUsedAt!).getTime() -
              new Date(a.lastUsedAt!).getTime()
          );
        break;
      case "blank":
        list = [];
        break;
    }

    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeTab, category, search, templates]);

  const tabs: { key: SelectorTab; label: string }[] = [
    { key: "official", label: t("officialTemplates") },
    { key: "my", label: t("myTemplates") },
    { key: "recent", label: t("recentTemplates") },
    { key: "blank", label: t("blankTemplate") },
  ];

  if (!loaded) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t("templateHelpText")}
      </p>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== "blank" && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchTemplates")}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      )}

      {activeTab === "blank" ? (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <FileText className="h-4 w-4" />
          {t("blankTemplate")}
        </button>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab === "official" && t("noDefaultTemplates")}
            {activeTab === "my" && t("noCustomTemplates")}
            {activeTab === "recent" && t("noRecentTemplates")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="text-left"
            >
              <TemplateCard
                template={template}
                showActions={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
