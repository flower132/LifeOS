// ---------------------------------------------------------------------------
// Knowledge Graph Intelligence — the unified API. Every AI consumer (Memory,
// Relationship, Workspace, Reflection, Today's Focus, AI Chat) builds on
// these functions; business code never traverses storage directly.
// ---------------------------------------------------------------------------

// Types
export type {
  GraphContext,
  GraphInsight,
  GraphPathNode,
  RankedNeighbor,
  RelationExplanation,
  RelationStrength,
  RelationStrengthLevel,
  RelationSuggestion,
} from "./types";
export { isValidRelationSuggestion } from "./types";

// 1. AI Context Builder
export { buildGraphContext } from "./contextBuilder";
export type { BuildGraphContextOptions } from "./contextBuilder";

// 2. Multi-hop Search
export { traverseGraph } from "./traversal";

// 3. Graph Memory Ranking (TopK)
export { rankContext } from "./ranking";

// 4. Automatic Relation Discovery (user-confirmed)
export {
  discoverRelations,
  acceptRelationSuggestion,
  rejectRelationSuggestion,
} from "./discovery";

// 5. Relation Strength
export { computeRelationStrength } from "./strength";

// 6. AI Graph Summary
export {
  getGraphSummary,
  isGraphSummaryStale,
  generateGraphSummary,
  ensureGraphSummary,
} from "./summary";

// 7. Explain Relation (transparent, data-only)
export { explainRelation } from "./explain";

// 8. Graph Recommendation (rule-based insights)
export { recommendInsights } from "./recommendations";

// Convenience aliases matching the Graph API contract:
//   buildContext / findRelatedObjects / rankContext / discoverRelations /
//   explainRelation / summarizeObject / recommendInsights
export { buildGraphContext as buildContext } from "./contextBuilder";
export { traverseGraph as findRelatedObjects } from "./traversal";
export { generateGraphSummary as summarizeObject } from "./summary";
