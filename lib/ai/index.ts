import { LifeObject, Note, Relation } from "@/lib/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { registry } from "./registry";
import {
  AIProvider,
  AIProviderConfig,
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

function selectProvider(): AIProvider {
  const settings =
    typeof window !== "undefined" ? useSettingsStore.getState() : null;

  // Privacy mode or disabled AI always falls back to mock.
  if (!settings || settings.aiPrivacyMode || !settings.aiEnabled) {
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

function safeJsonParse(text: string): unknown {
  const cleaned = text
    .replace(/^[\s\S]*?(\{)/, "$1")
    .replace(/(\})[\s\S]*$/, "$1");
  return JSON.parse(cleaned);
}

function buildPrompt(
  objectName: string,
  objectDescription: string | undefined,
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
- ${langHint}

Object name: ${objectName}
Description: ${objectDescription || "None"}

Notes:
${notesText || "None"}
${relationsText !== undefined ? `\nRelations:\n${relationsText || "None"}` : ""}`;
}

class AIService {
  private provider = selectProvider();

  private shouldRun(): boolean {
    if (typeof window === "undefined") return false;
    const state = useSettingsStore.getState();
    return state.aiEnabled;
  }

  private async generate(prompt: string): Promise<string> {
    const provider = selectProvider();
    return provider.generate(prompt);
  }

  async generatePersonProfile(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string
  ): Promise<PersonInsight> {
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
      notesToText(notes),
      relationsToText(object.id, relations, getObjectName),
      shape,
      getLanguage()
    );

    const text = await this.generate(prompt);
    return normalizePersonInsight(safeJsonParse(text));
  }

  async generateSelfState(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string
  ): Promise<SelfInsight> {
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
      notesToText(notes),
      relationsToText(object.id, relations, getObjectName),
      shape,
      getLanguage()
    );

    const text = await this.generate(prompt);
    return normalizeSelfInsight(safeJsonParse(text));
  }

  async generateEventInsight(
    object: LifeObject,
    notes: Note[]
  ): Promise<EventGoalInsight> {
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
      notesToText(notes),
      undefined,
      shape,
      getLanguage()
    );

    const text = await this.generate(prompt);
    return normalizeEventGoalInsight(safeJsonParse(text));
  }
}

export const aiService = new AIService();
export type { PersonInsight, SelfInsight, EventGoalInsight };
