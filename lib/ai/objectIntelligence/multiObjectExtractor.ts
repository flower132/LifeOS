import { v4 as uuidv4 } from "uuid";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { AIImageInput } from "@/lib/ai/types";
import { AIAnalysisInput } from "./types";
import { selectProviderForTask } from "./fallback";
import { buildMultiObjectPrompt, buildOCRPrompt } from "@/lib/ai/prompts/extraction";
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

  const selected = selectProviderForTask("EXTRACTION");

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
  const selected = selectProviderForTask("EXTRACTION");

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
