"use client";

import { useEffect, useState } from "react";
import { LifeObject, Note } from "@/lib/types";
import { aiService, EventGoalInsight } from "@/lib/ai";
import { Sparkles } from "lucide-react";

interface GoalEventInsightCardProps {
  object: LifeObject;
  notes: Note[];
}

export function GoalEventInsightCard({ object, notes }: GoalEventInsightCardProps) {
  const [insight, setInsight] = useState<EventGoalInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    aiService
      .generateEventInsight(object, notes)
      .then((result) => {
        if (!cancelled) setInsight(result);
      })
      .catch(() => {
        if (!cancelled)
          setInsight({
            summary: "AI insight unavailable for this item.",
            progress_insight: "",
            blockers: [],
          });
      })
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [object, notes]);

  const title = object.type === "goal" ? "AI Goal Insight" : "AI Event Insight";

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-indigo-900">{title}</h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-indigo-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-indigo-100" />
        </div>
      ) : insight ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-700">{insight.summary}</p>

          {insight.progress_insight && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Progress
              </p>
              <p className="text-sm text-slate-700">{insight.progress_insight}</p>
            </div>
          )}

          {insight.blockers.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Blockers
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {insight.blockers.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
