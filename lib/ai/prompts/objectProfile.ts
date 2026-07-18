import { Language } from "@/lib/i18n";
import { LifeObject, Note } from "@/lib/types";
import { Memory } from "@/lib/memory/types";

/**
 * OBJECT_PROFILE task prompts — generate or incrementally update an
 * object's AI-maintained profile. Pure prompt-string builders.
 */

function formatMemories(memories: Memory[], limit: number): string {
  return memories
    .slice(0, limit)
    .map((m) => {
      const date = new Date(m.timestamp).toISOString().slice(0, 10);
      return `[memory:${m.id}] ${date} ${m.summary ?? m.content.slice(0, 80)}${
        m.insights.length > 0 ? `（认知：${m.insights.join("；")}）` : ""
      }`;
    })
    .join("\n");
}

function formatNotes(notes: Note[], limit: number): string {
  return notes
    .slice(0, limit)
    .map((n) => `[note:${n.id}] ${n.created_at.slice(0, 10)} ${n.content.slice(0, 100)}`)
    .join("\n");
}

const PROFILE_SHAPE = JSON.stringify(
  {
    summary: "string",
    traits: ["string"],
    preferences: ["string"],
    importantEvents: ["string: YYYY-MM 事件"],
    recentChanges: ["string"],
    relationshipSummary: "string（仅人物对象，否则空字符串）",
    communicationStyle: "string（仅人物对象，否则空字符串）",
    insights: ["string"],
    risk: ["string"],
    opportunities: ["string"],
  },
  null,
  2
);

export function buildObjectProfilePrompt(params: {
  object: LifeObject;
  memories: Memory[];
  notes: Note[];
  relatedObjectNames: string[];
  typeInstructions: string;
  knowledgeLines: string[];
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const { object } = params;

  return `你是一位 LifeOS 对象智能分析引擎。请基于真实数据，为以下对象生成 AI 画像。

${params.typeInstructions}

通用规则：
1. 只基于提供的真实材料，禁止编造；材料不足的字段返回空数组或空字符串。
2. importantEvents 按时间倒序，格式 "YYYY-MM 事件描述"。
3. 每个字段最多 5 条，每条简洁具体。
4. ${langHint}

对象信息：
名称：${object.name}
类型：${object.type}
${object.description ? `描述：${object.description}` : ""}
${object.aiProfile ? `已有 AI 画像：${JSON.stringify(object.aiProfile).slice(0, 800)}` : ""}
${params.relatedObjectNames.length > 0 ? `相关对象：${params.relatedObjectNames.join("、")}` : ""}

${params.knowledgeLines.length > 0 ? `已有知识：\n${params.knowledgeLines.join("\n")}\n` : ""}
相关记忆（按时间倒序）：
${formatMemories(params.memories, 20) || "（无）"}

相关笔记：
${formatNotes(params.notes, 15) || "（无）"}

请输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${PROFILE_SHAPE}`;
}

export function buildObjectProfileUpdatePrompt(params: {
  object: LifeObject;
  existingProfile: Record<string, unknown>;
  newMemories: Memory[];
  newNotes: Note[];
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  return `你是一位 LifeOS 对象智能分析引擎。以下是对象「${params.object.name}」的现有 AI 画像和最新材料。
请基于新材料【增量更新】画像：保留仍然成立的内容，更新过时的内容，补充新发现的认知。不要推翻全部重写。

现有画像：
${JSON.stringify(params.existingProfile, null, 2).slice(0, 3000)}

新增记忆：
${formatMemories(params.newMemories, 10) || "（无）"}

新增笔记：
${formatNotes(params.newNotes, 8) || "（无）"}

规则：
1. 只基于真实材料，禁止编造。
2. recentChanges 应反映新材料带来的变化。
3. ${langHint}

请输出 ONLY 一个合法的 JSON 对象，结构同现有画像（不含 confidence / lastUpdated）。`;
}
