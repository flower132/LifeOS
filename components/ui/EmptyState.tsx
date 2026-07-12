import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-10 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-h3 text-primary">{title}</h3>
      )}
      {description && (
        <p className="mt-2 max-w-xs text-body text-secondary">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
}
