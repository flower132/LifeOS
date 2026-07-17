import { Language } from "@/lib/i18n";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";

/** OBJECT_ANALYSIS task prompt — self profile. Pure prompt-string builder. */
export function buildSelfPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        current_focus: "string or empty",
      },
      profile: {
        type: "self",
        strengths: ["string"],
        weaknesses: ["string"],
        growthAreas: ["string"],
        currentFocus: "string",
        understandingSummary: "string: a warm, synthesized understanding of who this person is and what they are going through",
        growthThemes: ["string: 3-5 long-term growth themes"],
        reflectionSeeds: ["string: future reflection prompts"],
        lifePattern: {
          repeatedTopics: ["string"],
          goalChanges: ["string"],
          emotionalTrend: "string or empty",
          relationshipChanges: ["string"],
          learningDirections: ["string"],
          valueEvolution: ["string"],
          updatedAt: "ISO date string",
        },
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

  return `你是一位自我认知与成长分析引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取名称（如用户昵称）、当前关注焦点，无法确认时留空，禁止编造。
2. Self AI Profile：
   - strengths / weaknesses / growthAreas / currentFocus
   - understandingSummary：用温暖、安静的语气，综合素材写出对“这个人当下是谁、正经历什么”的理解，禁止简单复述模板字段。
   - growthThemes：识别 3-5 个长期成长主题（如成长、创造、关系、学习、健康）。
   - reflectionSeeds：生成 3-5 个未来可以不断发展的 Reflection 主题。
   - lifePattern：从素材中提取重复关注的话题、目标变化、情绪趋势、关系变化、学习方向、价值观演变。
3. AI Insights：关于自我状态、情绪模式、习惯、价值观、目标一致性等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的成长/调整建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的关键事件/观察记录，作为初始记忆。
6. confidence_score：整体置信度（0-1）。
7. analysis_summary：整体分析摘要。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 如果某个推断只是你的理解，请明确说明“这可能只是我的一种理解”。
- 保持客观、谦逊、温暖，不做医疗或心理诊断。
- 禁止使用“你应该”。
- ${langHint}
- ${imageHint}

原始素材：
${input.textInput || "（未提供文本素材）"}`;
}
