"use client";

import { useEffect, useState } from "react";
import { LifeObject, Note } from "@/lib/types";
import { aiService, EventGoalInsight } from "@/lib/ai";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface GoalEventInsightCardProps {
  object: LifeObject;
  notes: Note[];
}

export function GoalEventInsightCard({ object, notes }: GoalEventInsightCardProps) {
  const { t } = useTranslation();
  const [insight, setInsight] = useState<EventGoalInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setHasError(false);
      try {
        const result = await aiService.generateEventInsight(object, notes);
        if (!cancelled) setInsight(result);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [object, notes]);

  const summary = insight?.summary ?? "";
  const progressInsight = insight?.progress_insight ?? "";
  const blockers = Array.isArray(insight?.blockers) ? insight.blockers : [];

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          {t("aiEventGoalInsight")}
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-indigo-100 dark:bg-indigo-900" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-indigo-100 dark:bg-indigo-900" />
        </div>
      ) : hasError || !insight ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("aiUnavailable")}</p>
      ) : (
        <div className="space-y-4">
          {summary && (
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {summary}
            </p>
          )}

          {progressInsight && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("progressInsight")}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{progressInsight}</p>
            </div>
          )}

          {(blockers?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("blockers")}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700 dark:text-slate-300">
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
