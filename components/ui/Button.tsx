import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "text" | "destructive";
  size?: "default" | "sm" | "icon";
  loading?: boolean;
  loadingText?: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary:
    "bg-surface border border text-primary hover:bg-background",
  ghost:
    "bg-transparent text-secondary hover:bg-muted hover:text-primary rounded-sm",
  text: "bg-transparent text-secondary hover:text-primary",
  destructive:
    "bg-error text-inverse hover:bg-error/90",
};

const sizeStyles = {
  default: "h-11 px-4 py-3",
  sm: "h-9 px-3 py-2 text-body-small",
  icon: "h-10 w-10 rounded-sm p-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-button font-medium transition-all duration-fast ease-out",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/15",
          "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = "Button";
