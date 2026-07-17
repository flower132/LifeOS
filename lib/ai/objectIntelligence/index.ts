export type {
  AIAnalysisInput,
  AIAnalysisResult,
  AIProfileDefinition,
  ProfileRegistry,
} from "./types";

export {
  ObjectAIInsightSchema,
  ObjectAISuggestionSchema,
  ObjectMemorySchema,
  AIAnalysisHistoryEntrySchema,
} from "./schemas";

export {
  normalizeObjectAIInsights,
  normalizeObjectAISuggestions,
  normalizeObjectMemories,
  normalizeAIAnalysisHistoryEntry,
} from "./normalize";

export { buildObjectAnalysisPrompt } from "@/lib/ai/prompts/objectAnalysis";

export {
  mapObjectAnalysisResult,
  getObjectDisplayName,
  type ObjectAnalysisMapperContext,
} from "./mapper";

export {
  ObjectIntelligenceEngine,
  objectIntelligenceEngine,
  type AnalyzeObjectOptions,
} from "./engine";

export {
  selectProviderForTask,
  shouldRunAnalysis,
  type SelectedProvider,
} from "./fallback";

export {
  aiProfileRegistry,
} from "./profiles";

export {
  personProfileDefinition,
} from "./profiles/personProfile";

export {
  getAIAnalysisHistory,
  addAIAnalysisHistory,
  deleteAIAnalysisHistory,
  clearAIAnalysisHistory,
  getAIAnalysisHistoryByObjectId,
  getAIAnalysisHistoryByType,
  getAIAnalysisHistoryEntryById,
  updateAIAnalysisHistoryObjectId,
  createAIAnalysisHistoryEntryInput,
} from "./history";
