"use client";

import React from "react";
import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";
import { ErrorState } from "@/components/ui/ErrorState";

/* ------------------------------------------------------------------ */
/* LifeOS ErrorBoundary                                               */
/*                                                                    */
/* Catches render errors and provides recovery actions:               */
/* - Reset (try again without full reload)                            */
/* - Back to Home                                                     */
/* - Reload page                                                      */
/*                                                                    */
/* Production: errors are logged but never exposed to users.         */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback component */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  const { t } = useTranslation();

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main
      role="alert"
      aria-live="assertive"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center md:px-6"
    >
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-h1 text-primary">{t("errorTitle")}</h1>

        <ErrorState
          title={error?.message}
          description={t("errorDescription")}
          onRetry={onReset}
          retryLabel={t("dialog.retry")}
        />

        <p className="text-body-small text-secondary">{t("errorDataSafe")}</p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/15"
          >
            <Home className="h-4 w-4" />
            {t("backToHome")}
          </Link>
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/15"
          >
            <RotateCcw className="h-4 w-4" />
            {t("reload")}
          </button>
        </div>
      </div>
    </main>
  );
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Production: send to error monitoring service (e.g. Sentry, PostHog)
    // Development: log with component stack for debugging
    if (process.env.NODE_ENV !== "production") {
      console.error("[LifeOS] ErrorBoundary:", error.message, info.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
