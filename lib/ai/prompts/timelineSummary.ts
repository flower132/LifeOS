import { Language } from "@/lib/i18n";
import { TimelineEvent, TimelineStats } from "@/lib/graph/timeline/types";

/**
 * TIMELINE_SUMMARY task prompts — period summaries and evolution narratives,
 * all built from the timeline event stream (never a DB rescan).
 */

function formatEvents(events: TimelineEvent[], limit: number): string {
  return events
    .slice(0, limit)
    .map(
      (e) =>
        `- ${new Date(e.timestamp).toISOString().slice(0, 10)} [${e.type}] ${e.title}`
    )
    .join("\n");
}

export function buildTimelineSummaryPrompt(params: {
  periodLabel: string;
  events: TimelineEvent[];
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  return `你是一位温暖的 LifeOS 时间线总结助手。请基于用户${params.periodLabel}的时间线事件，生成一段简短的总结。

要求：
1. 只基于提供的事件，禁止编造；事件不足时诚实说明。
2. 突出重要的人、目标进展、值得记住的变化。
3. 3-6 句，温暖、克制，不使用 KPI/评分。
4. ${langHint}

时间线事件：
${formatEvents(params.events, 60) || "（无事件）"}`;
}

export function buildEvolutionPrompt(params: {
  subjectName: string;
  subjectKind: "relationship" | "project" | "goal";
  events: TimelineEvent[];
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const kindLabel =
    params.subjectKind === "relationship"
      ? "这段关系的发展历程（Relationship Evolution）"
      : params.subjectKind === "project"
        ? "这个项目是怎样一步步完成的（Project History）"
        : "这个目标的推进历程（Goal Roadmap）";

  return `你是一位 LifeOS 时间线分析助手。请基于时间线事件，用 3-5 句话叙述${kindLabel}。

要求：
1. 按时间顺序讲清楚关键节点与转折。
2. 只基于提供的事件，禁止编造；数据不足时诚实说明。
3. 温暖、克制、具体。
4. ${langHint}

主题：${params.subjectName}

时间线事件（按时间倒序）：
${formatEvents(params.events, 40) || "（无事件）"}`;
}

export function buildReplayPrompt(params: {
  periodLabel: string;
  stats: TimelineStats;
  topEvents: TimelineEvent[];
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const { stats } = params;

  const people = stats.activePeople.map((p) => p.name).join("、") || "（无）";
  const projects = stats.activeProjects.map((p) => p.name).join("、") || "（无）";

  return `你是一位温暖的 LifeOS 人生回放助手。请基于以下数据，为用户生成一段${params.periodLabel}的人生回放。

要求：
1. 结构：这段时间主要投入了什么 → 遇到了哪些人 → 完成了什么 → 最大的成长/变化。
2. 只基于提供的数据，禁止编造。
3. 4-8 句，像一段温柔的旁白，不使用 KPI/排行榜。
4. ${langHint}

${params.periodLabel}数据：
- 事件总数：${stats.totalEvents}
- 新增记忆：${stats.memoriesCreated}，新增笔记：${stats.notesCreated}
- 新增关系：${stats.newRelations}，AI 发现关系：${stats.discoveredRelations}
- 主要人物：${people}
- 推进的项目：${projects}
- 有进展的目标数：${stats.goalsProgressed.length}

重要事件：
${formatEvents(params.topEvents, 15) || "（无）"}`;
}
