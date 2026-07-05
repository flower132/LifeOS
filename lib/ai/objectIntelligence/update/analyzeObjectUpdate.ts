import { Language } from "@/lib/i18n";
import { AIErrorCode } from "@/lib/ai/types";
import {
  LifeObject,
  LifeObjectType,
  Note,
} from "@/lib/types";
import { propertiesToPromptContext } from "@/lib/objectProperties";
import {
  objectIntelligenceEngine,
  selectProviderForAnalysis,
  shouldRunAnalysis,
} from "@/lib/ai/objectIntelligence";
import {
  AIAnalysisInput,
  AIAnalysisRunResult,
} from "@/lib/ai/objectIntelligence/types";
import {
  addAIAnalysisHistory,
  createAIAnalysisHistoryEntryInput,
} from "@/lib/ai/objectIntelligence/history";
import { useSettingsStore } from "@/stores/settingsStore";
import { mergeObjectAnalysis, MergeObjectAnalysisResult } from "./mergeObjectAnalysis";

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function getMockSelection() {
  return selectProviderForAnalysis({
    provider: "mock",
    apiKey: "",
    baseUrl: "",
    model: "mock",
  });
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function serializeCurrentObject(object: LifeObject): string {
  const parts = [
    `对象名称：${object.name}`,
    `对象类型：${object.type}`,
  ];

  if (object.description) {
    parts.push(`对象描述：${object.description}`);
  }

  const propertiesContext = propertiesToPromptContext(
    object.type,
    object.properties
  );
  if (propertiesContext) {
    parts.push(`对象属性：\n${propertiesContext}`);
  }

  if (object.aiProfile) {
    parts.push(`AI 画像：\n${JSON.stringify(object.aiProfile, null, 2)}`);
  }

  const insights = object.aiInsights ?? [];
  if (insights.length > 0) {
    parts.push(
      `当前洞察：\n${insights
        .map(
          (i) =>
            `- [${i.category}] ${i.title}: ${i.description} (confidence: ${i.confidence})`
        )
        .join("\n")}`
    );
  }

  const suggestions = object.aiSuggestions ?? [];
  if (suggestions.length > 0) {
    parts.push(
      `当前建议：\n${suggestions
        .map((s) => `- [${s.priority}] ${s.title}: ${s.description}`)
        .join("\n")}`
    );
  }

  const memories = object.memories ?? [];
  if (memories.length > 0) {
    parts.push(
      `当前记忆：\n${memories.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  return parts.join("\n\n");
}

function serializeNotes(notes: Note[], limit = 20): string {
  if (notes.length === 0) return "（无历史笔记）";
  const sorted = [...notes].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const recent = sorted.slice(0, limit);
  return recent
    .map(
      (note, index) =>
        `[历史记录 ${index + 1}] ${formatDate(note.created_at)}\n${note.content}`
    )
    .join("\n---\n");
}

function buildUpdateInput(
  object: LifeObject,
  existingNotes: Note[],
  newInput: AIAnalysisInput
): AIAnalysisInput {
  const contextText = `【当前对象状态】\n${serializeCurrentObject(object)}\n\n【历史笔记】\n${serializeNotes(
    existingNotes
  )}`;

  const newMaterialParts: string[] = [];
  if (newInput.textInput.trim()) {
    newMaterialParts.push(`【新增素材】\n${newInput.textInput}`);
  }
  if (newInput.images.length > 0) {
    newMaterialParts.push(`（新增素材包含 ${newInput.images.length} 张图片）`);
  }

  const textInput = [contextText, ...newMaterialParts].join("\n\n");

  return {
    textInput,
    images: newInput.images,
  };
}

export interface AnalyzeObjectUpdateRunResult {
  success: true;
  data: MergeObjectAnalysisResult;
  provider: string;
  model: string;
  durationMs: number;
  fallback: boolean;
  rawOutput: string;
}

export type AnalyzeObjectUpdateResult =
  | AnalyzeObjectUpdateRunResult
  | {
      success: false;
      error: string;
      errorCode?: AIErrorCode;
      provider: string;
      model: string;
      durationMs: number;
      fallback: boolean;
    };

export interface AnalyzeObjectUpdateOptions {
  forceMock?: boolean;
  language?: Language;
  saveHistory?: boolean;
}

export async function analyzeObjectUpdate(
  type: LifeObjectType,
  object: LifeObject,
  existingNotes: Note[],
  newInput: AIAnalysisInput,
  options: AnalyzeObjectUpdateOptions = {}
): Promise<AnalyzeObjectUpdateResult> {
  if (!options.forceMock && !shouldRunAnalysis()) {
    return {
      success: false,
      error: "AI is disabled",
      provider: "mock",
      model: "mock",
      durationMs: 0,
      fallback: false,
    };
  }

  const selected = options.forceMock
    ? getMockSelection()
    : selectProviderForAnalysis();

  const language = options.language ?? getLanguage();
  const input = buildUpdateInput(object, existingNotes, newInput);

  const start = performance.now();
  try {
    const runResult: AIAnalysisRunResult = await objectIntelligenceEngine.analyze(
      type,
      input,
      {
        provider: selected.provider,
        providerId: selected.providerId,
        model: selected.model,
        language,
      }
    );

    if (!runResult.success || !runResult.data) {
      return {
        success: false,
        error: runResult.error || "AI analysis failed",
        errorCode: runResult.errorCode,
        provider: runResult.provider,
        model: runResult.model,
        durationMs: runResult.durationMs,
        fallback: selected.isMock,
      };
    }

    const merged = mergeObjectAnalysis(object, runResult.data);

    if (options.saveHistory !== false) {
      try {
        const entry = createAIAnalysisHistoryEntryInput({
          objectType: type,
          rawTextInput: input.textInput,
          imageCount: input.images.length,
          imageThumbnails: input.images.map((img) => img.base64Data.slice(0, 120)),
          provider: runResult.provider,
          model: runResult.model,
          durationMs: runResult.durationMs,
          rawOutput: runResult.rawOutput || "",
          profileSnapshot: merged.mergedResult.profile,
          insightsSnapshot: merged.mergedResult.insights,
          suggestionsSnapshot: merged.mergedResult.suggestions,
          memoriesSnapshot: merged.mergedResult.memories,
        });
        await addAIAnalysisHistory(entry);
      } catch (historyErr) {
        console.error("[analyzeObjectUpdate] Failed to save history:", historyErr);
      }
    }

    const durationMs = Math.round(performance.now() - start);

    return {
      success: true,
      data: merged,
      provider: runResult.provider,
      model: runResult.model,
      durationMs,
      fallback: selected.isMock,
      rawOutput: runResult.rawOutput || "",
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      provider: selected.providerId,
      model: selected.model,
      durationMs,
      fallback: selected.isMock,
    };
  }
}
