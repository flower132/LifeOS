"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { computeTimelineInsights } from "@/lib/graph/timeline";
import { useObjectStore } from "@/stores/objectStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { useNoteStore } from "@/stores/noteStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { History, ArrowRight, Clock3, RotateCcw, Search, BookOpen } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { TimelineExplorerDialog, ExplorerTab } from "./TimelineExplorerDialog";

/**
 * Timeline Insight — rule-based insights from the Timeline Engine (streaks,
 * fastest-growing relations, slowing projects) + entry points for Time
 * Travel / Life Replay / Timeline Search / Life Chapters.
 */
export function TimelineInsightCard() {
  const { t, language } = useTranslation();
  // Subscribe to underlying data so insights refresh with it.
  const objects = useObjectStore((s) => s.objects);
  const memories = useMemoryStore((s) => s.memories);
  const notes = useNoteStore((s) => s.notes);

  const [openTab, setOpenTab] = useState<ExplorerTab | null>(null);

  const insights = useMemo(
    () => computeTimelineInsights(language),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objects, memories, notes, language]
  );

  return (
    <>
      <Card variant="ai" className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <History className="h-4 w-4 text-accent" />
          {t("timelineInsights")}
        </div>

        {insights.length > 0 ? (
          <ul className="space-y-2">
            {insights.map((insight) => (
              <li key={insight.id}>
                {insight.objectId ? (
                  <Link
                    href={`/objects/${insight.objectId}`}
                    className="group flex items-start justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/60"
                  >
                    <div className="text-sm">
                      <p className="text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">{insight.detail}</p>
                    </div>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <div className="text-sm">
                    <p className="text-foreground">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.detail}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("timelineInsightsEmpty")}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => setOpenTab("travel")}>
            <Clock3 className="h-3.5 w-3.5" />
            {t("timeTravel")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpenTab("replay")}>
            <RotateCcw className="h-3.5 w-3.5" />
            {t("lifeReplay")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpenTab("search")}>
            <Search className="h-3.5 w-3.5" />
            {t("timelineSearch")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpenTab("chapters")}>
            <BookOpen className="h-3.5 w-3.5" />
            {t("lifeChapters")}
          </Button>
        </div>
      </Card>

      <TimelineExplorerDialog tab={openTab} onClose={() => setOpenTab(null)} />
    </>
  );
}
