import { LifeObject, Note, Relation } from "@/lib/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { anthropicProvider } from "./anthropicProvider";
import { mockProvider } from "./mockProvider";
import { openaiProvider } from "./openaiProvider";
import {
  AIProvider,
  EventGoalInsight,
  Language,
  PersonProfile,
  SelfState,
} from "./types";

function selectProvider(): AIProvider {
  const settings =
    typeof window !== "undefined" ? useSettingsStore.getState() : null;

  // Privacy mode always forces the local mock provider.
  if (settings?.aiPrivacyMode) {
    return mockProvider;
  }

  // Respect explicit user selection if an API key is available.
  if (settings?.aiProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return anthropicProvider;
  }
  if (settings?.aiProvider === "openai" && process.env.OPENAI_API_KEY) {
    return openaiProvider;
  }

  // Fall back to env-var based selection.
  if (process.env.ANTHROPIC_API_KEY) return anthropicProvider;
  if (process.env.OPENAI_API_KEY) return openaiProvider;
  return mockProvider;
}

function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return useSettingsStore.getState().language;
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

class AIService {
  private provider = selectProvider();

  private shouldRun(): boolean {
    if (typeof window === "undefined") return false;
    return useSettingsStore.getState().aiEnabled;
  }

  async generatePersonProfile(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string
  ): Promise<PersonProfile> {
    if (!this.shouldRun()) {
      return mockProvider.generatePersonProfile(
        object.name,
        object.description,
        "",
        "",
        getLanguage()
      );
    }
    return selectProvider().generatePersonProfile(
      object.name,
      object.description,
      notesToText(notes),
      relationsToText(object.id, relations, getObjectName),
      getLanguage()
    );
  }

  async generateSelfState(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string
  ): Promise<SelfState> {
    if (!this.shouldRun()) {
      return mockProvider.generateSelfState(
        object.name,
        object.description,
        "",
        "",
        getLanguage()
      );
    }
    return selectProvider().generateSelfState(
      object.name,
      object.description,
      notesToText(notes),
      relationsToText(object.id, relations, getObjectName),
      getLanguage()
    );
  }

  async generateEventInsight(
    object: LifeObject,
    notes: Note[]
  ): Promise<EventGoalInsight> {
    if (!this.shouldRun()) {
      return mockProvider.generateEventInsight(
        object.name,
        object.description,
        "",
        getLanguage()
      );
    }
    return selectProvider().generateEventInsight(
      object.name,
      object.description,
      notesToText(notes),
      getLanguage()
    );
  }
}

export const aiService = new AIService();
export type { PersonProfile, SelfState, EventGoalInsight };
