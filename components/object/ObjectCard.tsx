"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LifeObject } from "@/lib/types";
import { useTagStore } from "@/stores/tagStore";
import { propertiesToPreview } from "@/lib/objectProperties";
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

  const preview = propertiesToPreview(object.type, object.properties) || object.description;

  return (
    <Link
      href={`/objects/${object.id}`}
      className="group flex flex-col rounded-xl border border-border bg-background p-4 shadow-sm transition-all hover:border-accent/20 hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <ObjectTypeBadge type={object.type} />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground group-hover:text-accent">
        {object.name}
      </h3>
      {preview ? (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {preview}
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
