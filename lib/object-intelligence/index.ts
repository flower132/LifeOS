export type { ObjectProfile, StoredObjectProfile } from "./types";
export { emptyProfile, isValidStoredObjectProfile } from "./types";
export { calculateConfidence } from "./confidence";
export {
  generateObjectProfile,
  updateObjectProfileIncremental,
  generateCommunicationAdvice,
} from "./analyzer";
export type { PersonAdvice } from "./analyzer";
export { buildRelationshipGraph } from "./relationship";
export type { RelationshipGraph, RelationshipNode, RelationshipEdge } from "./relationship";
export { buildObjectTimeline } from "./timeline";
export type { ObjectTimelineEntry } from "./timeline";
export { analyzeGoalProgress, assessProjectHealth } from "./recommendation";
export type { GoalInsight, ProjectHealth, ProjectHealthLevel } from "./recommendation";
export { buildObjectChatContext } from "./chatContext";
export type { ObjectChatContext } from "./chatContext";
export { objectIntelligenceEngine } from "./engine";
export { objectIntelligenceUpdater } from "./updater";
