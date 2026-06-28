import { Language } from "@/lib/i18n";
import { LifeObject, Note } from "@/lib/types";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";
import { mapObjectAnalysisResult } from "@/lib/ai/objectIntelligence/mapper";
import {
  selectProviderForAnalysis,
  shouldRunAnalysis,
} from "@/lib/ai/objectIntelligence/fallback";
import { buildPersonUpdatePrompt } from "./buildPersonUpdatePrompt";
import { mergePersonAnalysis, MergePersonAnalysisResult } from "./mergePersonAnalysis";

export interface AnalyzePersonUpdateOptions {
  forceMock?: boolean;
  language: Language;
}

export interface AnalyzePersonUpdateRunResult {
  success: true;
  data: MergePersonAnalysisResult;
  provider: string;
  model: string;
  durationMs: number;
  fallback: boolean;
  rawOutput: string;
}

export type AnalyzePersonUpdateResult =
  | AnalyzePersonUpdateRunResult
  | {
      success: false;
      error: string;
      errorCode?: string;
      provider: string;
      model: string;
      durationMs: number;
      fallback: boolean;
    };

function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty response from AI provider");
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    throw new Error(
      `JSON parse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function analyzePersonUpdate(
  object: LifeObject,
  existingNotes: Note[],
  newInput: AIAnalysisInput,
  options: AnalyzePersonUpdateOptions
): Promise<AnalyzePersonUpdateResult> {
  if (object.type !== "person") {
    return {
      success: false,
      error: "analyzePersonUpdate only supports person objects",
      provider: "mock",
      model: "mock",
      durationMs: 0,
      fallback: false,
    };
  }

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

  const start = performance.now();

  try {
    const selected = selectProviderForAnalysis();

    const prompt = buildPersonUpdatePrompt(
      object,
      existingNotes,
      newInput,
      options.language
    );

    const text = await selected.provider.generateStructuredObject({
      prompt,
      images: newInput.images.length > 0 ? newInput.images : undefined,
      objectType: "person",
    });

    const parsed = parseJsonResponse(text);
    const data = mapObjectAnalysisResult("person", parsed);

    if (!data) {
      throw new Error(
        "AI output could not be mapped to a valid person analysis result."
      );
    }

    const merged = mergePersonAnalysis(object, data);
    const durationMs = Math.round(performance.now() - start);

    return {
      success: true,
      data: merged,
      provider: selected.providerId,
      model: selected.model,
      durationMs,
      fallback: selected.isMock,
      rawOutput: text,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      provider: "mock",
      model: "mock",
      durationMs,
      fallback: false,
    };
  }
}
