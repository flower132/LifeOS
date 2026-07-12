"use client";

import { ObjectAIInsight } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface AIInsightCardProps {
  insight: ObjectAIInsight;
}

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const { t } = useTranslation();

  return (
    <Card variant="ai" className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="accent">{insight.category || t("aiUncategorized")}</Badge>
        <span className="text-xs text-muted-foreground">
          {insight.confidence}%{t("aiConfidence") ? ` ${t("aiConfidence")}` : ""}
        </span>
      </div>
      <h4 className="text-sm font-medium text-foreground">{insight.title}</h4>
      <p className="text-sm text-muted-foreground">{insight.description}</p>
      {insight.evidence.length > 0 && (
        <div className="mt-3 space-y-1">
          {insight.evidence.map((ev, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-accent/30 pl-3 text-xs text-muted-foreground"
            >
              {ev.quote}
            </blockquote>
          ))}
        </div>
      )}
    </Card>
  );
}
