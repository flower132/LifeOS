"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/useTranslation";
import { cn } from "@/lib/utils";

interface ObjectDeleteDialogProps {
  open: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function ObjectDeleteDialog({
  open,
  count,
  onCancel,
  onConfirm,
  isDeleting,
}: ObjectDeleteDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden="true"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">
          {t("batchDeleteTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("batchDeleteConfirm", { count: String(count) })}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              isDeleting
                ? "bg-muted text-muted-foreground"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isDeleting ? t("deleting") : t("deleteSelected")}
          </button>
        </div>
      </div>
    </div>
  );
}
