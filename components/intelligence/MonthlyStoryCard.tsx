"use client";

import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { companionService } from "@/lib/companion";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { IntelligenceEvidenceList } from "./IntelligenceEvidenceList";
import { getMonthKey } from "@/lib/companion/utils/date";

export function MonthlyStoryCard() {
  const { t } = useTranslation();
  const monthKey = getMonthKey();
  const monthlyStories = useIntelligenceStore((s) => s.cache.monthlyStories);
  const setMonthlyStories = useIntelligenceStore((s) => s.setMonthlyStories);
  const hydrated = useIntelligenceStore((s) => s.hydrated);
  const companionEnabled = useSettingsStore((s) => s.companionEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const story =
    monthlyStories.find((s) => s.monthKey === monthKey && s.status === "active") ?? null;

  const generate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await companionService.ensureMonthlyStory(monthKey);
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
    if (!story && !isLoading && !error) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, story, companionEnabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDismiss = async () => {
    if (!story) return;
    const next = monthlyStories.map((s) =>
      s.id === story.id ? { ...s, status: "dismissed" as const } : s
    );
    await setMonthlyStories(next);
  };

  if (!hydrated || isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          {t("monthlyStoryLoading")}
        </div>
      </div>
    );
  }

  if (!companionEnabled || !story) {
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
    <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("monthlyStory")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void handleDismiss()}
          className="rounded-lg p-1 text-muted-foreground hover:bg-accent/10"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{story.story}</p>
      <IntelligenceEvidenceList evidence={story.evidence} />
    </div>
  );
}
