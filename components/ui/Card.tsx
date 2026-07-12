import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "focus" | "subtle" | "ai";
}

const variantStyles = {
  default: "bg-surface rounded-lg border border shadow-sm",
  focus: "bg-surface rounded-xl border border shadow-md",
  subtle: "bg-surface rounded-lg border border-subtle",
  ai: "bg-surface rounded-xl border border-accent/20",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, padding = "md", variant = "default", children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
