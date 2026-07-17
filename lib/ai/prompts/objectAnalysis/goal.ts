import { Language } from "@/lib/i18n";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";

/** OBJECT_ANALYSIS task prompt — goal profile. Pure prompt-string builder. */
export function buildGoalPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        target_date: "string or empty",
        priority: "string or empty",
        status: "string or empty",
      },
      profile: {
        type: "goal",
        difficulty: 5,
        successProbability: 0,
        requiredResources: ["string"],
        estimatedDuration: "string",
        motivationType: "intrinsic | extrinsic | mixed",
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

  return `你是一位目标规划智能分析引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取目标名称、目标日期、优先级、当前状态，无法确认时留空，禁止编造。
2. Goal AI Profile：
   - difficulty：目标难度，1-10，10 为极难。
   - successProbability：当前状态下达成概率 0-100。
   - requiredResources：达成目标所需的资源列表（时间、金钱、人脉、技能等）。
   - estimatedDuration：预计完成周期，如 "3 个月"、"1 年"。
   - motivationType：动机类型，intrinsic（内在）/ extrinsic（外在）/ mixed（混合）。
3. AI Insights：关于目标可行性、范围、风险、拆分建议、动机、障碍等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的行动建议，包含 title、description、priority（low/medium/high）。
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
