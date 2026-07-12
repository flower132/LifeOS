import {
  AIAnalysisRunResult,
  AIErrorCode,
  AIProviderConfig,
  AITestResult,
} from "./types";
import { useSettingsStore } from "@/stores/settingsStore";
import { registry } from "./registry";
import {
  addAILog,
  detectMixedContent,
  formatErrorForUser,
} from "./logs";
import {
  objectIntelligenceEngine,
  selectProviderForAnalysis,
  shouldRunAnalysis,
} from "./objectIntelligence";
import {
  AIAnalysisInput,
  AIAnalysisResult,
} from "./objectIntelligence/types";
import {
  addAIAnalysisHistory,
  createAIAnalysisHistoryEntryInput,
} from "./objectIntelligence/history";
import { LifeObjectType } from "@/lib/types";
import { Language } from "@/lib/i18n";

export { getAILogs, clearAILogs } from "./logs";
export type {
  AIAnalysisRunResult,
  AITestResult,
  AIInsightResult,
} from "./types";

function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return useSettingsStore.getState().language;
}

function getCurrentConfig(): AIProviderConfig {
  if (typeof window === "undefined") {
    return { provider: "mock", apiKey: "", baseUrl: "", model: "" };
  }
  const state = useSettingsStore.getState();
  return {
    provider: state.aiProvider,
    apiKey: state.aiApiKey,
    baseUrl: state.aiBaseUrl,
    model: state.aiModel,
  };
}

/**
 * High-level AI service facade.
 *
 * AIService is responsible for:
 *   - Provider selection and fallback handling.
 *   - Invoking the type-agnostic ObjectIntelligenceEngine.
 *   - Logging successes and failures.
 *   - Persisting analysis history through the StorageAdapter.
 *
 * It is the only AI layer module that coordinates side effects; the engine
 * itself remains pure and provider/storage/UI agnostic.
 */
class AIService {
  async testConnection(): Promise<AITestResult> {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Cannot test connection during server rendering",
        errorCode: "unknown",
        provider: "mock",
        model: "",
        durationMs: 0,
      };
    }

    const config = getCurrentConfig();

    if (config.provider === "mock") {
      return {
        success: true,
        message: "Mock provider is active",
        provider: "mock",
        model: "mock",
        durationMs: 0,
      };
    }

    if (!config.apiKey) {
      return {
        success: false,
        error: "API Key is not set",
        errorCode: "invalid_key",
        provider: config.provider,
        model: config.model,
        durationMs: 0,
      };
    }

    if (detectMixedContent(config.baseUrl)) {
      return {
        success: false,
        error:
          "Mixed Content Error: this page is HTTPS but the AI API uses HTTP. Use an HTTPS API endpoint or run locally.",
        errorCode: "mixed_content",
        provider: config.provider,
        model: config.model,
        durationMs: 0,
      };
    }

    const start = performance.now();
    try {
      const provider = registry.create(config.provider, config);
      const text = await provider.generate("Reply OK");
      const durationMs = Math.round(performance.now() - start);
      const normalized = text.trim().toLowerCase();
      const success = normalized.includes("ok");

      addAILog({
        provider: config.provider,
        model: config.model,
        durationMs,
        status: success ? "success" : "error",
        error: success ? undefined : "Unexpected response",
      });

      if (!success) {
        return {
          success: false,
          error: `Unexpected response: ${text.slice(0, 200)}`,
          errorCode: "unknown",
          provider: config.provider,
          model: config.model,
          durationMs,
        };
      }

      return {
        success: true,
        message: "Connection successful",
        provider: config.provider,
        model: config.model,
        durationMs,
      };
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      const { message, code } = formatErrorForUser(err, config.baseUrl);
      addAILog({
        provider: config.provider,
        model: config.model,
        durationMs,
        status: "error",
        error: message,
        errorCode: code,
      });
      return {
        success: false,
        error: message,
        errorCode: code,
        provider: config.provider,
        model: config.model,
        durationMs,
      };
    }
  }

  /**
   * Analyze raw input for any supported LifeObject type.
   *
   * @param type - Object type to analyze (e.g. "person", "goal").
   * @param input - Text and optional images.
   * @param options - `forceMock` skips enabled checks; `saveHistory` controls
   *                  whether a history entry is persisted (default true).
   */
  async analyzeObject(
    type: LifeObjectType,
    input: AIAnalysisInput,
    options: { forceMock?: boolean; saveHistory?: boolean } = {}
  ): Promise<AIAnalysisRunResult<AIAnalysisResult>> {
    if (!options.forceMock && !shouldRunAnalysis()) {
      return {
        success: false,
        error: "AI is disabled",
        errorCode: "unknown" as AIErrorCode,
        provider: "mock",
        model: "mock",
        durationMs: 0,
        fallback: false,
      };
    }

    const selected = options.forceMock
      ? this.createMockSelection()
      : selectProviderForAnalysis();

    const result = await objectIntelligenceEngine.analyze(type, input, {
      provider: selected.provider,
      providerId: selected.providerId,
      model: selected.model,
      language: getLanguage(),
    });

    if (result.success) {
      addAILog({
        provider: result.provider,
        model: result.model,
        durationMs: result.durationMs,
        status: "success",
      });

      if (options.saveHistory !== false) {
        const historyEntryId = await this.saveHistoryEntry(type, input, result);
        if (historyEntryId) {
          (result as AIAnalysisRunResult<AIAnalysisResult>).historyEntryId = historyEntryId;
        }
      }
    } else {
      addAILog({
        provider: result.provider,
        model: result.model,
        durationMs: result.durationMs,
        status: "error",
        error: result.error,
        errorCode: result.errorCode,
      });
    }

    return result;
  }

  private createMockSelection() {
    const mockConfig: AIProviderConfig = {
      provider: "mock",
      apiKey: "",
      baseUrl: "",
      model: "mock",
    };
    return {
      provider: registry.create("mock", mockConfig),
      providerId: "mock" as const,
      model: "mock",
      isMock: true,
    };
  }

  private async saveHistoryEntry(
    type: LifeObjectType,
    input: AIAnalysisInput,
    result: AIAnalysisRunResult
  ): Promise<string | undefined> {
    try {
      const data = result.data as AIAnalysisResult | undefined;
      const entry = createAIAnalysisHistoryEntryInput({
        objectType: type,
        rawTextInput: input.textInput,
        imageCount: input.images.length,
        imageThumbnails: input.images.map((img) => img.base64Data.slice(0, 120)),
        provider: result.provider,
        model: result.model,
        durationMs: result.durationMs,
        rawOutput: result.rawOutput || "",
        profileSnapshot: data?.profile,
        insightsSnapshot: data?.insights,
        suggestionsSnapshot: data?.suggestions,
        memoriesSnapshot: data?.memories,
      });

      const saved = await addAIAnalysisHistory(entry);
      return saved.id;
    } catch (err) {
      // History persistence is best-effort; never fail the analysis because of it.
      console.error("[AIService] Failed to save analysis history:", err);
      return undefined;
    }
  }
}

export const aiService = new AIService();
