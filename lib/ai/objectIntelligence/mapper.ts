import { v4 as uuidv4 } from "uuid";
import { Language } from "@/lib/i18n";
import {
  LifeObjectType,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { aiProfileRegistry } from "./profiles";
import { AIAnalysisInput, AIAnalysisResult } from "./types";

export interface ObjectAnalysisMapperContext {
  type: LifeObjectType;
  input: AIAnalysisInput;
  rawOutput: unknown;
  language: Language;
}

function generateInsightId(): string {
  return `ai-insight-${uuidv4()}`;
}

function generateSuggestionId(): string {
  return `ai-suggestion-${uuidv4()}`;
}

function generateMemoryId(): string {
  return `ai-memory-${uuidv4()}`;
}

export function mapObjectAnalysisResult(
  type: LifeObjectType,
  rawOutput: unknown
): AIAnalysisResult | null {
  const profileDef = aiProfileRegistry.get(type);
  if (!profileDef) return null;

  const profile = profileDef.mapProfile(rawOutput);
  if (!profile) return null;

  const properties = profileDef.mapProperties?.(rawOutput) ?? {};
  const insights = profileDef.mapInsights?.(rawOutput) ?? [];
  const suggestions = profileDef.mapSuggestions?.(rawOutput) ?? [];
  const memories = profileDef.mapMemories?.(rawOutput) ?? [];

  const now = new Date().toISOString();

  const normalizedInsights: ObjectAIInsight[] = insights.map((insight) => ({
    ...insight,
    id: insight.id || generateInsightId(),
    createdAt: insight.createdAt || now,
  }));

  const normalizedSuggestions: ObjectAISuggestion[] = suggestions.map((suggestion) => ({
    ...suggestion,
    id: suggestion.id || generateSuggestionId(),
    status: suggestion.status || "active",
    generatedAt: suggestion.generatedAt || now,
  }));

  const normalizedMemories: ObjectMemory[] = memories.map((memory) => ({
    ...memory,
    id: memory.id || generateMemoryId(),
    createdAt: memory.createdAt || now,
  }));

  const raw = rawOutput as Record<string, unknown> | undefined;
  const confidenceScore =
    typeof raw?.confidence_score === "number" ? raw.confidence_score : 0;
  const analysisSummary =
    typeof raw?.analysis_summary === "string" ? raw.analysis_summary : "";

  return {
    profile,
    insights: normalizedInsights,
    suggestions: normalizedSuggestions,
    memories: normalizedMemories,
    properties,
    confidenceScore,
    analysisSummary,
  };
}

export function getObjectDisplayName(
  type: LifeObjectType,
  properties: ObjectProperties
): string {
  return (
    (properties.name as string) ||
    (properties.title as string) ||
    `New ${type.charAt(0).toUpperCase() + type.slice(1)}`
  );
}
