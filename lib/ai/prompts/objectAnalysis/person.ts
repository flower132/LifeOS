import { Language } from "@/lib/i18n";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";

/** OBJECT_ANALYSIS task prompt — person profile. Pure prompt-string builder. */
export function buildPersonPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

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
        relationshipContext: "string or empty (e.g. leader, customer, friend, lover, family, mentor, colleague, subordinate)",
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

  return `你是一位专注于关系经营的 AI 助手。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取姓名、昵称、年龄、职业、城市，无法确认时留空，禁止编造。
2. Relationship Context：根据素材推断你与这个人的关系角色（例如 leader, customer, friend, lover, family, mentor, colleague, subordinate）。如果不确定，留空。
3. Person AI Profile：MBTI 及置信度、Big Five 五维分数（0-100）、人格总结、Rolling Summary。
4. Rolling Summary：一段简洁的、不断更新的关系经营摘要。用 2-4 句话总结：这个人是谁、你们的关系状态、当前最重要的相处原则。不要罗列事实，要提炼成可指导行动的摘要。
5. AI Insights：只输出与“如何与这个人相处”相关的洞察。聚焦：沟通风格、合作偏好、决策方式、信任信号、相处风险、边界感。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。禁止输出纯粹的标签式描述，例如“他很外向”。
6. AI Suggestions：必须是面向用户的行动建议，回答“我应该做什么？”。
7. Memories：从素材中提取的重要事件/观察记录，作为初始记忆。
8. confidence_score：整体置信度（0-1）。
9. analysis_summary：整体分析摘要，重点说明对关系经营的意义。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 保持客观，不做医疗或心理诊断。
- 所有洞察和建议必须服务于“我该如何与这个人建立和维护更好的关系”。
- ${langHint}
- ${imageHint}

原始素材：
${input.textInput || "（未提供文本素材）"}`;
}
