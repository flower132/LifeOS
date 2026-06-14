"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { useObjectStore } from "@/stores";
import { TagSelect } from "../tag/TagSelect";

export function ObjectForm() {
  const router = useRouter();
  const { addObject } = useObjectStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<LifeObjectType>("person");
  const [description, setDescription] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const created = await addObject({
      type,
      name: name.trim(),
      description: description.trim() || undefined,
      tag_ids: tagIds,
    });
    setSubmitting(false);
    router.push(`/objects/${created.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as LifeObjectType)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          {LIFE_OBJECT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alice, Buy a house, Product idea"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional context..."
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Tags</label>
        <TagSelect selectedTagIds={tagIds} onChange={setTagIds} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Object"}
        </button>
      </div>
    </form>
  );
}
