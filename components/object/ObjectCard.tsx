"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Check, Lock } from "lucide-react";
import { LifeObject } from "@/lib/types";
import { useTagStore } from "@/stores/tagStore";
import { propertiesToPreview } from "@/lib/objectProperties";
import { ObjectTypeBadge } from "./ObjectTypeBadge";
import { TagBadge } from "../tag/TagBadge";
import { useTranslation } from "@/lib/useTranslation";
import { cn } from "@/lib/utils";

interface ObjectCardProps {
  object: LifeObject;
  mode?: "view" | "manage";
  selected?: boolean;
  locked?: boolean;
  onToggle?: () => void;
  onShiftClick?: () => void;
}

export function ObjectCard({
  object,
  mode = "view",
  selected = false,
  locked = false,
  onToggle,
  onShiftClick,
}: ObjectCardProps) {
  const tags = useTagStore((state) => state.tags);
  const { language } = useTranslation();
  const objectTags = useMemo(
    () =>
      object.tag_ids
        .map((id) => tags.find((t) => t.id === id))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
    [tags, object.tag_ids]
  );

  const preview =
    propertiesToPreview(object.type, object.properties, language) || object.description;

  const cardContent = (
    <>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === "manage" && (
            locked ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground">
                <Lock className="h-3 w-3" />
              </span>
            ) : (
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                  selected
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle?.();
                }}
              >
                {selected && <Check className="h-3 w-3" />}
              </span>
            )
          )}
          <ObjectTypeBadge type={object.type} />
        </div>
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground group-hover:text-accent">
        {object.name}
      </h3>
      {preview ? (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{preview}</p>
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
    </>
  );

  if (mode === "view") {
    return (
      <Link
        href={`/objects/${object.id}`}
        className="group flex flex-col rounded-xl border border-border bg-background p-4 shadow-sm transition-all hover:border-accent/20 hover:shadow-md"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      role="button"
      tabIndex={locked ? -1 : 0}
      onClick={(e) => {
        if (locked) return;
        if (e.shiftKey) {
          onShiftClick?.();
        } else {
          onToggle?.();
        }
      }}
      onKeyDown={(e) => {
        if (locked) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle?.();
        }
      }}
      className={cn(
        "group flex flex-col rounded-xl border p-4 shadow-sm transition-all",
        selected
          ? "border-accent/30 bg-accent/[0.02]"
          : "border-border bg-background hover:border-accent/20 hover:shadow-md",
        locked && "cursor-not-allowed opacity-60"
      )}
    >
      {cardContent}
    </div>
  );
}
