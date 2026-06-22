"use client";

import { useEffect, useState } from "react";
import { LifeObject, Note } from "@/lib/types";
import { aiService, AIInsightResult, EventGoalInsight } from "@/lib/ai";
import { Sparkles, AlertCircle, Bot } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface GoalEventInsightCardProps {
  object: LifeObject;
  notes: Note[];
}

export function GoalEventInsightCard({ object, notes }: GoalEventInsightCardProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<AIInsightResult<EventGoalInsight> | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackLoading, setFallbackLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setResult(null);
      try {
        const res = await aiService.generateEventInsight(object, notes);
        if (!cancelled) setResult(res);
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [object, notes]);

  const handleUseLocal = async () => {
    setFallbackLoading(true);
    try {
      const res = await aiService.generateEventInsight(object, notes, {
        forceMock: true,
      });
      setResult(res);
    } finally {
      setFallbackLoading(false);
    }
  };

  const insight = result?.success ? result.data : null;
  const summary = insight?.summary ?? "";
  const progressInsight = insight?.progress_insight ?? "";
  const blockers = Array.isArray(insight?.blockers) ? insight.blockers : [];

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("aiEventGoalInsight")}
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-accent/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-accent/10" />
        </div>
      ) : !result?.success || !insight ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">{t("aiConnectionFailed")}</p>
              {result?.error && (
                <p className="text-muted-foreground">{result.error}</p>
              )}
              {!result?.error && (
                <p className="text-muted-foreground">{t("aiUnavailable")}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleUseLocal()}
            disabled={fallbackLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Bot className="h-4 w-4" />
            {fallbackLoading ? t("analyzing") : t("useLocalAnalysis")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {summary && (
            <p className="text-sm leading-relaxed text-foreground">
              {summary}
            </p>
          )}

          {progressInsight && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("progressInsight")}
              </p>
              <p className="text-sm text-foreground">{progressInsight}</p>
            </div>
          )}

          {(blockers?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("blockers")}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
                {blockers.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
