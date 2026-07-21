"use client";

import { useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { companionService } from "@/lib/companion";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { IntelligenceEvidenceList } from "./IntelligenceEvidenceList";
import { getISOWeekKey } from "@/lib/companion/utils/date";

export function WeeklyReviewCard() {
  const { t } = useTranslation();
  const weekKey = getISOWeekKey();
  const weeklyReviews = useIntelligenceStore((s) => s.cache.weeklyReviews);
  const setWeeklyReviews = useIntelligenceStore((s) => s.setWeeklyReviews);
  const hydrated = useIntelligenceStore((s) => s.hydrated);
  const companionEnabled = useSettingsStore((s) => s.companionEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const review =
    weeklyReviews.find((r) => r.weekKey === weekKey && r.status === "active") ?? null;

  const generate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await companionService.ensureWeeklyReview(weekKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hydrated) return;
    if (!companionEnabled) return;
    if (!review && !isLoading && !error) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, review, companionEnabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDismiss = async () => {
    if (!review) return;
    const next = weeklyReviews.map((r) =>
      r.id === review.id ? { ...r, status: "dismissed" as const } : r
    );
    await setWeeklyReviews(next);
  };

  if (!hydrated || isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          {t("weeklyReviewLoading")}
        </div>
      </div>
    );
  }

  if (!companionEnabled || !review) {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <ErrorState description={error} onRetry={() => void generate()} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("weeklyReview")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void handleDismiss()}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {review.mostImportantPerson && (
        <div className="mb-3 rounded-lg border border-border bg-background p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("mostImportantPerson")}
          </h3>
          <p className="text-sm font-medium text-foreground">{review.mostImportantPerson.name}</p>
          <p className="text-sm text-muted-foreground">{review.mostImportantPerson.reason}</p>
          <IntelligenceEvidenceList evidence={review.mostImportantPerson.evidence} />
        </div>
      )}

      {review.mostImportantGoal && (
        <div className="mb-3 rounded-lg border border-border bg-background p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("mostImportantGoal")}
          </h3>
          <p className="text-sm font-medium text-foreground">{review.mostImportantGoal.name}</p>
          <p className="text-sm text-muted-foreground">{review.mostImportantGoal.reason}</p>
          <IntelligenceEvidenceList evidence={review.mostImportantGoal.evidence} />
        </div>
      )}

      {review.growth && (
        <div className="mb-3 rounded-lg border border-border bg-background p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("growth")}
          </h3>
          <p className="text-sm text-muted-foreground">{review.growth.statement}</p>
          <IntelligenceEvidenceList evidence={review.growth.evidence} />
        </div>
      )}

      {review.emotion && (
        <div className="mb-3 rounded-lg border border-border bg-background p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("emotion")}
          </h3>
          <p className="text-sm text-muted-foreground">{review.emotion.statement}</p>
          <IntelligenceEvidenceList evidence={review.emotion.evidence} />
        </div>
      )}

      {review.gratitude && (
        <div className="rounded-lg border border-border bg-background p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("gratitude")}
          </h3>
          <p className="text-sm text-muted-foreground">{review.gratitude.statement}</p>
          <IntelligenceEvidenceList evidence={review.gratitude.evidence} />
        </div>
      )}
    </div>
  );
}
