import { Language } from "@/lib/i18n";
import { LifeObject } from "@/lib/types";
import { ObjectProfile } from "@/lib/object-intelligence/types";

/**
 * PERSON_ADVICE task prompt — Communication Assistant: situational
 * communication guidance grounded in the person profile + memories.
 */
export function buildPersonAdvicePrompt(params: {
  person: LifeObject;
  profile: ObjectProfile | null;
  situation: string;
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const profileText = params.profile
    ? `人物画像：${params.profile.summary}
特质：${params.profile.traits.join("、") || "未知"}
偏好：${params.profile.preferences.join("、") || "未知"}
关系状态：${params.profile.relationshipSummary ?? "未知"}
沟通风格建议：${params.profile.communicationStyle ?? "未知"}
需要注意：${params.profile.risk.join("；") || "无"}
AI 理解置信度：${Math.round(params.profile.confidence * 100)}%`
    : "（暂无画像数据，请诚实说明了解有限）";

  const shape = JSON.stringify(
    {
      understanding: "string: 对当前情境和对方状态的理解（1-2句）",
      advice: ["string: 具体沟通建议，按顺序"],
      warnings: ["string: 需要注意避免的点"],
      suggestedApproach: "string: 推荐的表达方式/开场",
      possibleReactions: ["string: 对方可能的反应及应对"],
    },
    null,
    2
  );

  return `你是用户的 LifeOS 沟通助手。用户即将与「${params.person.name}」沟通一件事，请基于人物画像与人生上下文给出沟通建议。

语气要求：
- 温暖、务实、具体，不说空话。
- 所有建议必须基于画像与上下文中的真实信息；了解有限时诚实说明。
- ${langHint}

${profileText}

用户将要面对的情境：
${params.situation}

请输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}`;
}
