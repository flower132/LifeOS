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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">{t("errorTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("errorDescription")}</p>
        <p className="text-xs text-muted-foreground">{t("errorDataSafe")}</p>
        {error?.message && (
          <ErrorState description={error.message} />
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
            onClick={() => {
              reset();
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
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
