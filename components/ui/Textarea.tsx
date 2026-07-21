import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full resize-none rounded-md border border bg-surface px-4 py-3 text-body text-primary",
          "placeholder:text-tertiary",
          "transition-colors duration-fast ease-out",
          "focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/15 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
