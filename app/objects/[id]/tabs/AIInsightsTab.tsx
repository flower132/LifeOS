"use client";

import { LifeObject, ObjectAIInsight } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

interface AIInsightsTabProps {
  object: LifeObject;
}

export function AIInsightsTab({ object }: AIInsightsTabProps) {
  const { t } = useTranslation();
  const insights = object.aiInsights ?? [];

  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("aiInsightsEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: ObjectAIInsight }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
          {insight.category}
        </span>
        <span className="text-xs text-muted-foreground">{insight.confidence}% confidence</span>
      </div>
      <h4 className="text-sm font-medium text-foreground">{insight.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
      {insight.evidence.length > 0 && (
        <div className="mt-3 space-y-1">
          {insight.evidence.map((ev, i) => (
            <blockquote key={i} className="border-l-2 border-accent/30 pl-3 text-xs text-muted-foreground">
              {ev.quote}
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}
