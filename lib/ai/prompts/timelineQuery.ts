import { Language } from "@/lib/i18n";
import { TimelineEvent } from "@/lib/graph/timeline/types";

/**
 * TIMELINE_QUERY task prompt — answer strictly from timeline events.
 */
export function buildTimelineQueryPrompt(params: {
  question: string;
  events: TimelineEvent[];
  rangeLabel?: string;
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const eventLines = params.events
    .map(
      (e) =>
        `- ${new Date(e.timestamp).toISOString().slice(0, 10)} [${e.type}] ${e.title}`
    )
    .join("\n");

  return `你是 LifeOS 时间线问答助手。请【只】基于以下时间线事件回答用户问题。

硬性规则：
1. 只能使用下面列出的事件信息，禁止使用任何外部知识或推测。
2. 如果事件中没有答案，直接回答"时间线中没有找到相关记录"，不要编造。
3. 回答要简短，引用具体日期。
4. ${langHint}

用户问题：${params.question}
${params.rangeLabel ? `（问题涉及的时间范围：${params.rangeLabel}）` : ""}

时间线事件：
${eventLines || "（无匹配事件）"}`;
}
