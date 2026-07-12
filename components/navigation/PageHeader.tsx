"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BackButton } from "./BackButton";

interface PageHeaderProps {
  backHref?: string;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  titleGoesHome?: boolean;
  onTitleClick?: () => void;
  stepper?: ReactNode;
  maxWidth?: "2xl" | "3xl" | "4xl" | "5xl";
  showBackButton?: boolean;
  backLabel?: string;
  className?: string;
}

const maxWidthClass: Record<string, string> = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export function PageHeader({
  backHref,
  onBack,
  title,
  subtitle,
  icon,
  actions,
  titleGoesHome = false,
  onTitleClick,
  stepper,
  maxWidth = "2xl",
  showBackButton = true,
  backLabel,
  className,
}: PageHeaderProps) {
  const titleContent = (
    <span
      className={cn(
        "text-h1 text-primary",
        titleGoesHome || onTitleClick
          ? "cursor-pointer transition-colors duration-fast ease-out hover:text-accent"
          : "cursor-default"
      )}
      onClick={onTitleClick}
      role={titleGoesHome || onTitleClick ? "button" : undefined}
      tabIndex={titleGoesHome || onTitleClick ? 0 : undefined}
      onKeyDown={
        onTitleClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTitleClick();
              }
            }
          : undefined
      }
    >
      {title}
    </span>
  );

  return (
    <header className={cn("bg-background px-4 py-4 md:px-6 lg:px-8", className)}>
      <div
        className={cn(
          "mx-auto",
          maxWidthClass[maxWidth],
          actions ? "flex items-start justify-between gap-4" : ""
        )}
      >
        <div className="min-w-0 flex-1 space-y-1">
          {showBackButton && (backHref || onBack) && (
            <div>
              <BackButton href={backHref} onClick={onBack} label={backLabel} />
            </div>
          )}

          <div className="flex items-center gap-3">
            {icon && <span className="shrink-0">{icon}</span>}
            {titleContent}
          </div>

          {subtitle && (
            <p className="text-body-small text-secondary">{subtitle}</p>
          )}

          {stepper && <div className="pt-3">{stepper}</div>}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
