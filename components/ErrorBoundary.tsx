"use client";

import React from "react";
import { RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

function ErrorFallback({
  error,
  onReload,
}: {
  error?: Error;
  onReload: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">{t("errorTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("errorDescription")}</p>
        <p className="text-xs text-muted-foreground">{t("errorDataSafe")}</p>
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-left text-xs text-destructive">
            {error.message}
          </div>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Home className="h-4 w-4" />
            {t("backToHome")}
          </Link>
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            {t("reload")}
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[LifeOS] ErrorBoundary caught error:", error, info);
  }

  handleReload = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback error={this.state.error} onReload={this.handleReload} />
      );
    }

    return this.props.children;
  }
}
