import { LifeObject, Note, Relation } from "@/lib/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { propertiesToPromptContext } from "@/lib/objectProperties";
import { registry } from "./registry";
import {
  AIInsightResult,
  AIProvider,
  AIProviderConfig,
  AITestResult,
  EventGoalInsight,
  Language,
  PersonInsight,
  SelfInsight,
} from "./types";
import {
  normalizeEventGoalInsight,
  normalizePersonInsight,
  normalizeSelfInsight,
} from "./normalize";
import {
  addAILog,
  detectMixedContent,
  formatErrorForUser,
} from "./logs";

export { getAILogs, clearAILogs } from "./logs";
export type { AIInsightResult, AITestResult } from "./types";

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

function selectProvider(forceMock = false): AIProvider {
  const settings =
    typeof window !== "undefined" ? useSettingsStore.getState() : null;

  if (!settings || forceMock || settings.aiPrivacyMode || !settings.aiEnabled) {
    return registry.create("mock", {
      provider: "mock",
      apiKey: "",
      baseUrl: "",
      model: "",
    });
  }

  const config = getCurrentConfig();
  return registry.create(config.provider, config);
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
): Promise<{ text: string; durationMs: number; provider: AIProviderConfig["provider"]; model: string }> {
  const start = performance.now();
  const provider = selectProvider(forceMock);
  const config = forceMock
    ? { provider: "mock" as const, apiKey: "", baseUrl: "", model: "mock" }
    : getCurrentConfig();

  try {
    const text = await provider.generate(prompt);
    const durationMs = Math.round(performance.now() - start);
    return { text, durationMs, provider: config.provider, model: config.model };
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
    throw new Error(message);
  }
}

class AIService {
  private shouldRun(): boolean {
    if (typeof window === "undefined") return false;
    const state = useSettingsStore.getState();
    return state.aiEnabled;
  }

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

  private async generate(
    prompt: string,
    forceMock = false
  ): Promise<{ text: string; durationMs: number; provider: AIProviderConfig["provider"]; model: string }> {
    return runWithLogging(prompt, forceMock);
  }

  private makeResult<T>(
    data: T,
    provider: AIProviderConfig["provider"],
    model: string,
    durationMs: number,
    fallback = false
  ): AIInsightResult<T> {
    addAILog({
      provider,
      model,
      durationMs,
      status: "success",
    });
    return { success: true, data, provider, model, durationMs, fallback };
  }

  private makeErrorResult<T>(
    error: unknown,
    provider: AIProviderConfig["provider"],
    model: string,
    baseUrl: string,
    durationMs: number
  ): AIInsightResult<T> {
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

  async generatePersonProfile(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string,
    options: { forceMock?: boolean } = {}
  ): Promise<AIInsightResult<PersonInsight>> {
    if (!options.forceMock && !this.shouldRun()) {
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
      const { text, durationMs } = await this.generate(prompt, options.forceMock);
      const parsed = parseJsonResponse(text);
      const data = normalizePersonInsight(parsed);
      return this.makeResult(data, config.provider, config.model, durationMs, options.forceMock);
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      return this.makeErrorResult(err, config.provider, config.model, config.baseUrl, durationMs);
    }
  }

  async generateSelfState(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string,
    options: { forceMock?: boolean } = {}
  ): Promise<AIInsightResult<SelfInsight>> {
    if (!options.forceMock && !this.shouldRun()) {
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
      const { text, durationMs } = await this.generate(prompt, options.forceMock);
      const parsed = parseJsonResponse(text);
      const data = normalizeSelfInsight(parsed);
      return this.makeResult(data, config.provider, config.model, durationMs, options.forceMock);
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      return this.makeErrorResult(err, config.provider, config.model, config.baseUrl, durationMs);
    }
  }

  async generateEventInsight(
    object: LifeObject,
    notes: Note[],
    options: { forceMock?: boolean } = {}
  ): Promise<AIInsightResult<EventGoalInsight>> {
    if (!options.forceMock && !this.shouldRun()) {
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
      const { text, durationMs } = await this.generate(prompt, options.forceMock);
      const parsed = parseJsonResponse(text);
      const data = normalizeEventGoalInsight(parsed);
      return this.makeResult(data, config.provider, config.model, durationMs, options.forceMock);
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      return this.makeErrorResult(err, config.provider, config.model, config.baseUrl, durationMs);
    }
  }
}

export const aiService = new AIService();
export type { PersonInsight, SelfInsight, EventGoalInsight };
