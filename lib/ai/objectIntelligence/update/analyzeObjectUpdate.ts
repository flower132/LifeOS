import { Language } from "@/lib/i18n";
import { AIErrorCode } from "@/lib/ai/types";
import {
  LifeObject,
  LifeObjectType,
  Note,
} from "@/lib/types";
import {
  objectIntelligenceEngine,
  selectProviderForTask,
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
import { buildUpdateInput } from "@/lib/ai/prompts/objectUpdate";
import { useSettingsStore } from "@/stores/settingsStore";
import { mergeObjectAnalysis, MergeObjectAnalysisResult } from "./mergeObjectAnalysis";

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
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

  const selected = selectProviderForTask("OBJECT_UPDATE", {
    forceMock: options.forceMock,
  });

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
