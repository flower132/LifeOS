import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "再试一次",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-error/20 bg-error/10 px-4 py-3",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {title && (
            <p className="text-body font-medium text-error">{title}</p>
          )}
          {description && (
            <p className="text-body-small text-error/80">{description}</p>
          )}
        </div>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
