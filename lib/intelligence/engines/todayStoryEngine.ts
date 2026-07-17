import { v4 as uuidv4 } from "uuid";
import { IntelligenceTodayStory } from "@/lib/types";
import { todayStoryOutputSchema } from "../schemas";
import { TodayStoryEngineInput } from "../core/types";

export function buildMockTodayStory(
  input: TodayStoryEngineInput,
  date: string
): IntelligenceTodayStory | null {
  const notes = input.notes.slice().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const todayNote = notes.find((n) => n.created_at.startsWith(date));
  const note = todayNote ?? notes[0];
  if (!note) return null;

  const name = input.self?.name?.trim();
  const isZh = input.language === "zh";

  const greeting = name
    ? isZh
      ? `早上好，${name}。今天也许可以从这条记录开始。`
      : `Good morning, ${name}. Perhaps today starts with this memory.`
    : isZh
    ? "早上好，今天也许可以从这条记录开始。"
    : "Good morning. Perhaps today starts with this memory.";

  const preview = note.content.slice(0, 60).trim();
  const story = isZh
    ? `今天或许会想起你${todayNote ? "今天" : "不久前"}记录的这件事：${preview}${note.content.length > 60 ? "……" : ""}`
    : `Today may connect to this memory you recorded ${todayNote ? "today" : "recently"}: ${preview}${note.content.length > 60 ? "..." : ""}`;

  return {
    id: uuidv4(),
    date,
    story,
    greeting,
    evidence: [
      {
        quote: note.content.slice(0, 120),
        source: `note:${note.id}`,
      },
    ],
    createdAt: new Date().toISOString(),
  };
}

export function mapTodayStoryOutput(
  rawOutput: unknown,
  date: string
): IntelligenceTodayStory | null {
  const parsed = todayStoryOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.error("[Intelligence] Today story parse error:", parsed.error);
    return null;
  }
  if (!parsed.data.story || parsed.data.story.trim().length === 0) {
    return null;
  }
  return {
    id: uuidv4(),
    date,
    story: parsed.data.story.trim(),
    greeting: parsed.data.greeting?.trim(),
    evidence: parsed.data.evidence,
    createdAt: new Date().toISOString(),
  };
}
