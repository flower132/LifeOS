"use client";

import { useEffect } from "react";
import {
  isUndoAvailable,
  useLastCreationStore,
} from "@/stores/lastCreationStore";
import { useObjectStore } from "@/stores/objectStore";
import { useTranslation } from "@/lib/useTranslation";

interface CreationSuccessBannerProps {
  onUndo?: () => void;
}

export function CreationSuccessBanner({ onUndo }: CreationSuccessBannerProps) {
  const { t } = useTranslation();
  const removeObject = useObjectStore((s) => s.removeObject);
  const { createdIds, count, timestamp, clear } = useLastCreationStore();

  useEffect(() => {
    if (count > 0 && timestamp) {
      const timer = setTimeout(() => {
        clear();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [count, timestamp, clear]);

  if (count === 0 || !timestamp) return null;

  const undoEnabled = isUndoAvailable(timestamp);

  const handleUndo = async () => {
    if (!undoEnabled) return;
    try {
      await Promise.all(createdIds.map((id) => removeObject(id)));
      clear();
      onUndo?.();
    } catch (err) {
      console.error("[CreationSuccessBanner] Undo failed:", err);
    }
  };

  return (
    <div className="animate-fade-in rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-foreground">
      <div className="flex items-center justify-between">
        <span>{t("createSpaceCreatedN", { count: String(count) })}</span>
        {undoEnabled ? (
          <button
            type="button"
            onClick={handleUndo}
            className="font-medium text-accent hover:underline"
          >
            {t("createSpaceUndo")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
