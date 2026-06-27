"use client";

import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { useState } from "react";
import { LIFE_OBJECT_TYPES, LifeObjectType } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { ObjectList } from "@/components/object/ObjectList";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

const filterTabs: ("all" | LifeObjectType)[] = [
  "all",
  ...LIFE_OBJECT_TYPES,
];

export default function ObjectsPage() {
  const { objects, loaded } = useObjectStore();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | LifeObjectType>("all");
  const [query, setQuery] = useState("");

  const tabLabels: Record<"all" | LifeObjectType, string> = {
    all: t("all"),
    person: t("people"),
    self: t("self"),
    event: t("events"),
    idea: t("ideas"),
    goal: t("goals"),
    project: t("projects"),
    knowledge: t("knowledge"),
  };

  const filtered = objects
    .filter((obj) => (filter === "all" ? true : obj.type === filter))
    .filter((obj) => obj.name.toLowerCase().includes(query.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("objectsTitle")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("objectsSubtitle")}
              </p>
            </div>
            <Link
              href="/create-object"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              <PlusCircle className="h-4 w-4" />
              {t("newObject")}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === tab
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchObjects")}
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {!loaded ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : (
          <ObjectList
            objects={filtered}
            emptyMessage={filter === "all" ? t("noObjectsFound") : `${t("noObjectsFound")}`}
          />
        )}
      </div>
    </div>
  );
}
