// ---------------------------------------------------------------------------
// Life Brain — unified exports. The ONLY AI Context Provider of LifeOS.
// ---------------------------------------------------------------------------

export { brain } from "./brain";
export { reason } from "./brainReasoning";
export { retrieveContext, resolveFocusObject } from "./brainRetriever";
export { decideLayers, detectIntent } from "./brainDecision";
export {
  createBrainContext,
  createBrainContextCached,
  serializeBrainContext,
} from "./brainContext";
export type { SerializedBrainContext } from "./brainContext";
export { buildPrompt, getTemplate } from "./brainPrompt";
export type { BrainPromptTemplateId } from "./brainPrompt";
export { generateInsight } from "./brainInsight";
export type { BrainInsightBundle } from "./brainInsight";
export {
  useBrainMemoryStore,
  getLongTermMemories,
  getShortMemoryText,
} from "./brainMemory";
export {
  brainCacheGet,
  brainCacheSet,
  brainCacheGetOrCompute,
  brainCacheComputeSync,
  brainCacheClear,
  bumpBrainDataVersion,
  getBrainDataVersion,
  BRAIN_CACHE_TTL,
} from "./brainCache";
export type {
  BrainAnswer,
  BrainAnswerRequest,
  BrainContext,
  BrainDecision,
  BrainIntent,
  BrainReasoningStep,
  BrainRetrieval,
  SessionTurn,
  WorkingMemory,
  // Reserved capabilities (interfaces only, not implemented)
  BrainAgentPlan,
  BrainToolDefinition,
  BrainWorkflowHook,
} from "./brainTypes";
