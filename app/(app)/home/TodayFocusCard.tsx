"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Sparkles, Check, X } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useObjectStore } from "@/stores/objectStore";
import { ObjectTypeBadge } from "@/components/object/ObjectTypeBadge";
import { CompanionEvidenceList } from "@/components/companion/CompanionEvidenceList";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { companionService } from "@/lib/companion";
import { recordFeedback } from "@/lib/companion/learning";
import { getLocalDateString } from "@/lib/companion/utils/date";

export function TodayFocusCard() {
  const { t } = useTranslation();
  const today = getLocalDateString();
  const todayFocuses = useIntelligenceStore((s) => s.cache.todayFocuses);
  const setTodayFocuses = useIntelligenceStore((s) => s.setTodayFocuses);
  const hydrated = useIntelligenceStore((s) => s.hydrated);
  const companionEnabled = useSettingsStore((s) => s.companionEnabled);
  const objects = useObjectStore((s) => s.objects);

  const focus = todayFocuses.find((f) => f.date === today && f.status === "active") ?? null;
  const focusObject = focus?.objectId
    ? objects.find((o) => o.id === focus.objectId)
    : null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await companionService.ensureTodayFocus();
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
    if (!focus && !isLoading && !error) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, focus, companionEnabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateFocus = async (updates: Partial<typeof focus>) => {
    if (!focus) return;
    const next = todayFocuses.map((f) =>
      f.id === focus.id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
    );
    await setTodayFocuses(next);
  };

  const sourceId =
    focus?.objectId ||
    focus?.relationId ||
    focus?.memoryId ||
    focus?.placeId ||
    focus?.habitId ||
    focus?.id;

  const handleDone = () => {
    void updateFocus({ status: "done" });
    if (focus) {
      recordFeedback({
        kind: "focus",
        itemId: focus.id,
        action: "done",
        reason: `sourceId:${sourceId}`,
      });
    }
  };

  const handleDismiss = () => {
    void updateFocus({ status: "dismissed" });
    if (focus) {
      recordFeedback({
        kind: "focus",
        itemId: focus.id,
        action: "dismiss",
        reason: `sourceId:${sourceId}`,
      });
    }
  };

  if (!hydrated || isLoading) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          {t("todayFocusLoading")}
        </div>
      </div>
    );
  }

  if (!companionEnabled) {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5">
        <ErrorState description={error} onRetry={() => void generate()} />
      </div>
    );
  }

  if (!focus) {
    return (
      <SkeletonBlock className="h-40" />
    );
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("todayFocus")}
          </h2>
        </div>
        {focus.objectId && (
          <Link
            href={`/advisor?objectId=${focus.objectId}`}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("askLifeOS")}
          </Link>
        )}
      </div>

      <div className="mb-3 flex items-center gap-3">
        {focusObject && <ObjectTypeBadge type={focusObject.type} />}
        <span className="text-base font-medium text-foreground">{focus.title}</span>
      </div>

      {focus.explanation && (
        <div className="mb-3 rounded-lg border border-border bg-card p-3">
          <p className="text-sm leading-relaxed text-foreground">{focus.explanation}</p>
        </div>
      )}

      {focus.whyNow && (
        <div className="rounded-lg border border-border bg-card p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("whyNow")}
          </h3>
          <p className="text-sm leading-relaxed text-foreground">{focus.whyNow}</p>
        </div>
      )}

      <CompanionEvidenceList evidence={focus.evidence} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDone}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
        >
          <Check className="h-3.5 w-3.5" />
          {t("done")}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
