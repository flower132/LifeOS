"use client";

import { Trash2, CheckSquare, Square, Merge, Archive, Tag } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { cn } from "@/lib/utils";

interface ObjectSelectionToolbarProps {
  selectedCount: number;
  totalSelectableCount: number;
  onDelete: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMerge?: () => void;
  onArchive?: () => void;
  onChangeType?: () => void;
  isDeleting?: boolean;
}

export function ObjectSelectionToolbar({
  selectedCount,
  totalSelectableCount,
  onDelete,
  onSelectAll,
  onDeselectAll,
  onMerge,
  onArchive,
  onChangeType,
  isDeleting,
}: ObjectSelectionToolbarProps) {
  const { t } = useTranslation();
  const allSelected =
    totalSelectableCount > 0 && selectedCount === totalSelectableCount;

  return (
    <div className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 md:bottom-8">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-2 py-2 shadow-lg">
        <button
          type="button"
          onClick={onDelete}
          disabled={selectedCount === 0 || isDeleting}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
            selectedCount > 0
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? t("deleting") : t("deleteSelected")}
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          type="button"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          disabled={totalSelectableCount === 0}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4" />
              {t("deselectAll")}
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4" />
              {t("selectAll")}
            </>
          )}
        </button>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <button
          type="button"
          onClick={onMerge}
          disabled
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 transition-colors hover:bg-muted sm:flex"
          title={t("merge")}
        >
          <Merge className="h-4 w-4" />
          {t("merge")}
        </button>

        <button
          type="button"
          onClick={onArchive}
          disabled
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 transition-colors hover:bg-muted sm:flex"
          title={t("archive")}
        >
          <Archive className="h-4 w-4" />
          {t("archive")}
        </button>

        <button
          type="button"
          onClick={onChangeType}
          disabled
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 transition-colors hover:bg-muted sm:flex"
          title={t("changeType")}
        >
          <Tag className="h-4 w-4" />
          {t("changeType")}
        </button>
      </div>
    </div>
  );
}
