import {
  LifeObject,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectAIProfile,
} from "@/lib/types";
import { AIAnalysisResult } from "../types";

export interface MergeObjectAnalysisResult {
  mergedObject: Partial<LifeObject>;
  mergedResult: AIAnalysisResult;
}

function insightKey(insight: ObjectAIInsight): string {
  return `${insight.category.trim().toLowerCase()}::${insight.title.trim().toLowerCase()}`;
}

function mergeInsights(
  current: ObjectAIInsight[] | undefined,
  incoming: ObjectAIInsight[] | undefined
): ObjectAIInsight[] {
  const base = current ?? [];
  const added = incoming ?? [];
  const map = new Map<string, ObjectAIInsight>();

  for (const insight of base) {
    map.set(insightKey(insight), insight);
  }

  for (const insight of added) {
    const key = insightKey(insight);
    const existing = map.get(key);
    if (existing) {
      const existingEvidenceQuotes = new Set(existing.evidence.map((e) => e.quote));
      const mergedEvidence = [
        ...existing.evidence,
        ...insight.evidence.filter((e) => !existingEvidenceQuotes.has(e.quote)),
      ];
      map.set(key, {
        ...insight,
        id: existing.id,
        evidence: mergedEvidence,
        createdAt: existing.createdAt,
      });
    } else {
      map.set(key, insight);
    }
  }

  return Array.from(map.values());
}

function suggestionKey(suggestion: ObjectAISuggestion): string {
  return `${suggestion.title.trim().toLowerCase()}::${suggestion.description.trim().toLowerCase()}`;
}

function mergeSuggestions(
  current: ObjectAISuggestion[] | undefined,
  incoming: ObjectAISuggestion[] | undefined
): ObjectAISuggestion[] {
  const base = current ?? [];
  const added = incoming ?? [];

  const preserved = base.filter((s) => s.status !== "active");

  const activeByKey = new Map<string, ObjectAISuggestion>();
  for (const suggestion of base.filter((s) => s.status === "active")) {
    activeByKey.set(suggestionKey(suggestion), suggestion);
  }

  const mergedActive: ObjectAISuggestion[] = [];
  for (const suggestion of added) {
    const key = suggestionKey(suggestion);
    const existing = activeByKey.get(key);
    if (existing) {
      mergedActive.push({
        ...suggestion,
        id: existing.id,
        status: existing.status,
        generatedAt: existing.generatedAt,
      });
      activeByKey.delete(key);
    } else {
      mergedActive.push(suggestion);
    }
  }

  const dismissedObsolete: ObjectAISuggestion[] = Array.from(activeByKey.values()).map((s) => ({
    ...s,
    status: "dismissed" as const,
  }));

  return [...preserved, ...mergedActive, ...dismissedObsolete];
}

function memoryKey(memory: ObjectMemory): string {
  return memory.content.trim().toLowerCase();
}

function mergeMemories(
  current: ObjectMemory[] | undefined,
  incoming: ObjectMemory[] | undefined
): ObjectMemory[] {
  const base = current ?? [];
  const added = incoming ?? [];
  const seen = new Set(base.map(memoryKey));
  const result = [...base];

  for (const memory of added) {
    const key = memoryKey(memory);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(memory);
    }
  }

  return result;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Merge two profiles. The updated profile wins by default, but we preserve
 * non-empty array fields from the current profile when the update leaves them
 * empty. This prevents accidentally wiping growth themes, reflection seeds,
 * or life patterns when an incremental update focuses on a different dimension.
 */
function mergeProfile(
  current: ObjectAIProfile | undefined,
  updated: ObjectAIProfile | undefined
): ObjectAIProfile | undefined {
  if (!updated) return current;
  if (!current) return updated;

  const merged: Record<string, unknown> = { ...updated };

  for (const [key, value] of Object.entries(current)) {
    if (key === "type") continue;
    if (Array.isArray(value) && value.length > 0) {
      const updatedValue = merged[key];
      if (!Array.isArray(updatedValue) || updatedValue.length === 0) {
        merged[key] = value;
      }
    } else if (isObject(value)) {
      const updatedValue = merged[key];
      if (isObject(updatedValue)) {
        merged[key] = { ...value, ...updatedValue };
      }
    }
  }

  return merged as unknown as ObjectAIProfile;
}

export function mergeObjectAnalysis(
  currentObject: LifeObject,
  updateResult: AIAnalysisResult
): MergeObjectAnalysisResult {
  const mergedProfile = mergeProfile(currentObject.aiProfile, updateResult.profile);
  const mergedInsights = mergeInsights(
    currentObject.aiInsights,
    updateResult.insights
  );
  const mergedSuggestions = mergeSuggestions(
    currentObject.aiSuggestions,
    updateResult.suggestions
  );
  const mergedMemories = mergeMemories(currentObject.memories, updateResult.memories);

  const mergedResult: AIAnalysisResult = {
    ...updateResult,
    profile: mergedProfile ?? updateResult.profile,
    insights: mergedInsights,
    suggestions: mergedSuggestions,
    memories: mergedMemories,
  };

  return {
    mergedObject: {
      aiProfile: mergedResult.profile,
      aiInsights: mergedResult.insights,
      aiSuggestions: mergedResult.suggestions,
      memories: mergedResult.memories,
    },
    mergedResult,
  };
}
