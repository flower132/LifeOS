"use client";

import { useState } from "react";
import { RELATION_TYPES } from "@/lib/types";
import { useObjectStore, useRelationStore } from "@/stores";

interface RelationFormProps {
  sourceObjectId: string;
  onCreated?: () => void;
}

export function RelationForm({ sourceObjectId, onCreated }: RelationFormProps) {
  const { objects } = useObjectStore();
  const { addRelation, relations } = useRelationStore();
  const [targetObjectId, setTargetObjectId] = useState("");
  const [type, setType] = useState(RELATION_TYPES[0]);
  const [strength, setStrength] = useState(0.5);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetObjectId) return;

    setSubmitting(true);
    await addRelation({
      source_object_id: sourceObjectId,
      target_object_id: targetObjectId,
      type,
      strength,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
    setTargetObjectId("");
    setNote("");
    setStrength(0.5);
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">To Object</label>
          <select
            value={targetObjectId}
            onChange={(e) => setTargetObjectId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="" disabled>Select object...</option>
            {candidates.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.name} ({obj.type})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Relation Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {RELATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Strength: {Math.round(strength * 100)}%</label>
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
        <label className="text-xs font-medium text-slate-600">Note</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional context about the relationship"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !targetObjectId || candidates.length === 0}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add Relation"}
      </button>
    </form>
  );
}
