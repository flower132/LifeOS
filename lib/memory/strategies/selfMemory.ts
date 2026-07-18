import { Memory } from "../types";
import { frequentTopics, recentSummaries, topInsights } from "./shared";

/**
 * Self memory knowledge: personal patterns — emotions, themes, insights
 * across the user's own memories.
 */
export function selfMemory(memories: Memory[]): string[] {
  const lines: string[] = [];
  const insights = topInsights(memories, 3);
  if (insights.length > 0) lines.push(`关于用户的长期认知：${insights.join("；")}`);
  const topics = frequentTopics(memories, 5);
  if (topics.length > 0) lines.push(`用户近期反复关注：${topics.join("、")}`);

  const emotionCounts = new Map<string, number>();
  for (const memory of memories) {
    for (const emotion of memory.emotions ?? []) {
      emotionCounts.set(emotion, (emotionCounts.get(emotion) ?? 0) + 1);
    }
  }
  const topEmotions = [...emotionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion]) => emotion);
  if (topEmotions.length > 0) lines.push(`近期主要情绪：${topEmotions.join("、")}`);

  const recent = recentSummaries(memories, 3);
  if (recent.length > 0) lines.push(`最近记录：${recent.join("；")}`);
  return lines;
}
