import { Language } from "@/lib/i18n";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { buildTimelineQueryPrompt } from "@/lib/ai/prompts/timelineQuery";
import { useSettingsStore } from "@/stores/settingsStore";
import { matchEventsForQuestion } from "./timelineQuery";

// ---------------------------------------------------------------------------
// Timeline Q&A — answers strictly grounded in timeline events (no free
// generation; no matches → honest "not found").
// ---------------------------------------------------------------------------

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

export async function answerTimelineQuestion(question: string): Promise<string> {
  const language = getLanguage();
  const { events, parsed } = matchEventsForQuestion(question, 20);

  if (events.length === 0) {
    return language === "zh"
      ? "时间线中没有找到相关记录。"
      : "No matching records in the timeline.";
  }

  if (selectProviderForTask("TIMELINE_QUERY").isMock) {
    // Local grounded fallback: return the matched events verbatim.
    return events
      .slice(0, 5)
      .map((e) => `${new Date(e.timestamp).toISOString().slice(0, 10)} · ${e.title}`)
      .join("\n");
  }

  try {
    const { content } = await postAI({
      task: "TIMELINE_QUERY",
      prompt: buildTimelineQueryPrompt({
        question,
        events,
        rangeLabel: parsed.label,
        language,
      }),
      options: { jsonMode: false },
    });
    return (
      content
        .trim()
        .replace(/^```(?:json|text|markdown)?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim() ||
      (language === "zh" ? "时间线中没有找到相关记录。" : "No matching records in the timeline.")
    );
  } catch (err) {
    console.warn("[timeline] Q&A failed:", err);
    return language === "zh"
      ? "暂时无法回答，请稍后再试。"
      : "Unable to answer right now.";
  }
}
