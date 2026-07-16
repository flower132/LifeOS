import { intelligenceService } from "@/lib/intelligence";
import { StoryEngineResult, EnsureStoryOptions } from "./types";

export async function ensureTodayStory(
  date: string,
  options?: EnsureStoryOptions
): Promise<StoryEngineResult> {
  const story = await intelligenceService.generateTodayStory(date, options);
  return { story };
}
