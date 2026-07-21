"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleId?: string;
  description?: string;
  descriptionId?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md";
}

const maxWidthClass: Record<NonNullable<DialogProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
};

export function Dialog({
  open,
  onClose,
  title,
  titleId,
  description,
  descriptionId,
  children,
  footer,
  className,
  maxWidth = "md",
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);
  const autoTitleId = React.useId();
  const autoDescId = React.useId();
  const resolvedTitleId = titleId ?? autoTitleId;
  const resolvedDescId = descriptionId ?? autoDescId;

  // Focus trap & restore
  React.useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the dialog on open
    const timer = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Basic focus trap: Tab / Shift+Tab
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(timer);
      // Restore focus to previously active element
      previousActiveElement.current?.focus();
    };
  }, [open, onClose]);

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-black/30 animate-dialog-backdrop"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? resolvedTitleId : undefined}
        aria-describedby={description ? resolvedDescId : undefined}
        className={cn(
          "relative z-10 w-full rounded-xl border border bg-surface p-6 shadow-lg animate-dialog-content outline-none",
          maxWidthClass[maxWidth],
          className
        )}
      >
        {(title || description) && (
          <div className="mb-4">
            {title && (
              <h2 id={resolvedTitleId} className="text-h3 text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p id={resolvedDescId} className="mt-1 text-body-small text-secondary">
                {description}
              </p>
            )}
          </div>
        )}
        <div>{children}</div>
        {footer && (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
