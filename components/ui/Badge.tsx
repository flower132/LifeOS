import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "subtle";
}

const variantStyles = {
  default:
    "inline-flex items-center rounded-md border border bg-surface px-2.5 py-1 text-caption font-medium text-primary",
  accent:
    "inline-flex items-center rounded-md border border-accent/20 bg-accent-soft px-2.5 py-1 text-caption font-medium text-accent",
  subtle:
    "inline-flex items-center rounded-md border border-transparent bg-transparent px-2.5 py-1 text-caption font-medium text-tertiary",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(variantStyles[variant], className)}
      {...props}
    />
  );
}
