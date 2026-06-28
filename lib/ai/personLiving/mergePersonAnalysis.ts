import {
  LifeObject,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  PersonAIProfile,
} from "@/lib/types";
import { AIAnalysisResult } from "@/lib/ai/objectIntelligence/types";

function isPersonProfile(profile: unknown): profile is PersonAIProfile {
  return (
    typeof profile === "object" &&
    profile !== null &&
    (profile as PersonAIProfile).type === "person"
  );
}

function mergeProfile(
  current: PersonAIProfile | undefined,
  updated: PersonAIProfile | undefined
): PersonAIProfile | undefined {
  if (!updated) return current;
  return updated;
}

function insightKey(insight: ObjectAIInsight): string {
  return `${insight.category.trim().toLowerCase()}::${insight.title.trim().toLowerCase()}`;
}

function mergeInsights(
  current: ObjectAIInsight[] | undefined,
  updated: ObjectAIInsight[] | undefined
): ObjectAIInsight[] {
  const base = current ?? [];
  const incoming = updated ?? [];
  const map = new Map<string, ObjectAIInsight>();

  for (const insight of base) {
    map.set(insightKey(insight), insight);
  }

  for (const insight of incoming) {
    const key = insightKey(insight);
    const existing = map.get(key);
    if (existing) {
      // Merge evidence to preserve history
      const existingEvidenceQuotes = new Set(
        existing.evidence.map((e) => e.quote)
      );
      const mergedEvidence = [
        ...existing.evidence,
        ...insight.evidence.filter(
          (e) => !existingEvidenceQuotes.has(e.quote)
        ),
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

  // Preserve non-active suggestions (done / dismissed) exactly as they are.
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
      // Keep the existing id so any client-side references remain stable.
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

  // Old active suggestions that were not regenerated are considered obsolete.
  const dismissedObsolete: ObjectAISuggestion[] = Array.from(
    activeByKey.values()
  ).map((s) => ({
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

export interface MergePersonAnalysisResult {
  mergedObject: Partial<LifeObject>;
  mergedResult: AIAnalysisResult;
}

export function mergePersonAnalysis(
  currentObject: LifeObject,
  updateResult: AIAnalysisResult
): MergePersonAnalysisResult {
  if (currentObject.type !== "person") {
    throw new Error("mergePersonAnalysis only supports person objects");
  }

  const currentProfile = isPersonProfile(currentObject.aiProfile)
    ? currentObject.aiProfile
    : undefined;

  const updatedProfile = updateResult.profile as PersonAIProfile;
  const mergedProfile = mergeProfile(currentProfile, updatedProfile);
  const mergedInsights = mergeInsights(
    currentObject.aiInsights,
    updateResult.insights
  );
  const mergedSuggestions = mergeSuggestions(
    currentObject.aiSuggestions,
    updateResult.suggestions
  );
  const mergedMemories = mergeMemories(
    currentObject.memories,
    updateResult.memories
  );

  const mergedResult: AIAnalysisResult = {
    ...updateResult,
    profile: mergedProfile ?? updatedProfile,
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
