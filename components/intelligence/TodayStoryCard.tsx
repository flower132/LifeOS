"use client";

import { useEffect, useState } from "react";
import { Sunrise, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { intelligenceService } from "@/lib/intelligence";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { IntelligenceEvidenceList } from "./IntelligenceEvidenceList";

export function TodayStoryCard() {
  const { t } = useTranslation();
  const todayStories = useIntelligenceStore((s) => s.cache.todayStories);
  const hydrated = useIntelligenceStore((s) => s.hydrated);
  const setTodayStories = useIntelligenceStore((s) => s.setTodayStories);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const story = todayStories.find((s) => s.date === today) ?? null;

  const generate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const generated = await intelligenceService.generateTodayStory(today);
      if (generated) {
        setTodayStories([generated, ...todayStories.filter((s) => s.date !== today)].slice(0, 30));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hydrated) return;
    if (!story && !isLoading && !error) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, story, today]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!story) {
    if (isLoading) {
      return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            {t("todayStoryLoading") ?? "正在连接今天与过去..."}
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <ErrorState description={error} onRetry={() => void generate()} />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("todayStory") ?? "Today's Story"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={isLoading}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent/10 hover:text-accent disabled:opacity-50"
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {t("refresh")}
        </button>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{story.story}</p>
      <IntelligenceEvidenceList evidence={story.evidence} />
    </div>
  );
}
