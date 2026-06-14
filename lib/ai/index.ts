import { LifeObject, Note, Relation } from "@/lib/types";
import { anthropicProvider } from "./anthropicProvider";
import { mockProvider } from "./mockProvider";
import { openaiProvider } from "./openaiProvider";
import {
  AIProvider,
  EventGoalInsight,
  PersonProfile,
  SelfState,
} from "./types";

function selectProvider(): AIProvider {
  if (process.env.ANTHROPIC_API_KEY) return anthropicProvider;
  if (process.env.OPENAI_API_KEY) return openaiProvider;
  return mockProvider;
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

  async generatePersonProfile(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string
  ): Promise<PersonProfile> {
    return this.provider.generatePersonProfile(
      object.name,
      object.description,
      notesToText(notes),
      relationsToText(object.id, relations, getObjectName)
    );
  }

  async generateSelfState(
    object: LifeObject,
    notes: Note[],
    relations: Relation[],
    getObjectName: (id: string) => string
  ): Promise<SelfState> {
    return this.provider.generateSelfState(
      object.name,
      object.description,
      notesToText(notes),
      relationsToText(object.id, relations, getObjectName)
    );
  }

  async generateEventInsight(
    object: LifeObject,
    notes: Note[]
  ): Promise<EventGoalInsight> {
    return this.provider.generateEventInsight(
      object.name,
      object.description,
      notesToText(notes)
    );
  }
}

export const aiService = new AIService();
export type { PersonProfile, SelfState, EventGoalInsight };
