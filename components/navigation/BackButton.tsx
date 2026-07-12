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
  iconSize = 24,
}: BackButtonProps) {
  const content = (
    <span
      className={cn(
        "inline-flex h-11 min-w-[44px] items-center gap-1.5 rounded-md text-secondary transition-colors duration-fast ease-out",
        "hover:bg-muted hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/15",
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
        <span className="text-body-small font-medium">{label}</span>
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
