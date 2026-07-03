import { v4 as uuidv4 } from "uuid";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { AIImageInput } from "@/lib/ai/types";
import { AIAnalysisInput } from "./types";
import { selectProviderForAnalysis } from "./fallback";
import { Language } from "@/lib/i18n";

export interface ExtractedObjectDraft {
  id: string;
  type: LifeObjectType;
  name: string;
  context: string;
  confidence: number;
}

export interface MultiObjectExtractionResult {
  objects: ExtractedObjectDraft[];
}

const VALID_TYPES: LifeObjectType[] = [...LIFE_OBJECT_TYPES];

function buildMultiObjectPrompt(input: AIAnalysisInput, language: Language): string {
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

function isValidType(value: string): value is LifeObjectType {
  return VALID_TYPES.includes(value as LifeObjectType);
}

function parseExtractionResult(raw: unknown): ExtractedObjectDraft[] {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  const objects = Array.isArray(data.objects) ? data.objects : [];

  return objects
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const type = typeof obj.type === "string" ? obj.type : "";
      const name = typeof obj.name === "string" ? obj.name.trim() : "";
      const context =
        typeof obj.context === "string"
          ? obj.context.trim()
          : name || "";
      const confidence =
        typeof obj.confidence === "number" ? Math.max(0, Math.min(1, obj.confidence)) : 0;

      if (!isValidType(type) || !name) return null;
      return {
        id: `extracted-${uuidv4()}`,
        type,
        name,
        context,
        confidence,
      };
    })
    .filter((item): item is ExtractedObjectDraft => item !== null);
}

function getMockExtractionResult(input: AIAnalysisInput): ExtractedObjectDraft[] {
  const text = input.textInput || "";
  const fallbackNames = ["王经理", "Amy", "雅思", "装修"];
  const hasAny = fallbackNames.some((n) => text.includes(n));

  if (!hasAny && input.images.length === 0) {
    return [];
  }

  return [
    { id: `mock-${uuidv4()}`, type: "person", name: "王经理", context: text.slice(0, 80), confidence: 0.8 },
    { id: `mock-${uuidv4()}`, type: "person", name: "Amy", context: text.slice(0, 80), confidence: 0.8 },
    { id: `mock-${uuidv4()}`, type: "goal", name: "雅思", context: text.slice(0, 80), confidence: 0.9 },
    { id: `mock-${uuidv4()}`, type: "project", name: "装修", context: text.slice(0, 80), confidence: 0.9 },
  ];
}

function buildOCRPrompt(language: Language): string {
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

function parseOCRResult(raw: unknown): ExtractedObjectDraft[] {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  const names = Array.isArray(data.names) ? data.names : [];

  return names
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const name = typeof obj.text === "string" ? obj.text.trim() : "";
      const typeGuess = typeof obj.typeGuess === "string" ? obj.typeGuess.trim() : "";
      const reason = typeof obj.reason === "string" ? obj.reason.trim() : "";

      if (!name) return null;
      const type: LifeObjectType = isValidType(typeGuess) ? typeGuess : "person";
      return {
        id: `ocr-${uuidv4()}`,
        type,
        name,
        context: reason || `OCR extracted: ${name}`,
        confidence: 0.7,
      };
    })
    .filter((item): item is ExtractedObjectDraft => item !== null);
}

function getMockOCRResult(): ExtractedObjectDraft[] {
  return [
    { id: `mock-ocr-${uuidv4()}`, type: "person", name: "张三", context: "OCR mock result", confidence: 0.8 },
    { id: `mock-ocr-${uuidv4()}`, type: "person", name: "李四", context: "OCR mock result", confidence: 0.8 },
    { id: `mock-ocr-${uuidv4()}`, type: "goal", name: "雅思", context: "OCR mock result", confidence: 0.9 },
  ];
}

export async function extractNamesFromImages(
  images: AIImageInput[],
  language: Language = "zh"
): Promise<MultiObjectExtractionResult> {
  if (images.length === 0) return { objects: [] };

  const selected = selectProviderForAnalysis();

  if (selected.isMock) {
    return { objects: getMockOCRResult() };
  }

  const prompt = buildOCRPrompt(language);
  const text = await selected.provider.generateStructuredObject({
    prompt,
    images,
    schemaHint: '{"names":[{"text":"string","typeGuess":"string","reason":"string"}]}',
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return { objects: [] };
  }

  return { objects: parseOCRResult(parsed) };
}

export async function extractObjectsFromInput(
  input: AIAnalysisInput,
  language: Language = "zh"
): Promise<MultiObjectExtractionResult> {
  const selected = selectProviderForAnalysis();

  if (selected.isMock) {
    return { objects: getMockExtractionResult(input) };
  }

  const prompt = buildMultiObjectPrompt(input, language);
  const text = await selected.provider.generateStructuredObject({
    prompt,
    images: input.images.length > 0 ? input.images : undefined,
    schemaHint:
      '{"objects":[{"type":"string","name":"string","context":"string","confidence":"number"}]}',
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw new Error("AI 返回了非法 JSON，无法解析多对象提取结果。");
  }

  return { objects: parseExtractionResult(parsed) };
}
