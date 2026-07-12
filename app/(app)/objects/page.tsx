"use client";

import Link from "next/link";
import { Search, PlusCircle, ArrowUpDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { LIFE_OBJECT_TYPES, LifeObjectType } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import {
  useObjectDeletionUndoStore,
  isUndoAvailable,
} from "@/stores/objectDeletionUndoStore";
import { ObjectList } from "@/components/object/ObjectList";
import { ObjectManageMode } from "@/components/object/manage/ObjectManageMode";
import { ObjectSelectionToolbar } from "@/components/object/manage/ObjectSelectionToolbar";
import { ObjectDeleteDialog } from "@/components/object/manage/ObjectDeleteDialog";
import { ObjectUndoBanner } from "@/components/object/manage/ObjectUndoBanner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";
import { SkeletonBlock } from "@/components/ui/Skeleton";

const filterTabs: ("all" | LifeObjectType)[] = ["all", ...LIFE_OBJECT_TYPES];

type SortBy = "updated" | "created" | "name" | "type";

const SORT_OPTIONS: SortBy[] = ["updated", "created", "name", "type"];

import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";

export default function ObjectsPage() {
  const { objects, loaded } = useObjectStore();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | LifeObjectType>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [isManaging, setIsManaging] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { snapshot, timestamp, setDeletion, clear } =
    useObjectDeletionUndoStore();
  const removeObjects = useObjectStore((s) => s.removeObjects);
  const restoreObjects = useObjectStore((s) => s.restoreObjects);

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

  const sortLabels: Record<SortBy, string> = {
    updated: t("sortRecentlyUpdated"),
    created: t("sortCreatedAt"),
    name: t("sortName"),
    type: t("sortType"),
  };

  const lockedIds = useMemo(
    () => new Set(objects.filter((o) => o.type === "self").map((o) => o.id)),
    [objects]
  );

  const filtered = useMemo(() => {
    const queryLower = query.toLowerCase();
    return objects
      .filter((obj) => (filter === "all" ? true : obj.type === filter))
      .filter((obj) => obj.name.toLowerCase().includes(queryLower));
  }, [objects, filter, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case "updated":
        return list.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      case "created":
        return list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "name":
        return list.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
      case "type":
        return list.sort(
          (a, b) =>
            a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
        );
      default:
        return list;
    }
  }, [filtered, sortBy]);

  const handleEnterManage = () => {
    setIsManaging(true);
    clear();
  };

  const handleExitManage = () => {
    setIsManaging(false);
  };

  const handleDelete = async (selectedIds: Set<string>) => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIds).filter((id) => !lockedIds.has(id));
      const snapshot = await removeObjects(ids);
      setDeletion(snapshot);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("[ObjectsPage] Batch delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndo = async () => {
    if (!snapshot || !timestamp || !isUndoAvailable(timestamp)) return;
    try {
      await restoreObjects(snapshot);
      clear();
    } catch (err) {
      console.error("[ObjectsPage] Undo failed:", err);
    }
  };

  return (
    <WorkspaceLayout
      showBackButton={false}
      title={t("objectsTitle")}
      subtitle={t("objectsSubtitle")}
      actions={
        isManaging ? (
          <button
            type="button"
            onClick={handleExitManage}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
            {t("cancel")}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnterManage}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t("manage")}
            </button>
            <Link
              href="/create-object"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              <PlusCircle className="h-4 w-4" />
              {t("newObject")}
            </Link>
          </div>
        )
      }
      maxWidth="5xl"
      className="pb-32"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                disabled={isManaging}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === tab
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted",
                  isManaging && "cursor-not-allowed opacity-50"
                )}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
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

            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="appearance-none rounded-lg border border-input bg-background py-2 pl-9 pr-8 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {sortLabels[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!loaded ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <ObjectManageMode objects={sorted} lockedIds={lockedIds}>
            {({
              selectedIds,
              toggle,
              shiftSelect,
              selectAll,
              deselectAll,
              selectedCount,
            }) => {
              const totalSelectable = sorted.filter(
                (o) => !lockedIds.has(o.id)
              ).length;

              return (
                <>
                  {isManaging && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("selectedNObjects", { count: String(selectedCount) })}
                      </span>
                    </div>
                  )}

                  <ObjectList
                    objects={sorted}
                    emptyMessage={
                      filter === "all"
                        ? t("noObjectsFound")
                        : t("noObjectsFound")
                    }
                    emptyAction={
                      <Link
                        href="/create-object"
                        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-3 text-button font-medium text-accent-foreground transition-colors duration-fast ease-out hover:bg-accent/90"
                      >
                        <PlusCircle className="h-4 w-4" />
                        {t("newObject")}
                      </Link>
                    }
                    mode={isManaging ? "manage" : "view"}
                    selectedIds={selectedIds}
                    lockedIds={lockedIds}
                    onToggleSelection={toggle}
                    onShiftSelect={shiftSelect}
                  />

                  {isManaging && (
                    <ObjectSelectionToolbar
                      selectedCount={selectedCount}
                      totalSelectableCount={totalSelectable}
                      onDelete={() => setShowDeleteDialog(true)}
                      onSelectAll={selectAll}
                      onDeselectAll={deselectAll}
                      isDeleting={isDeleting}
                    />
                  )}

                  <ObjectDeleteDialog
                    open={showDeleteDialog}
                    count={selectedCount}
                    onCancel={() => setShowDeleteDialog(false)}
                    onConfirm={() => handleDelete(selectedIds)}
                    isDeleting={isDeleting}
                  />
                </>
              );
            }}
          </ObjectManageMode>
        )}
      </div>

      <ObjectUndoBanner onUndo={handleUndo} />
    </WorkspaceLayout>
  );
}
