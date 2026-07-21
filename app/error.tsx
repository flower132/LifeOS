"use client";

import { RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";
import { ErrorState } from "@/components/ui/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <main
      role="alert"
      aria-live="assertive"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center"
    >
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-h1 text-primary">{t("errorTitle")}</h1>

        <ErrorState
          title={error?.message}
          description={t("errorDescription")}
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
            onClick={() => reset()}
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
