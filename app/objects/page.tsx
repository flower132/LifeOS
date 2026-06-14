"use client";

import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { useState } from "react";
import { LIFE_OBJECT_TYPES, LifeObjectType } from "@/lib/types";
import { useObjectStore } from "@/stores";
import { ObjectList } from "@/components/object/ObjectList";
import { cn } from "@/lib/utils";

const filterTabs: ("all" | LifeObjectType)[] = [
  "all",
  ...LIFE_OBJECT_TYPES,
];

const tabLabels: Record<"all" | LifeObjectType, string> = {
  all: "All",
  person: "People",
  self: "Self",
  event: "Events",
  idea: "Ideas",
  goal: "Goals",
};

export default function ObjectsPage() {
  const { objects, loaded } = useObjectStore();
  const [filter, setFilter] = useState<"all" | LifeObjectType>("all");
  const [query, setQuery] = useState("");

  const filtered = objects
    .filter((obj) => (filter === "all" ? true : obj.type === filter))
    .filter((obj) => obj.name.toLowerCase().includes(query.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Objects
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                People, events, goals, ideas — your life data.
              </p>
            </div>
            <Link
              href="/create-object"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlusCircle className="h-4 w-4" />
              New Object
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
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search objects..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-64"
            />
          </div>
        </div>

        {!loaded ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <ObjectList
            objects={filtered}
            emptyMessage={`No ${filter === "all" ? "" : tabLabels[filter].toLowerCase()} objects found.`}
          />
        )}
      </div>
    </div>
  );
}
