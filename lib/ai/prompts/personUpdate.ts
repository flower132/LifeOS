import { Language } from "@/lib/i18n";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";
import { LifeObject, Note } from "@/lib/types";

function notesToContext(notes: Note[], limit = 20): string {
  if (notes.length === 0) return "（无历史笔记）";
  const sorted = [...notes].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const recent = sorted.slice(0, limit);
  return recent
    .map(
      (note, index) =>
        `[历史记录 ${index + 1}] ${new Date(
          note.created_at
        ).toLocaleDateString()}\n${note.content}`
    )
    .join("\n---\n");
}

function serializeCurrentState(object: LifeObject): string {
  const profile = object.aiProfile;
  const insights = object.aiInsights ?? [];
  const suggestions = object.aiSuggestions ?? [];
  const memories = object.memories ?? [];

  return `当前人物画像：
${profile ? JSON.stringify(profile, null, 2) : "（无）"}

当前洞察：
${insights.length > 0 ? insights.map((i) => `- [${i.category}] ${i.title}: ${i.description} (confidence: ${i.confidence})`).join("\n") : "（无）"}

当前建议：
${suggestions.length > 0 ? suggestions.map((s) => `- [${s.priority}] ${s.title}: ${s.description}`).join("\n") : "（无）"}

当前记忆：
${memories.length > 0 ? memories.map((m) => `- ${m.content}`).join("\n") : "（无）"}`;
}

export function buildPersonUpdatePrompt(
  object: LifeObject,
  existingNotes: Note[],
  newInput: AIAnalysisInput,
  language: Language
): string {
  const langHint =
    language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    newInput.images.length > 0
      ? `用户上传了 ${newInput.images.length} 张新图片。请结合图片与文本一起分析。`
      : "用户未上传新图片，仅分析新文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        nickname: "string or empty",
        age: "string or empty",
        occupation: "string or empty",
        city: "string or empty",
      },
      profile: {
        type: "person",
        relationshipContext: "string or empty",
        mbti: "string or empty",
        mbtiConfidence: 0,
        bigFive: {
          openness: 0,
          conscientiousness: 0,
          extraversion: 0,
          agreeableness: 0,
          emotionalStability: 0,
        },
        personalitySummary: "string",
        rollingSummary: "string: a concise, evolving summary of how to relate to this person",
      },
      insights: [
        {
          category: "string",
          title: "string",
          description: "string",
          confidence: 0,
          evidence: [{ quote: "", source: "" }],
        },
      ],
      suggestions: [
        { title: "string", description: "string", priority: "medium" },
      ],
      memories: [{ content: "string" }],
      confidence_score: 0.0,
      analysis_summary: "string",
    },
    null,
    2
  );

  return `你是一位专注于关系经营的 AI 助手。现在需要基于新增素材和已有档案，更新对这位人物的理解。

${serializeCurrentState(object)}

历史笔记：
${notesToContext(existingNotes)}

新增素材：
${newInput.textInput || "（未提供文本素材）"}

${imageHint}

请输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

更新要求：
1. 基础画像：基于全部信息更新姓名、昵称、年龄、职业、城市，无法确认时留空，禁止编造。
2. Relationship Context：根据你与这个人的关系角色更新（例如 leader, customer, friend, lover, family, mentor, colleague, subordinate）。如果不确定，保持当前值或留空。
3. Person AI Profile：基于全部信息更新 MBTI、置信度、Big Five、人格总结。不要简单复制旧值，要反映新增素材带来的变化。
4. Rolling Summary：更新关系经营摘要。用 2-4 句话总结：这个人是谁、你们的关系状态、当前最重要的相处原则。必须基于当前画像、洞察、建议和新增素材进行提炼，而不是简单复制旧值。
5. AI Insights：输出更新后的完整洞察列表。聚焦：沟通风格、合作偏好、决策方式、信任信号、相处风险、边界感。保留仍然成立的旧洞察，修改被新素材影响的洞察，新增新素材带来的洞察，删除已被证伪或不再相关的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。禁止输出纯粹的标签式描述。
6. AI Suggestions：输出更新后的完整建议列表。建议必须面向用户，回答“我应该做什么？”。基于最新状态生成新的相处/沟通建议，移除已经过时或已完成的建议。每个建议包含 title、description、priority（low/medium/high）。
7. Memories：只输出新增的、与现有记忆不重复的重要事件/观察。不要重复输出已有记忆。
8. confidence_score：整体置信度（0-1）。
9. analysis_summary：本次更新的摘要，重点说明新增素材如何改变了你对这个人以及你们关系的理解。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 保持客观，不做医疗或心理诊断。
- 所有洞察和建议必须服务于“我该如何与这个人建立和维护更好的关系”。
- ${langHint}`;
}
