import { ObjectKnowledgeStrategy, recentSummaries, topInsights } from "./shared";

/**
 * Person memory knowledge: durable traits/preferences + recent interactions.
 * e.g. "老板偏好风险控制" becomes callable knowledge for future AI.
 */
export const personMemory: ObjectKnowledgeStrategy = (object, memories) => {
  const lines: string[] = [];
  const insights = topInsights(memories);
  if (insights.length > 0) {
    lines.push(`关于 ${object.name} 的长期认知：${insights.join("；")}`);
  }
  const recent = recentSummaries(memories, 2);
  if (recent.length > 0) {
    lines.push(`最近互动：${recent.join("；")}`);
  }
  return lines;
};
