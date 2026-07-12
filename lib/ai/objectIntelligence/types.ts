import { ComponentType } from "react";
import { z } from "zod";
import { Language } from "@/lib/i18n";
import {
  AIImageInput,
} from "@/lib/ai/types";
import {
  LifeObjectType,
  ObjectAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
  AIAnalysisHistoryEntry,
} from "@/lib/types";
import { AIAnalysisRunResult as GenericAIAnalysisRunResult } from "@/lib/ai/types";

export type {
  ObjectAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  AIAnalysisHistoryEntry,
};

/** Concrete analysis run result for the object intelligence engine. */
export type AIAnalysisRunResult = GenericAIAnalysisRunResult<AIAnalysisResult>;

export interface AIAnalysisInput {
  textInput: string;
  images: AIImageInput[];
}

export interface AIAnalysisResult {
  profile: ObjectAIProfile;
  insights: ObjectAIInsight[];
  suggestions: ObjectAISuggestion[];
  memories: ObjectMemory[];
  properties: ObjectProperties;
  confidenceScore: number;
  analysisSummary: string;
}

export interface AIProfileDefinition<T extends ObjectAIProfile = ObjectAIProfile> {
  type: LifeObjectType;
  name: string;
  description: string;
  profileSchema: z.ZodType<T>;
  buildPrompt: (input: AIAnalysisInput, language: Language) => string;
  mapProfile: (raw: unknown) => T | null;
  mapProperties?: (raw: unknown) => ObjectProperties;
  mapInsights?: (raw: unknown) => ObjectAIInsight[];
  mapSuggestions?: (raw: unknown) => ObjectAISuggestion[];
  mapMemories?: (raw: unknown) => ObjectMemory[];
  ProfileRenderer?: ComponentType<{ profile: T; onChange: (profile: T) => void }>;
  /** Read-only view of the profile used in object detail tabs. */
  ProfileReader?: ComponentType<{ profile: T }>;
}

export interface ProfileRegistry {
  get: <T extends ObjectAIProfile = ObjectAIProfile>(
    type: LifeObjectType
  ) => AIProfileDefinition<T> | undefined;
  register: <T extends ObjectAIProfile = ObjectAIProfile>(
    definition: AIProfileDefinition<T>
  ) => void;
  has: (type: LifeObjectType) => boolean;
  list: () => AIProfileDefinition[];
}
