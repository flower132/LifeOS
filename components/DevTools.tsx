"use client";

import { useState } from "react";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useTagStore } from "@/stores/tagStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { storage, STORAGE_VERSION } from "@/lib/storage";
import { ENTITY_KEYS } from "@/lib/storage/localStorageAdapter";
import { useTranslation } from "@/lib/useTranslation";

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
  const { t } = useTranslation();
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
        className="fixed bottom-4 right-4 z-50 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground shadow-lg hover:bg-accent/90"
      >
        DevTools
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[80vh] overflow-auto rounded-xl border border-border bg-card p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-card-foreground">
          LifeOS DevTools
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("dev.close")}
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between rounded bg-muted px-2 py-1">
          <span className="text-muted-foreground">{t("dev.objects")}</span>
          <span className="font-medium text-foreground">{objects.length}</span>
        </div>
        <div className="flex justify-between rounded bg-muted px-2 py-1">
          <span className="text-muted-foreground">{t("dev.notes")}</span>
          <span className="font-medium text-foreground">{notes.length}</span>
        </div>
        <div className="flex justify-between rounded bg-muted px-2 py-1">
          <span className="text-muted-foreground">{t("dev.relations")}</span>
          <span className="font-medium text-foreground">{relations.length}</span>
        </div>
        <div className="flex justify-between rounded bg-muted px-2 py-1">
          <span className="text-muted-foreground">{t("dev.tags")}</span>
          <span className="font-medium text-foreground">{tags.length}</span>
        </div>
        <div className="flex justify-between rounded bg-muted px-2 py-1">
          <span className="text-muted-foreground">{t("dev.storageUsage")}</span>
          <span className="font-medium text-foreground">{formatBytes(calculateStorageUsage())}</span>
        </div>
        <div className="flex justify-between rounded bg-muted px-2 py-1">
          <span className="text-muted-foreground">{t("dev.hydrated")}</span>
          <span className="font-medium text-foreground">{settingsLoaded ? t("dev.yes") : t("dev.no")}</span>
        </div>
        <div className="flex justify-between rounded bg-muted px-2 py-1">
          <span className="text-muted-foreground">{t("dev.storageVersion")}</span>
          <span className="font-medium text-foreground">{STORAGE_VERSION}</span>
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
          className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90"
        >
          {t("dev.export")}
        </button>
        <button
          type="button"
          onClick={async () => {
            if (confirm(t("dev.clearConfirm"))) {
              ENTITY_KEYS.forEach((key) => localStorage.removeItem(key));
              await storage.setStorageVersion(0);
              window.location.reload();
            }
          }}
          className="w-full rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/20"
        >
          {t("dev.clear")}
        </button>
      </div>
    </div>
  );
}
