import { ObjectKnowledgeStrategy, recentSummaries, topInsights } from "./shared";

/** Event memory knowledge: what happened and what it meant. */
export const eventMemory: ObjectKnowledgeStrategy = (object, memories) => {
  const lines: string[] = [];
  const recent = recentSummaries(memories, 3);
  if (recent.length > 0) lines.push(`事件「${object.name}」经过：${recent.join("；")}`);
  const insights = topInsights(memories, 2);
  if (insights.length > 0) lines.push(`启示：${insights.join("；")}`);
  return lines;
};
