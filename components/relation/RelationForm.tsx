"use client";

import { useState } from "react";
import { RELATION_TYPES } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { useRelationStore } from "@/stores/relationStore";
import { useTranslation } from "@/lib/useTranslation";

interface RelationFormProps {
  sourceObjectId: string;
  onCreated?: () => void;
}

export function RelationForm({ sourceObjectId, onCreated }: RelationFormProps) {
  const objects = useObjectStore((s) => s.objects);
  const addRelation = useRelationStore((s) => s.addRelation);
  const relations = useRelationStore((s) => s.relations);
  const { t } = useTranslation();
  const [targetObjectId, setTargetObjectId] = useState("");
  const [type, setType] = useState(RELATION_TYPES[0]);
  const [strength, setStrength] = useState(0.5);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = objects.filter(
    (o) =>
      o.id !== sourceObjectId &&
      !relations.some(
        (r) =>
          (r.source_object_id === sourceObjectId &&
            r.target_object_id === o.id) ||
          (r.target_object_id === sourceObjectId &&
            r.source_object_id === o.id)
      )
  );

  const canSubmit = targetObjectId.length > 0 && candidates.length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("toObject")}</label>
          <select
            value={targetObjectId}
            onChange={(e) => setTargetObjectId(e.target.value)}
            disabled={candidates.length === 0}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="" disabled>{t("selectObject")}</option>
            {candidates.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.name} ({t(obj.type)})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("relationType")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("strength")}: {Math.round(strength * 100)}%</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value))}
          className="w-full accent-indigo-600"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("content")}</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("relationNotePlaceholder")}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? t("adding") : t("addRelation")}
      </button>
    </form>
  );
}
