"use client";

import { LifeObject } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { EmptyState } from "@/components/ui/EmptyState";
import { AIInsightCard } from "@/components/ai/cards";

interface AIInsightsTabProps {
  object: LifeObject;
}

export function AIInsightsTab({ object }: AIInsightsTabProps) {
  const { t } = useTranslation();
  const insights = object.aiInsights ?? [];

  if (insights.length === 0) {
    return (
      <EmptyState description={t("aiInsightsEmpty")} />
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <AIInsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
