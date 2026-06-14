"use client";

import { useState } from "react";
import { TAG_COLORS } from "@/lib/types";
import { useTagStore } from "@/stores";
import { TagBadge } from "./TagBadge";

interface TagSelectProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagSelect({ selectedTagIds, onChange }: TagSelectProps) {
  const { tags, addTag } = useTagStore();
  const [newTagName, setNewTagName] = useState("");

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name) return;

    const existing = tags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        onChange([...selectedTagIds, existing.id]);
      }
    } else {
      const color = TAG_COLORS[tags.length % TAG_COLORS.length];
      const created = await addTag({ name, color });
      onChange([...selectedTagIds, created.id]);
    }
    setNewTagName("");
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleCreateTag} className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Add a tag..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={!newTagName.trim()}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-transparent bg-slate-100 hover:bg-slate-200"
              }`}
            >
              <TagBadge tag={tag} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
