import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";
import { Language } from "@/lib/i18n";

/**
 * EXTRACTION task prompts — multi-object extraction and OCR name spotting.
 */

const VALID_TYPES: LifeObjectType[] = [...LIFE_OBJECT_TYPES];

export function buildMultiObjectPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const typeList = VALID_TYPES.join(", ");

  const shape = JSON.stringify(
    {
      objects: [
        {
          type: `one of: ${typeList}`,
          name: "string: the display name of this object",
          context:
            "string: a short sentence or quote from the input that supports this object, used for further AI analysis",
          confidence: "number 0.0-1.0: how certain you are that this object is mentioned",
        },
      ],
    },
    null,
    2
  );

  return `你是一位个人生活数据结构助手。请仔细阅读用户提供的素材，识别其中明确提到的人、目标、项目、事件、想法、知识或自我相关对象。

输出要求：
- 只输出一个合法的 JSON 对象，严格匹配以下结构：
${shape}
- objects 数组中的每个对象必须有一个真实在素材中被提及的名字。
- type 必须是以下之一：${typeList}。
- 如果素材中没有明确提到某个对象，不要编造；可以让数组为空。
- 禁止输出任何 JSON 以外的内容。

分析规则：
1. 优先使用素材中的原词作为 name。
2. context 应简要说明为什么识别出这个对象（可引用原文片段）。
3. confidence 根据素材明确程度给出 0.0-1.0。
4. 对同一人或对象的多个称呼，只保留一个最正式的名称。

${langHint}
${imageHint}

用户素材：
${input.textInput || "（未提供文本素材）"}`;
}

export function buildOCRPrompt(language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const typeList = VALID_TYPES.join(", ");

  const shape = JSON.stringify(
    {
      names: [
        {
          text: "string: the exact name or phrase shown in the image",
          typeGuess: `one of: ${typeList} or empty if uncertain`,
          reason: "string: brief explanation of why this is a person/goal/project/etc.",
        },
      ],
    },
    null,
    2
  );

  return `你是一位 OCR 助手。请仔细阅读用户上传的图片，识别图片中出现的所有可能代表 LifeOS 对象的文字。

输出要求：
- 只输出一个合法的 JSON 对象，严格匹配以下结构：
${shape}
- names 数组中每一项代表一个识别到的对象候选。
- text 必须是图片中真实出现的文字，禁止编造。
- typeGuess 是以下类型之一：${typeList}；如果不确定，可留空字符串。
- 如果图片中没有可识别的对象名称，返回空数组。
- 如果 OCR 失败或图片无法识别，返回空数组，不要报错。

${langHint}`;
}
