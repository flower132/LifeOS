import { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: Tag;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: tag.color ? `${tag.color}15` : "#f1f5f9",
        color: tag.color || "#475569",
      }}
    >
      {tag.name}
    </span>
  );
}
