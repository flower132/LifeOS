import {
  AIGenerateOptions,
  AIImageInput,
  AIAnalysisRunResult,
  AIErrorCode,
  AIClientError,
  AITask,
  AITestResult,
} from "./types";
import { useSettingsStore } from "@/stores/settingsStore";
import { addAILog, classifyError } from "./logs";
import { postAI } from "./serverProxy";
import type { ServerTaskProvider } from "./serverProxy";
import {
  objectIntelligenceEngine,
  selectProviderForTask,
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
export { postAI, createServerTaskProvider } from "./serverProxy";
export type { AIResponseMeta, ServerTaskProvider } from "./serverProxy";
export type {
  AIAnalysisRunResult,
  AITestResult,
  AIInsightResult,
} from "./types";
export type { AITask, AIServerResponse, AIServerRequest } from "./types";
export { AIClientError, AITASKS, isAITask } from "./types";

function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return useSettingsStore.getState().language;
}

// ---------------------------------------------------------------------------
// ai — the unified client facade. The ONLY AI entry point for business code:
//
//   await ai.generate({ task: "TODAY_FOCUS", prompt, options })
//
// Business code never names a provider or model. Everything routes through
// POST /api/ai → router → provider → model.
// ---------------------------------------------------------------------------

export interface AIGenerateRequest {
  task: AITask;
  prompt: string;
  images?: AIImageInput[];
  options?: AIGenerateOptions;
}

export interface AIChatRequest {
  task: AITask;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  options?: AIGenerateOptions;
}

export const ai = {
  /** Single-turn generation through the unified server route. */
  async generate(request: AIGenerateRequest) {
    return postAI({
      task: request.task,
      prompt: request.prompt,
      images: request.images,
      options: request.options,
    });
  },

  /**
   * Multi-turn chat. The current server route accepts a single prompt, so
   * messages are flattened into one conversation transcript; native
   * multi-turn arrives with the chat-capable providers.
   */
  async chat(request: AIChatRequest) {
    const prompt = request.messages
      .map((m) => {
        if (m.role === "system") return `[System]\n${m.content}`;
        if (m.role === "assistant") return `[Assistant]\n${m.content}`;
        return `[User]\n${m.content}`;
      })
      .join("\n\n");
    return postAI({ task: request.task, prompt, options: request.options });
  },

  /** Streaming — reserved. */
  async stream(): Promise<never> {
    throw new AIClientError("not_supported", "Not Supported");
  },

  /** Verify the server-side AI configuration end to end. */
  testConnection(): Promise<AITestResult> {
    return aiService.testConnection();
  },
};

/**
 * High-level AI service facade.
 *
 * AIService is responsible for:
 *   - Delegating generation to the unified /api/ai route (or mock locally).
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
        provider: "server",
        model: "",
        durationMs: 0,
      };
    }

    const state = useSettingsStore.getState();
    if (!state.aiEnabled || state.aiPrivacyMode) {
      return {
        success: true,
        message: "Mock provider is active",
        provider: "mock",
        model: "mock",
        durationMs: 0,
      };
    }

    const start = performance.now();
    try {
      const { content, meta } = await postAI({ task: "HEALTH_CHECK" });
      const durationMs = Math.round(performance.now() - start);
      const normalized = content.trim().toLowerCase();
      const success = normalized.includes("ok");

      if (!success) {
        return {
          success: false,
          error: `Unexpected response: ${content.slice(0, 200)}`,
          errorCode: "unknown",
          provider: meta.provider,
          model: meta.model,
          durationMs,
        };
      }

      return {
        success: true,
        message: "Connection successful",
        provider: meta.provider,
        model: meta.model,
        durationMs,
      };
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      const { message, code } =
        err instanceof AIClientError
          ? { message: err.message, code: err.code }
          : classifyError(err);
      return {
        success: false,
        error: message,
        errorCode: code,
        provider: err instanceof AIClientError ? (err.provider ?? "server") : "server",
        model: err instanceof AIClientError ? (err.model ?? "") : "",
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

    const selected = selectProviderForTask("OBJECT_ANALYSIS", {
      forceMock: options.forceMock,
    });

    const result = await objectIntelligenceEngine.analyze(type, input, {
      provider: selected.provider,
      providerId: selected.providerId,
      model: selected.model,
      language: getLanguage(),
    });

    // Stamp real provider/model from the server response when available.
    if (!selected.isMock) {
      const meta = (selected.provider as ServerTaskProvider).lastMeta;
      if (meta) {
        result.provider = meta.provider as typeof result.provider;
        result.model = meta.model;
      }
    }

    // Server calls are already logged by the /api/ai client proxy; only mock
    // runs (fully local, zero network) need a log entry here.
    if (selected.isMock) {
      if (result.success) {
        addAILog({
          provider: result.provider,
          model: result.model,
          durationMs: result.durationMs,
          status: "success",
        });
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
    }

    if (result.success) {
      if (options.saveHistory !== false) {
        const historyEntryId = await this.saveHistoryEntry(type, input, result);
        if (historyEntryId) {
          (result as AIAnalysisRunResult<AIAnalysisResult>).historyEntryId = historyEntryId;
        }
      }
    }

    return result;
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
