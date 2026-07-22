import "server-only";

// ---------------------------------------------------------------------------
// Quota types — 配额引擎的通用模型。
//
// 配额按「维度」计量：tokens 现在启用；requests / images / files / audio
// 为预留维度（计数已开始，限制后续开放）。所有维度共用同一套引擎，
// 任何套餐（Free / Pro / Ultra…）只是一组 QuotaLimits。
// ---------------------------------------------------------------------------

export interface QuotaCounters {
  tokens: number;
  requests: number;
  images: number;
  files: number;
  audio: number;
}

export type QuotaDimension = keyof QuotaCounters;

export const QUOTA_DIMENSIONS: QuotaDimension[] = [
  "tokens",
  "requests",
  "images",
  "files",
  "audio",
];

/** 每个维度的每日上限；null = 不限。 */
export type QuotaLimits = Record<QuotaDimension, number | null>;

/** 用户某一天的已用量（day = YYYY-MM-DD, UTC）。 */
export interface QuotaUsage {
  userId: string;
  day: string;
  counters: QuotaCounters;
  updatedAt: string; // ISO
}

/** 一次扣减的增量（成功调用后按实际消耗上报）。 */
export type QuotaDelta = Partial<QuotaCounters>;

/** checkQuota 的判定结果。 */
export interface QuotaCheckResult {
  ok: boolean;
  /** 已超出的维度（ok=false 时非空）。 */
  exceededDimensions: QuotaDimension[];
  status: QuotaStatus;
}

/** 对外暴露的配额快照（首页 / Dashboard 用）。 */
export interface QuotaStatus {
  /** 当前配额日（UTC, YYYY-MM-DD）。 */
  day: string;
  limits: QuotaLimits;
  used: QuotaCounters;
  /** 每维度剩余量；null = 不限。 */
  remaining: Record<QuotaDimension, number | null>;
  /** 下一次自动重置时间（下一个 UTC 零点, ISO）。 */
  resetAt: string;
  exceeded: boolean;
}
