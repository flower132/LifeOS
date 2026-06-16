"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LifeObject } from "@/lib/types";
import { useTagStore } from "@/stores/tagStore";
import { ObjectTypeBadge } from "./ObjectTypeBadge";
import { TagBadge } from "../tag/TagBadge";

interface ObjectCardProps {
  object: LifeObject;
}

export function ObjectCard({ object }: ObjectCardProps) {
  const tags = useTagStore((state) => state.tags);
  const objectTags = useMemo(
    () =>
      object.tag_ids
        .map((id) => tags.find((t) => t.id === id))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
    [tags, object.tag_ids]
  );

  return (
    <Link
      href={`/objects/${object.id}`}
      className="group flex flex-col rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-800 dark:hover:border-indigo-900"
    >
      <div className="mb-2 flex items-center justify-between">
        <ObjectTypeBadge type={object.type} />
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">
        {object.name}
      </h3>
      {object.description ? (
        <p className="mb-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {object.description}
        </p>
      ) : (
        <div className="mb-3" />
      )}
      {objectTags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5">
          {objectTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </Link>
  );
}
