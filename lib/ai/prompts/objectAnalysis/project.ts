import { Language } from "@/lib/i18n";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";

/** OBJECT_ANALYSIS task prompt — project profile. Pure prompt-string builder. */
export function buildProjectPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        timeline: "string or empty",
        status: "string or empty",
      },
      profile: {
        type: "project",
        complexity: 5,
        riskLevel: "low | medium | high",
        timelineEstimate: "string",
        keyStakeholders: ["string"],
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

  return `你是一位项目分析智能引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取项目名称、时间线、当前状态，无法确认时留空，禁止编造。
2. Project AI Profile：复杂度（1-10）、风险等级（low/medium/high）、预计周期、关键利益方。
3. AI Insights：关于项目范围、风险、资源、关键路径、依赖、决策等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的项目管理建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的关键事件/约束/背景，作为初始记忆。
6. confidence_score：整体置信度（0-1）。
7. analysis_summary：整体分析摘要。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 保持客观，不做过度承诺。
- ${langHint}
- ${imageHint}

原始素材：
${input.textInput || "（未提供文本素材）"}`;
}
