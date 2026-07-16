import { LifeObject, Note } from "@/lib/types";

/**
 * GoalJourney — 目标旅程。
 *
 * Goal 不强调 60% / 80% / 100%，而展示一个故事：
 *   开始 → 困难 → 调整 → 突破 → 完成
 * 全部从 Memory 自动推导，没有进度条。纯函数。
 */

export type GoalJourneyStageKind =
  | "start" // 开始
  | "struggle" // 困难
  | "adjust" // 调整
  | "breakthrough" // 突破
  | "complete"; // 完成

export interface GoalJourneyStage {
  kind: GoalJourneyStageKind;
  title: string;
  excerpt?: string;
  occurredAt: string; // ISO
}

export interface GoalJourney {
  goalId: string;
  stages: GoalJourneyStage[];
  currentStage: GoalJourneyStageKind;
  isComplete: boolean;
}

const STRUGGLE_PATTERN = /困难|卡住|停滞|放弃|压力|焦虑|瓶颈|坚持不下|hard|stuck|struggling/i;
const ADJUST_PATTERN = /调整|改变计划|重新规划|修改目标|换个方式|换一种|adjust|replan|changed approach/i;
const BREAKTHROUGH_PATTERN = /突破|进展|做到了|完成了.?步|阶段性| milestone|breakthrough|progress/i;

const STAGE_TITLE: Record<GoalJourneyStageKind, string> = {
  start: "开始",
  struggle: "困难",
  adjust: "调整",
  breakthrough: "突破",
  complete: "完成",
};

export function buildGoalJourney(
  goal: LifeObject,
  notes: Note[]
): GoalJourney {
  const stages: GoalJourneyStage[] = [];

  // 开始：目标创建（优先用 start_time 属性）
  const startTime =
    typeof goal.properties?.start_time === "string" && goal.properties.start_time
      ? goal.properties.start_time
      : goal.created_at;
  stages.push({
    kind: "start",
    title: STAGE_TITLE.start,
    excerpt: goal.description?.slice(0, 60),
    occurredAt: startTime,
  });

  // 目标相关的笔记（关联到该 goal 的 note + 该 goal 的 object memories 由调用方合并进 notes 语义外）
  const related = notes
    .filter((n) => n.object_id === goal.id)
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const seen = new Set<GoalJourneyStageKind>(["start"]);
  for (const note of related) {
    let kind: GoalJourneyStageKind | null = null;
    if (STRUGGLE_PATTERN.test(note.content)) kind = "struggle";
    else if (ADJUST_PATTERN.test(note.content)) kind = "adjust";
    else if (BREAKTHROUGH_PATTERN.test(note.content)) kind = "breakthrough";

    if (kind && !seen.has(kind)) {
      seen.add(kind);
      stages.push({
        kind,
        title: STAGE_TITLE[kind],
        excerpt: note.content.slice(0, 60),
        occurredAt: note.created_at,
      });
    }
  }

  // 完成：properties.status = completed
  const isComplete = goal.properties?.status === "completed";
  if (isComplete) {
    stages.push({
      kind: "complete",
      title: STAGE_TITLE.complete,
      occurredAt: goal.updated_at,
    });
  }

  const ordered = stages.sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
  const currentStage = ordered[ordered.length - 1]?.kind ?? "start";

  return {
    goalId: goal.id,
    stages: ordered,
    currentStage: isComplete ? "complete" : currentStage,
    isComplete,
  };
}
