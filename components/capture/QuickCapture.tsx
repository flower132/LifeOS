"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNoteStore, useObjectStore } from "@/stores";
import { PenLine } from "lucide-react";

export function QuickCapture() {
  const router = useRouter();
  const { objects } = useObjectStore();
  const { addNote } = useNoteStore();
  const [objectId, setObjectId] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sortedObjects = objects.slice().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectId || !content.trim()) return;

    setSubmitting(true);
    const created = await addNote({
      object_id: objectId,
      content: content.trim(),
    });
    setSubmitting(false);
    setContent("");
    router.push(`/objects/${created.object_id}`);
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 text-slate-500">
          <PenLine className="h-4 w-4" />
          <span className="text-sm font-medium">Quick capture</span>
        </div>

        <select
          value={objectId}
          onChange={(e) => setObjectId(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="" disabled>Link to an object...</option>
          {sortedObjects.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.name} ({obj.type})
            </option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What happened? What are you thinking?"
          rows={3}
          required
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !objectId || !content.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Note"}
          </button>
        </div>
      </form>
    </div>
  );
}
