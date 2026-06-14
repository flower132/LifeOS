"use client";

import { useEffect, useState } from "react";
import { LifeObject, Note, Relation } from "@/lib/types";
import { aiService, SelfState } from "@/lib/ai";
import { Sparkles } from "lucide-react";

interface SelfInsightCardProps {
  object: LifeObject;
  notes: Note[];
  relations: Relation[];
  getObjectName: (id: string) => string;
}

export function SelfInsightCard({
  object,
  notes,
  relations,
  getObjectName,
}: SelfInsightCardProps) {
  const [insight, setInsight] = useState<SelfState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    aiService
      .generateSelfState(object, notes, relations, getObjectName)
      .then((result) => {
        if (!cancelled) setInsight(result);
      })
      .catch(() => {
        if (!cancelled)
          setInsight({
            current_state: "AI self-state unavailable.",
            emotional_trend: "",
            focus_areas: [],
            risks: [],
            recommendations: [],
          });
      })
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [object, notes, relations, getObjectName]);

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-indigo-900">AI Self State</h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-indigo-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-indigo-100" />
        </div>
      ) : insight ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-700">
            {insight.current_state}
          </p>

          {insight.emotional_trend && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Emotional Trend
              </p>
              <p className="text-sm text-slate-700">{insight.emotional_trend}</p>
            </div>
          )}

          {insight.focus_areas.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Focus Areas
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {insight.focus_areas.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {insight.risks.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Risks
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {insight.risks.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {insight.recommendations.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recommendations
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {insight.recommendations.map((item, i) => (
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
