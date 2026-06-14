"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNoteStore, useObjectStore } from "@/stores";

interface NoteFormProps {
  initialObjectId?: string;
}

export function NoteForm({ initialObjectId }: NoteFormProps) {
  const router = useRouter();
  const { objects } = useObjectStore();
  const { addNote } = useNoteStore();
  const [objectId, setObjectId] = useState(initialObjectId || "");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectId || !content.trim()) return;

    setSubmitting(true);
    const created = await addNote({
      object_id: objectId,
      content: content.trim(),
    });
    setSubmitting(false);
    router.push(`/objects/${created.object_id}`);
  };

  const sortedObjects = objects.slice().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Link to Object</label>
        <select
          value={objectId}
          onChange={(e) => setObjectId(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="" disabled>Select an object...</option>
          {sortedObjects.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.name} ({obj.type})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write what happened, what you thought, or what you noticed..."
          rows={8}
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
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
          disabled={submitting || !objectId || !content.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Note"}
        </button>
      </div>
    </form>
  );
}
