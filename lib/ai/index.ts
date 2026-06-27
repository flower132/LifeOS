import {
  AIAnalysisRunResult,
  AIErrorCode,
  AIProvider,
  AIProviderConfig,
  AITestResult,
  PersonInsight,
  SelfInsight,
  EventGoalInsight,
} from "./types";
import { useSettingsStore } from "@/stores/settingsStore";
import { registry } from "./registry";
import { propertiesToPromptContext } from "@/lib/objectProperties";
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
import { LifeObject, Note, Relation, LifeObjectType } from "@/lib/types";
import { Language } from "@/lib/i18n";
import {
  normalizeEventGoalInsight,
  normalizePersonInsight,
  normalizeSelfInsight,
} from "./normalize";

export { getAILogs, clearAILogs } from "./logs";
export type {
  AIAnalysisRunResult,
  AITestResult,
  AIInsightResult,
  PersonInsight,
  SelfInsight,
  EventGoalInsight,
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

function notesToText(notes: Note[]): string {
  return notes
    .map(
      (note, index) =>
        `Record ${index + 1} (${new Date(
          note.created_at
        ).toLocaleDateString()}):\n${note.content}`
    )
    .join("\n---\n");
}

function relationsToText(
  currentObjectId: string,
  relations: Relation[],
  getObjectName: (id: string) => string
): string {
  return relations
    .map((relation) => {
      const otherId =
        relation.source_object_id === currentObjectId
          ? relation.target_object_id
          : relation.source_object_id;
      const targetName = getObjectName(otherId);
      return `- ${relation.type} with ${targetName}${
        relation.strength !== undefined
          ? ` (strength ${Math.round(relation.strength * 100)}%)`
          : ""
      }${relation.note ? `: ${relation.note}` : ""}`;
    })
    .join("\n");
}

function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty response");
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    throw new Error(
      `JSON parse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

function buildPrompt(
  objectName: string,
  objectDescription: string | undefined,
  propertiesContext: string | undefined,
  notesText: string,
  relationsText: string | undefined,
  shape: string,
  language: Language
): string {
  const langHint =
    language === "zh"
      ? "Respond in Chinese (Simplified)."
      : "Respond in English.";

  return `You are a structured understanding engine for a personal life OS. Based ONLY on the user data provided, generate a JSON object matching this exact shape:
${shape}
Rules:
- Do not invent facts not present in the data.
- If data is insufficient, say so explicitly in fields.
- Keep each string concise (1-2 sentences).
- Prefer the structured Object Properties below over the free-form Description when they conflict.
- ${langHint}

Object name: ${objectName}
${propertiesContext ? `Object Properties:\n${propertiesContext}\n` : ""}Description: ${objectDescription || "None"}

Notes:
${notesText || "None"}
${relationsText !== undefined ? `\nRelations:\n${relationsText || "None"}` : ""}`;
}

async function runWithLogging(
  prompt: string,
  forceMock = false
): Promise<{
  text: string;
  durationMs: number;
  provider: AIProviderConfig["provider"];
  model: string;
}> {
  const start = performance.now();
  const selected = forceMock
    ? {
        provider: registry.create("mock", {
          provider: "mock",
          apiKey: "",
          baseUrl: "",
          model: "mock",
        }) as AIProvider,
        config: {
          provider: "mock" as const,
          apiKey: "",
          baseUrl: "",
          model: "mock",
        },
      }
    : {
        provider: registry.create(getCurrentConfig().provider, getCurrentConfig()),
        config: getCurrentConfig(),
      };

  try {
    const text = await selected.provider.generate(prompt);
    const durationMs = Math.round(performance.now() - start);
    return {
      text,
      durationMs,
      provider: selected.config.provider,
      model: selected.config.model,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    const { message, code } = formatErrorForUser(err, selected.config.baseUrl);
    addAILog({
      provider: selected.config.provider,
      model: selected.config.model,
      durationMs,
      status: "error",
      error: message,
      errorCode: code,
    });
    throw new Error(message);
  }
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
        await this.saveHistoryEntry(type, input, result);
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

  // ── Deprecated object-type-specific methods ───────────────────────────────
  // These methods are kept temporarily for backward compatibility with the
  // existing UI cards. They will be removed in Phase 2 once components switch
  // to the type-agnostic analyzeObject API.

  /** @deprecated Use analyzeObject with the person profile instead. */
  async generatePersonProfile(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string,
    options: { forceMock?: boolean } = {}
  ): Promise<import("./types").AIInsightResult<PersonInsight>> {
    if (!options.forceMock && !this.shouldRunLegacy()) {
      return {
        success: false,
        error: "AI is disabled",
        errorCode: "unknown",
        provider: "mock",
        model: "mock",
        durationMs: 0,
      };
    }

    const shape = JSON.stringify(
      {
        traits: ["string"],
        relationship_status: "string",
        notes: "string",
      },
      null,
      2
    );

    const prompt = buildPrompt(
      object.name,
      object.description,
      propertiesToPromptContext(object.type, object.properties),
      notesToText(notes),
      relationsToText(object.id, relations, getObjectName),
      shape,
      getLanguage()
    );

    const start = performance.now();
    const config = options.forceMock
      ? { provider: "mock" as const, apiKey: "", baseUrl: "", model: "mock" }
      : getCurrentConfig();

    try {
      const { text, durationMs } = await runWithLogging(prompt, options.forceMock);
      const parsed = parseJsonResponse(text);
      const data = normalizePersonInsight(parsed);
      return this.makeLegacyResult(data, config.provider, config.model, durationMs, options.forceMock);
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      return this.makeLegacyErrorResult(err, config.provider, config.model, config.baseUrl, durationMs);
    }
  }

  /** @deprecated Use analyzeObject with the self profile instead. */
  async generateSelfState(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string,
    options: { forceMock?: boolean } = {}
  ): Promise<import("./types").AIInsightResult<SelfInsight>> {
    if (!options.forceMock && !this.shouldRunLegacy()) {
      return {
        success: false,
        error: "AI is disabled",
        errorCode: "unknown",
        provider: "mock",
        model: "mock",
        durationMs: 0,
      };
    }

    const shape = JSON.stringify(
      {
        focus_areas: ["string"],
        strengths: ["string"],
        weaknesses: ["string"],
        summary: "string",
      },
      null,
      2
    );

    const prompt = buildPrompt(
      object.name,
      object.description,
      propertiesToPromptContext(object.type, object.properties),
      notesToText(notes),
      relationsToText(object.id, relations, getObjectName),
      shape,
      getLanguage()
    );

    const start = performance.now();
    const config = options.forceMock
      ? { provider: "mock" as const, apiKey: "", baseUrl: "", model: "mock" }
      : getCurrentConfig();

    try {
      const { text, durationMs } = await runWithLogging(prompt, options.forceMock);
      const parsed = parseJsonResponse(text);
      const data = normalizeSelfInsight(parsed);
      return this.makeLegacyResult(data, config.provider, config.model, durationMs, options.forceMock);
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      return this.makeLegacyErrorResult(err, config.provider, config.model, config.baseUrl, durationMs);
    }
  }

  /** @deprecated Use analyzeObject with the event/goal profile instead. */
  async generateEventInsight(
    object: LifeObject,
    notes: Note[],
    options: { forceMock?: boolean } = {}
  ): Promise<import("./types").AIInsightResult<EventGoalInsight>> {
    if (!options.forceMock && !this.shouldRunLegacy()) {
      return {
        success: false,
        error: "AI is disabled",
        errorCode: "unknown",
        provider: "mock",
        model: "mock",
        durationMs: 0,
      };
    }

    const shape = JSON.stringify(
      {
        summary: "string",
        progress_insight: "string",
        blockers: ["string"],
      },
      null,
      2
    );

    const prompt = buildPrompt(
      object.name,
      object.description,
      propertiesToPromptContext(object.type, object.properties),
      notesToText(notes),
      undefined,
      shape,
      getLanguage()
    );

    const start = performance.now();
    const config = options.forceMock
      ? { provider: "mock" as const, apiKey: "", baseUrl: "", model: "mock" }
      : getCurrentConfig();

    try {
      const { text, durationMs } = await runWithLogging(prompt, options.forceMock);
      const parsed = parseJsonResponse(text);
      const data = normalizeEventGoalInsight(parsed);
      return this.makeLegacyResult(data, config.provider, config.model, durationMs, options.forceMock);
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      return this.makeLegacyErrorResult(err, config.provider, config.model, config.baseUrl, durationMs);
    }
  }

  private shouldRunLegacy(): boolean {
    if (typeof window === "undefined") return false;
    return useSettingsStore.getState().aiEnabled;
  }

  private makeLegacyResult<T>(
    data: T,
    provider: AIProviderConfig["provider"],
    model: string,
    durationMs: number,
    fallback = false
  ): import("./types").AIInsightResult<T> {
    addAILog({
      provider,
      model,
      durationMs,
      status: "success",
    });
    return { success: true, data, provider, model, durationMs, fallback };
  }

  private makeLegacyErrorResult<T>(
    error: unknown,
    provider: AIProviderConfig["provider"],
    model: string,
    baseUrl: string,
    durationMs: number
  ): import("./types").AIInsightResult<T> {
    const { message, code } = formatErrorForUser(error, baseUrl);
    addAILog({
      provider,
      model,
      durationMs,
      status: "error",
      error: message,
      errorCode: code,
    });
    return {
      success: false,
      error: message,
      errorCode: code,
      provider,
      model,
      durationMs,
    };
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
  ): Promise<void> {
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

      await addAIAnalysisHistory(entry);
    } catch (err) {
      // History persistence is best-effort; never fail the analysis because of it.
      console.error("[AIService] Failed to save analysis history:", err);
    }
  }
}

export const aiService = new AIService();
