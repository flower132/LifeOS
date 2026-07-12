"use client";

import React from "react";
import { Home } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";
import { ErrorState } from "@/components/ui/ErrorState";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center md:px-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-h1 text-primary">{t("errorTitle")}</h1>
        <ErrorState
          title={error?.message}
          description={t("errorDescription")}
          onRetry={onReload}
          retryLabel={t("reload")}
        />
        <p className="text-body-small text-secondary">{t("errorDataSafe")}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-md bg-surface border border px-4 py-3 text-button font-medium text-primary transition-colors duration-fast ease-out hover:bg-background"
          >
            <Home className="h-4 w-4" />
            {t("backToHome")}
          </Link>
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
