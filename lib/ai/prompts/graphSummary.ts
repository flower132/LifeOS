import { Language } from "@/lib/i18n";
import { GraphContext } from "@/lib/graph/types";

/**
 * GRAPH_SUMMARY task prompt — narrative summary of an object's place in the
 * user's graph (interactions, trends, shared goals, suggestion).
 */
export function buildGraphSummaryPrompt(params: {
  context: GraphContext;
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const { context } = params;

  const neighborLines = context.neighbors
    .slice(0, 10)
    .map(
      (n) =>
        `- ${n.object.name}（${n.object.type}，关系：${n.relation.label ?? n.relation.type}，强度 ${n.strength}，${n.depth} 跳）`
    )
    .join("\n");

  const memoryLines = context.memories
    .slice(0, 8)
    .map(
      (m) =>
        `- ${new Date(m.timestamp).toISOString().slice(0, 10)} ${m.summary ?? m.content.slice(0, 60)}`
    )
    .join("\n");

  return `你是用户的 LifeOS 图谱分析助手。请基于知识图谱数据，为用户与「${context.focus.name}」的关系/关联状态写一段总结。

要求：
1. 只基于提供的数据，禁止编造；数据不足时诚实说明。
2. 内容涵盖：最近主要因为什么联系、联系频率趋势、共同推进的目标/项目、一条具体建议。
3. 3-5 句，温暖、克制、具体。
4. ${langHint}

对象：${context.focus.name}（${context.focus.type}）

关联对象（按相关度排序）：
${neighborLines || "（无关联对象）"}

最近记忆：
${memoryLines || "（无记忆）"}`;
}
