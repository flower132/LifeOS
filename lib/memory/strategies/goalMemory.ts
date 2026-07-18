import { ObjectKnowledgeStrategy, frequentTopics, recentSummaries, topInsights } from "./shared";

/** Goal memory knowledge: progress trajectory + recurring themes. */
export const goalMemory: ObjectKnowledgeStrategy = (object, memories) => {
  const lines: string[] = [];
  const status = String(object.properties?.status ?? "");
  if (status) lines.push(`目标「${object.name}」当前状态：${status}`);
  const recent = recentSummaries(memories, 2);
  if (recent.length > 0) lines.push(`最近进展：${recent.join("；")}`);
  const topics = frequentTopics(memories, 3);
  if (topics.length > 0) lines.push(`反复出现的主题：${topics.join("、")}`);
  const insights = topInsights(memories, 2);
  if (insights.length > 0) lines.push(`相关认知：${insights.join("；")}`);
  return lines;
};
