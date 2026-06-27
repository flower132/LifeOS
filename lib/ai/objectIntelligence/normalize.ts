import {
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  AIAnalysisHistoryEntry,
} from "@/lib/types";
import {
  ObjectAIInsightSchema,
  ObjectAISuggestionSchema,
  ObjectMemorySchema,
  AIAnalysisHistoryEntrySchema,
} from "./schemas";

export function normalizeObjectAIInsights(raw: unknown): ObjectAIInsight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const parsed = ObjectAIInsightSchema.safeParse(item);
      return parsed.success ? parsed.data : null;
    })
    .filter((item): item is ObjectAIInsight => item !== null);
}

export function normalizeObjectAISuggestions(
  raw: unknown
): ObjectAISuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const parsed = ObjectAISuggestionSchema.safeParse(item);
      return parsed.success ? parsed.data : null;
    })
    .filter((item): item is ObjectAISuggestion => item !== null);
}

export function normalizeObjectMemories(raw: unknown): ObjectMemory[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const parsed = ObjectMemorySchema.safeParse(item);
      return parsed.success ? parsed.data : null;
    })
    .filter((item): item is ObjectMemory => item !== null);
}

export function normalizeAIAnalysisHistoryEntry(
  raw: unknown
): AIAnalysisHistoryEntry | null {
  const parsed = AIAnalysisHistoryEntrySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
