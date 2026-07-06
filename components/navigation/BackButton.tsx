"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
  iconSize?: number;
}

export function BackButton({
  href,
  onClick,
  label,
  className,
  iconSize = 22,
}: BackButtonProps) {
  const content = (
    <span
      className={cn(
        "inline-flex h-11 min-w-[44px] items-center gap-1.5 rounded-xl text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        label ? "px-3" : "w-11 justify-center",
        className
      )}
      aria-label={label ?? "返回"}
    >
      <ArrowLeft
        style={{ width: iconSize, height: iconSize, flexShrink: 0 }}
        strokeWidth={2}
      />
      {label && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="shrink-0">
      {content}
    </button>
  );
}
