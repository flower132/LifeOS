"use client";

import { Footprints } from "lucide-react";
import { GoalJourney, GoalJourneyStageKind } from "@/lib/services/goalJourney";
import { useTranslation } from "@/lib/useTranslation";

/**
 * GoalJourneyView — 目标旅程。
 *
 * 不展示 60% / 80% 进度，展示故事：
 *   开始 → 困难 → 调整 → 突破 → 完成
 * 数据全部由 GoalJourney 服务从 Memory 推导。
 */

interface GoalJourneyViewProps {
  journey: GoalJourney;
}

const STAGE_ORDER: GoalJourneyStageKind[] = [
  "start",
  "struggle",
  "adjust",
  "breakthrough",
  "complete",
];

export function GoalJourneyView({ journey }: GoalJourneyViewProps) {
  const { t } = useTranslation();

  const stageLabel: Record<GoalJourneyStageKind, string> = {
    start: t("journeyStart"),
    struggle: t("journeyStruggle"),
    adjust: t("journeyAdjust"),
    breakthrough: t("journeyBreakthrough"),
    complete: t("journeyComplete"),
  };

  const reached = new Set(journey.stages.map((s) => s.kind));
  const reachedIndex = Math.max(
    ...journey.stages.map((s) => STAGE_ORDER.indexOf(s.kind)),
    0
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Footprints className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("goalJourney")}
        </h2>
      </div>

      {/* 故事节点 */}
      <div className="space-y-0">
        {journey.stages.map((stage, index) => (
          <div key={`${stage.kind}-${stage.occurredAt}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1.5 h-2 w-2 rounded-full ${
                  stage.kind === journey.currentStage
                    ? "bg-accent"
                    : "bg-muted-foreground/40"
                }`}
              />
              {index < journey.stages.length - 1 && (
                <span className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-foreground">
                {stageLabel[stage.kind]}
              </p>
              {stage.excerpt && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {stage.excerpt}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground/60">
                {stage.occurredAt.slice(0, 10)}
              </p>
            </div>
          </div>
        ))}

        {/* 尚未到达的下一阶段（安静的前方，不是待办） */}
        {!journey.isComplete && reachedIndex < STAGE_ORDER.length - 1 && (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1.5 h-2 w-2 rounded-full border border-dashed border-muted-foreground/40" />
            </div>
            <div className="pb-1">
              <p className="text-sm text-muted-foreground/60">
                {STAGE_ORDER.slice(reachedIndex + 1)
                  .filter((k) => !reached.has(k))
                  .map((k) => stageLabel[k])
                  .join(" · ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
