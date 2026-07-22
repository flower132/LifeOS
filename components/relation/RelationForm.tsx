"use client";

import { useMemo, useState } from "react";
import { RELATION_TYPES } from "@/lib/types";
import { useRelationStore } from "@/stores/relationStore";
import { useTranslation } from "@/lib/useTranslation";
import { ErrorState } from "@/components/ui/ErrorState";
import { ObjectPickerField } from "@/components/object/ObjectPicker";

interface RelationFormProps {
  sourceObjectId: string;
  onCreated?: () => void;
}

export function RelationForm({ sourceObjectId, onCreated }: RelationFormProps) {
  const addRelation = useRelationStore((s) => s.addRelation);
  const relations = useRelationStore((s) => s.relations);
  const { t } = useTranslation();
  const [targetObjectId, setTargetObjectId] = useState("");
  const [type, setType] = useState(RELATION_TYPES[0]);
  const [strength, setStrength] = useState(0.5);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 不可选：自身 + 已有关系的对象（交给 ObjectPicker 统一排除）
  const excludeIds = useMemo(
    () => [
      sourceObjectId,
      ...relations
        .filter(
          (r) =>
            r.source_object_id === sourceObjectId ||
            r.target_object_id === sourceObjectId
        )
        .map((r) =>
          r.source_object_id === sourceObjectId
            ? r.target_object_id
            : r.source_object_id
        ),
    ],
    [relations, sourceObjectId]
  );

  const canSubmit = targetObjectId.length > 0 && !submitting;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSubmitting(true);
    try {
      await addRelation({
        source_object_id: sourceObjectId,
        target_object_id: targetObjectId,
        type,
        strength,
        note: note.trim() || undefined,
        createdBy: "user",
      });
      setTargetObjectId("");
      setNote("");
      setStrength(0.5);
      onCreated?.();
    } catch (err) {
      console.error("Failed to create relation:", err);
      setError(err instanceof Error ? err.message : t("failedToCreateRelation"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-muted p-4">
      {error && (
        <ErrorState description={error} onRetry={handleSubmit} />
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">{t("toObject")}</label>
          <ObjectPickerField
            value={targetObjectId || null}
            onChange={(id) => setTargetObjectId(id)}
            placeholder={t("selectObject")}
            excludeIds={excludeIds}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">{t("relationType")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          >
            {RELATION_TYPES.map((relationType) => (
              <option key={relationType} value={relationType}>
                {t(relationType)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">{t("strength")}: {Math.round(strength * 100)}%</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">{t("content")}</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("relationNotePlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? t("adding") : t("addRelation")}
      </button>
    </form>
  );
}
