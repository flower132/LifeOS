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
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
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
                ? "bg-accent/10 text-accent"
                : "bg-muted text-muted-foreground hover:bg-accent/5 hover:text-foreground"
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
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      )}

      {activeTab === "blank" ? (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted p-8 text-sm font-medium text-foreground hover:bg-accent/5"
        >
          <FileText className="h-4 w-4" />
          {t("blankTemplate")}
        </button>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center">
          <p className="text-sm text-muted-foreground">
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
