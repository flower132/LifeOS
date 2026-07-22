import "server-only";

import { AIErrorCode, AITask } from "../types";

// ---------------------------------------------------------------------------
// Usage types — the canonical shape of one AI call record.
//
// Privacy: prompt / response content is NEVER part of usage — metadata only.
// ---------------------------------------------------------------------------

export interface AIUsageRecord {
  id?: string;
  /** auth.users uuid once server auth ships; "local" in local mode. */
  userId: string;
  provider: string;
  model: string;
  task: AITask;
  requestTokens: number;
  responseTokens: number;
  totalTokens: number;
  /** Estimated cost in USD, derived from the model pricing table. */
  estimatedCost: number;
  /** Provider call latency in ms. */
  latency: number;
  success: boolean;
  errorCode?: AIErrorCode;
  /** 预留：会话维度统计（Chat / Conversation）。 */
  sessionId?: string;
  /** 预留：多轮对话维度统计。 */
  conversationId?: string;
  createdAt: string; // ISO
}

/** Input accepted by the usage service — ids/timestamps/cost filled in there. */
export type AIUsageInput = Omit<AIUsageRecord, "id" | "createdAt" | "estimatedCost">;

export interface AIUsageFilter {
  userId?: string;
  task?: AITask;
  provider?: string;
  model?: string;
  success?: boolean;
  /** ISO lower bound (inclusive). */
  since?: string;
  /** ISO upper bound (exclusive). */
  until?: string;
  limit?: number;
}

export interface AIUsageBreakdown {
  calls: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AIUsageStats {
  calls: number;
  successCalls: number;
  failedCalls: number;
  requestTokens: number;
  responseTokens: number;
  totalTokens: number;
  estimatedCost: number;
  avgLatency: number;
  byTask: Record<string, AIUsageBreakdown>;
  byModel: Record<string, AIUsageBreakdown>;
  byProvider: Record<string, AIUsageBreakdown>;
}
