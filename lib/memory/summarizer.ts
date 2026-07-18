import { Language } from "@/lib/i18n";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { Memory } from "./types";

// ---------------------------------------------------------------------------
// Summarizer — periodic roll-ups (daily / weekly / monthly / yearly). Long-
// term contexts consume these summaries instead of raw memory text.
// Always via the AI Router (SUMMARY task); null in mock/privacy mode.
// ---------------------------------------------------------------------------

export type SummaryPeriod = "day" | "week" | "month" | "year";

const PERIOD_LABEL: Record<SummaryPeriod, string> = {
  day: "今日",
  week: "本周",
  month: "本月",
  year: "今年",
};

/** periodKey used for dedupe, e.g. "day:2026-07-17" / "week:2026-W29". */
export function periodKey(period: SummaryPeriod, at: Date): string {
  const iso = at.toISOString().slice(0, 10);
  if (period === "day") return `day:${iso}`;
  if (period === "month") return `month:${iso.slice(0, 7)}`;
  if (period === "year") return `year:${iso.slice(0, 4)}`;
  const week = getISOWeek(at);
  return `week:${week}`;
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function buildSummaryPrompt(params: {
  period: SummaryPeriod;
  key: string;
  memories: Memory[];
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const material = params.memories
    .slice(0, 60)
    .map((m) => {
      const date = new Date(m.timestamp).toISOString().slice(0, 10);
      return `- ${date} [${m.type}] ${m.summary ?? m.content.slice(0, 80)}`;
    })
    .join("\n");

  return `你是一位温暖的 LifeOS 记忆总结助手。请基于用户${PERIOD_LABEL[params.period]}（${params.key}）的真实记录，生成一段简短的${PERIOD_LABEL[params.period]}总结。

要求：
1. 只基于提供的记录，禁止编造。
2. 突出重要的人、目标进展、情绪变化、值得记住的时刻。
3. 3-6 句话，温暖、克制，不使用 KPI/评分。
4. ${langHint}

记录：
${material || "（无记录）"}`;
}

/**
 * Generate a period summary from memories. Returns null when AI is
 * unavailable (mock/privacy) or there is nothing to summarize.
 */
export async function summarizePeriod(params: {
  period: SummaryPeriod;
  key: string;
  memories: Memory[];
  language: Language;
}): Promise<string | null> {
  if (params.memories.length === 0) return null;
  if (selectProviderForTask("SUMMARY").isMock) return null;

  try {
    const { content } = await postAI({
      task: "SUMMARY",
      prompt: buildSummaryPrompt(params),
      options: { jsonMode: false },
    });
    // SUMMARY may come back as raw text (jsonMode off).
    const text = content.trim();
    return text.length > 0 ? text : null;
  } catch (err) {
    console.warn("[memory] Period summary failed:", err);
    return null;
  }
}
