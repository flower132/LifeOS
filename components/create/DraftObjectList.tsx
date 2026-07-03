"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { CreationDraft, normalizeName } from "@/lib/create/draftUtils";
import { useTranslation } from "@/lib/useTranslation";
import { cn } from "@/lib/utils";

interface DraftObjectListProps {
  drafts: CreationDraft[];
  onChange: (drafts: CreationDraft[]) => void;
  disabled?: boolean;
  showTypeSelector?: boolean;
}

export function DraftObjectList({
  drafts,
  onChange,
  disabled = false,
  showTypeSelector = true,
}: DraftObjectListProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const selectedCount = drafts.filter((d) => d.selected).length;
  const allSelected = drafts.length > 0 && selectedCount === drafts.length;

  const updateDraft = (id: string, patch: Partial<CreationDraft>) => {
    onChange(drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const handleToggleAll = () => {
    const next = !allSelected;
    onChange(drafts.map((d) => ({ ...d, selected: next })));
  };

  const handleRemove = (id: string) => {
    onChange(drafts.filter((d) => d.id !== id));
  };

  const startEdit = (draft: CreationDraft) => {
    setEditingId(draft.id);
    setEditValue(draft.name);
  };

  const saveEdit = (id: string) => {
    const trimmed = normalizeName(editValue);
    if (trimmed) {
      updateDraft(id, { name: trimmed });
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggleAll}
          disabled={disabled || drafts.length === 0}
          className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {allSelected ? t("createSpaceDeselectAll") : t("createSpaceSelectAll")}
        </button>
        <span className="text-xs text-muted-foreground">
          {selectedCount} / {drafts.length}
        </span>
      </div>

      <div className="space-y-2">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className={cn(
              "group flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors",
              draft.selected ? "border-accent/30 bg-accent/[0.02]" : "border-border"
            )}
          >
            <input
              type="checkbox"
              checked={draft.selected}
              onChange={(e) => updateDraft(draft.id, { selected: e.target.checked })}
              disabled={disabled}
              className="mt-1 h-4 w-4 accent-accent"
            />

            <div className="min-w-0 flex-1 space-y-2">
              {editingId === draft.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(draft.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(draft.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-accent"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {draft.name}
                  </span>
                  {draft.duplicate && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {t("createSpaceDuplicateDetected")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(draft)}
                    disabled={disabled}
                    className="ml-auto shrink-0 rounded-lg p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100 disabled:opacity-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {draft.duplicate && editingId !== draft.id && (
                <DuplicateChoice draft={draft} onUpdate={(patch) => updateDraft(draft.id, patch)} />
              )}
            </div>

            {showTypeSelector ? (
              <select
                value={draft.type}
                onChange={(e) => updateDraft(draft.id, { type: e.target.value as LifeObjectType })}
                disabled={disabled}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent disabled:opacity-60"
              >
                {LIFE_OBJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(type)}
                  </option>
                ))}
              </select>
            ) : null}

            <button
              type="button"
              onClick={() => handleRemove(draft.id)}
              disabled={disabled}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DuplicateChoice({
  draft,
  onUpdate,
}: {
  draft: CreationDraft;
  onUpdate: (patch: Partial<CreationDraft>) => void;
}) {
  const { t } = useTranslation();
  const action = draft.duplicate?.action ?? "use-existing";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
      <label className="flex cursor-pointer items-center gap-1.5 text-muted-foreground">
        <input
          type="radio"
          name={`dup-${draft.id}`}
          checked={action === "use-existing"}
          onChange={() => onUpdate({ duplicate: { ...draft.duplicate!, action: "use-existing" } })}
          className="accent-accent"
        />
        {t("createSpaceUseExisting")}
      </label>
      <label className="flex cursor-pointer items-center gap-1.5 text-muted-foreground">
        <input
          type="radio"
          name={`dup-${draft.id}`}
          checked={action === "create"}
          onChange={() => onUpdate({ duplicate: { ...draft.duplicate!, action: "create" } })}
          className="accent-accent"
        />
        {t("createSpaceCreateNewAnyway")}
      </label>
    </div>
  );
}
