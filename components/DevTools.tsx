"use client";

import { useState } from "react";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useTagStore } from "@/stores/tagStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { storage, STORAGE_VERSION } from "@/lib/storage";
import { ENTITY_KEYS } from "@/lib/storage/localStorageAdapter";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function calculateStorageUsage(): number {
  if (typeof window === "undefined") return 0;
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith("lifeos_")) {
      total += (window.localStorage.getItem(key) || "").length * 2; // UTF-16
    }
  }
  return total;
}

export function DevTools() {
  const [open, setOpen] = useState(false);
  const objects = useObjectStore((state) => state.objects);
  const notes = useNoteStore((state) => state.notes);
  const relations = useRelationStore((state) => state.relations);
  const tags = useTagStore((state) => state.tags);
  const settingsLoaded = useSettingsStore((state) => state.loaded);

  if (process.env.NODE_ENV === "production") return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg hover:bg-slate-800"
      >
        DevTools
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[80vh] overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          LifeOS DevTools
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Close
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">
          <span className="text-slate-500">Objects</span>
          <span className="font-medium text-slate-900 dark:text-white">{objects.length}</span>
        </div>
        <div className="flex justify-between rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">
          <span className="text-slate-500">Notes</span>
          <span className="font-medium text-slate-900 dark:text-white">{notes.length}</span>
        </div>
        <div className="flex justify-between rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">
          <span className="text-slate-500">Relations</span>
          <span className="font-medium text-slate-900 dark:text-white">{relations.length}</span>
        </div>
        <div className="flex justify-between rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">
          <span className="text-slate-500">Tags</span>
          <span className="font-medium text-slate-900 dark:text-white">{tags.length}</span>
        </div>
        <div className="flex justify-between rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">
          <span className="text-slate-500">Storage usage</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatBytes(calculateStorageUsage())}</span>
        </div>
        <div className="flex justify-between rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">
          <span className="text-slate-500">Hydrated</span>
          <span className="font-medium text-slate-900 dark:text-white">{settingsLoaded ? "yes" : "no"}</span>
        </div>
        <div className="flex justify-between rounded bg-slate-50 px-2 py-1 dark:bg-slate-800">
          <span className="text-slate-500">Storage version</span>
          <span className="font-medium text-slate-900 dark:text-white">{STORAGE_VERSION}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={() => {
            const data = {
              objects: JSON.parse(localStorage.getItem("lifeos_objects") || "[]"),
              notes: JSON.parse(localStorage.getItem("lifeos_notes") || "[]"),
              relations: JSON.parse(localStorage.getItem("lifeos_relations") || "[]"),
              tags: JSON.parse(localStorage.getItem("lifeos_tags") || "[]"),
              settings: JSON.parse(localStorage.getItem("lifeos_settings") || "{}"),
              exportedAt: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lifeos-dev-export-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          Export data
        </button>
        <button
          type="button"
          onClick={async () => {
            if (confirm("Clear all localStorage data? This cannot be undone.")) {
              ENTITY_KEYS.forEach((key) => localStorage.removeItem(key));
              await storage.setStorageVersion(0);
              window.location.reload();
            }
          }}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Clear all data
        </button>
      </div>
    </div>
  );
}
