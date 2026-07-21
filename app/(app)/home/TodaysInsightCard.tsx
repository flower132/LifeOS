"use client";

import { useMemo } from "react";
import Link from "next/link";
import { brain } from "@/lib/lifebrain";
import { useObjectStore } from "@/stores/objectStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { useNoteStore } from "@/stores/noteStore";
import { Card } from "@/components/ui/Card";
import { Brain, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

/**
 * Today's Insight — the unified daily insight from Life Brain (Knowledge
 * Graph + Timeline, cached). Renders nothing when there's no insight.
 */
export function TodaysInsightCard() {
  const { t } = useTranslation();
  const objects = useObjectStore((s) => s.objects);
  const memories = useMemoryStore((s) => s.memories);
  const notes = useNoteStore((s) => s.notes);

  const bundle = useMemo(
    () => brain.generateInsight(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objects, memories, notes]
  );

  if (!bundle.headline) return null;

  const { headline } = bundle;

  return (
    <Card variant="ai" className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Brain className="h-4 w-4 text-accent" />
        {t("todaysInsight")}
      </div>
      {headline.objectId ? (
        <Link href={`/objects/${headline.objectId}`} className="group flex items-start justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/60">
          <div className="text-sm">
            <p className="text-foreground">{headline.title}</p>
            <p className="text-xs text-muted-foreground">{headline.detail}</p>
          </div>
          <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <div className="text-sm">
          <p className="text-foreground">{headline.title}</p>
          <p className="text-xs text-muted-foreground">{headline.detail}</p>
        </div>
      )}
    </Card>
  );
}
