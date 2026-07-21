"use client";

import { useMemo } from "react";
import Link from "next/link";
import { recommendInsights } from "@/lib/graph";
import { useObjectStore } from "@/stores/objectStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { Card } from "@/components/ui/Card";
import { Network, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

/**
 * Graph Insight — rule-based insights from the Knowledge Graph (fading
 * contacts, stalled goals, quiet projects). Data-driven, never hallucinated.
 * Renders nothing when there are no insights.
 */
export function GraphInsightCard() {
  const { t } = useTranslation();
  // Subscribe to the underlying data so insights refresh with it.
  const objects = useObjectStore((s) => s.objects);
  const memories = useMemoryStore((s) => s.memories);

  const insights = useMemo(
    () => recommendInsights(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objects, memories]
  );

  if (insights.length === 0) return null;

  return (
    <Card variant="ai" className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Network className="h-4 w-4 text-accent" />
        {t("graphInsights")}
      </div>
      <ul className="space-y-2">
        {insights.map((insight) => (
          <li key={insight.id}>
            <Link
              href={`/objects/${insight.objectId}`}
              className="group flex items-start justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/60"
            >
              <div className="text-sm">
                <p className="text-foreground">{insight.message}</p>
                <p className="text-xs text-muted-foreground">{insight.suggestion}</p>
              </div>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
