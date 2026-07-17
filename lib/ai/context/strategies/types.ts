import { AIContext, AIContextSource, ContextSignals } from "../types";
import { RawWorld } from "../retriever";

/**
 * Shared strategy contract. Each task family assembles only the context
 * sections it needs — never the whole database.
 */
export interface StrategyResult {
  sections: Partial<AIContext>;
  sources: AIContextSource[];
  /** 0..1 — how much real data backed the result. */
  confidence: number;
}

export type ContextStrategy = (
  signals: ContextSignals,
  world: RawWorld
) => StrategyResult;
