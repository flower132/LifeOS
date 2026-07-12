"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/navigation/PageHeader";
import { SkeletonBlock, SkeletonText } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export type WorkspaceMaxWidth = "2xl" | "3xl" | "4xl" | "5xl";

const maxWidthClass: Record<WorkspaceMaxWidth, string> = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export interface WorkspaceLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  titleGoesHome?: boolean;
  onTitleClick?: () => void;
  stepper?: ReactNode;
  maxWidth?: WorkspaceMaxWidth;
  loading?: boolean;
  loadingSkeleton?: ReactNode;
  error?: string | null;
  onRetry?: () => void;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function WorkspaceLayout({
  title,
  subtitle,
  icon,
  actions,
  backHref,
  backLabel,
  onBack,
  showBackButton = true,
  titleGoesHome = false,
  onTitleClick,
  stepper,
  maxWidth = "2xl",
  loading = false,
  loadingSkeleton,
  error,
  onRetry,
  children,
  className,
  contentClassName,
}: WorkspaceLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <PageHeader
        backHref={backHref}
        backLabel={backLabel}
        onBack={onBack}
        showBackButton={showBackButton}
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={actions}
        titleGoesHome={titleGoesHome}
        onTitleClick={onTitleClick}
        stepper={stepper}
        maxWidth={maxWidth}
      />

      <main
        className={cn(
          "mx-auto px-4 py-6 md:px-6 lg:px-8",
          maxWidthClass[maxWidth],
          contentClassName
        )}
      >
        {loading ? (
          loadingSkeleton ? (
            loadingSkeleton
          ) : (
            <div className="space-y-6">
              <SkeletonText className="h-8 w-48" />
              <SkeletonBlock className="h-32" />
              <SkeletonBlock className="h-32" />
            </div>
          )
        ) : error ? (
          <ErrorState description={error} onRetry={onRetry} />
        ) : (
          children
        )}
      </main>
    </div>
  );
}
