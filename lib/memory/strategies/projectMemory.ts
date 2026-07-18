import { ObjectKnowledgeStrategy, frequentTopics, recentSummaries, topInsights } from "./shared";

/** Project memory knowledge: risks, decisions, recent progress. */
export const projectMemory: ObjectKnowledgeStrategy = (object, memories) => {
  const lines: string[] = [];
  const recent = recentSummaries(memories, 2);
  if (recent.length > 0) lines.push(`项目「${object.name}」最近动态：${recent.join("；")}`);
  const topics = frequentTopics(memories, 3);
  if (topics.length > 0) lines.push(`关注点：${topics.join("、")}`);
  const insights = topInsights(memories, 2);
  if (insights.length > 0) lines.push(`经验/风险：${insights.join("；")}`);
  return lines;
};
