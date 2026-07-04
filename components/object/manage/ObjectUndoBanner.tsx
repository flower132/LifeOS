"use client";

import { useEffect } from "react";
import {
  isUndoAvailable,
  useObjectDeletionUndoStore,
} from "@/stores/objectDeletionUndoStore";
import { useTranslation } from "@/lib/useTranslation";

interface ObjectUndoBannerProps {
  onUndo: () => void;
}

export function ObjectUndoBanner({ onUndo }: ObjectUndoBannerProps) {
  const { t } = useTranslation();
  const { count, timestamp, clear } = useObjectDeletionUndoStore();

  useEffect(() => {
    if (count === 0 || !timestamp) return;
    const remaining = Math.max(0, 5000 - (Date.now() - timestamp));
    const timer = setTimeout(() => {
      clear();
    }, remaining);
    return () => clearTimeout(timer);
  }, [count, timestamp, clear]);

  if (count === 0 || !timestamp) return null;

  const undoEnabled = isUndoAvailable(timestamp);

  const handleUndo = async () => {
    if (!undoEnabled) return;
    try {
      await onUndo();
      clear();
    } catch (err) {
      console.error("[ObjectUndoBanner] Undo failed:", err);
    }
  };

  return (
    <div className="animate-fade-in fixed bottom-[9.5rem] left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-24">
      <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-foreground shadow-sm">
        <span>{t("batchDeletedN", { count: String(count) })}</span>
        {undoEnabled ? (
          <button
            type="button"
            onClick={handleUndo}
            className="font-medium text-accent hover:underline"
          >
            {t("undo")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
