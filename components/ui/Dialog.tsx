import * as React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
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
  description,
  children,
  footer,
  className,
  maxWidth = "md",
}: DialogProps) {
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden="true"
        className="absolute inset-0 bg-black/30 animate-dialog-backdrop"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-xl border border bg-surface p-6 shadow-lg animate-dialog-content",
          maxWidthClass[maxWidth],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="mb-4">
            {title && (
              <h2 className="text-h3 text-primary">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-body-small text-secondary">
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
