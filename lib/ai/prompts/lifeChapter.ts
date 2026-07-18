import { Language } from "@/lib/i18n";
import { TimelineEvent } from "@/lib/graph/timeline/types";

/**
 * LIFE_CHAPTER task prompt — cluster a period of timeline events into named
 * life chapters (start/end, representative people/goals/events/growth).
 */
export function buildLifeChapterPrompt(params: {
  events: TimelineEvent[];
  existingChapterTitles: string[];
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const eventLines = params.events
    .slice(0, 80)
    .map(
      (e) =>
        `- ${new Date(e.timestamp).toISOString().slice(0, 10)} [${e.type}] ${e.title}`
    )
    .join("\n");

  const shape = JSON.stringify(
    {
      chapters: [
        {
          title: "string: 章节名，如 阿里阶段、北航读研、LifeOS创业",
          description: "string: 一两句话描述这段时期",
          startDate: "YYYY-MM-DD",
          endDate: "YYYY-MM-DD 或 null（进行中）",
          people: ["代表人物名"],
          goals: ["代表目标/项目名"],
          places: ["代表地点，没有则为空数组"],
          growth: "string: 这段时期代表的成长",
        },
      ],
    },
    null,
    2
  );

  return `你是一位 LifeOS 人生章节分析助手。请基于用户的时间线事件，把这段人生划分为有意义的章节。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
1. 章节边界应有真实依据（密集活动期、重大事件、长期空白）。
2. 章节数量 1-5 个，宁少勿多。
3. 只基于提供的事件，禁止编造。
4. ${params.existingChapterTitles.length > 0 ? `已有章节（避免重复）：${params.existingChapterTitles.join("、")}` : ""}
5. ${langHint}

时间线事件（按时间倒序）：
${eventLines || "（无事件）"}`;
}
