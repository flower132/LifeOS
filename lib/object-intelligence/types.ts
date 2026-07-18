// ---------------------------------------------------------------------------
// Object Intelligence — ObjectProfile: the AI-maintained understanding of a
// LifeObject. Never user-edited; generated and incrementally updated from
// memories by the Object Intelligence Engine.
// ---------------------------------------------------------------------------

export interface ObjectProfile {
  /** AI narrative summary of the object (人物画像 / 目标状态 / 项目状态). */
  summary: string;
  /** Stable traits (e.g. 理性、谨慎). */
  traits: string[];
  /** Preferences (e.g. 偏好风险控制、喜欢简洁沟通). */
  preferences: string[];
  /** Important events, newest first ("2026-06 第一次合作"). */
  importantEvents: string[];
  /** What changed recently (e.g. 最近三个月开始负责新项目). */
  recentChanges: string[];
  /** Relationship with the user (person objects). */
  relationshipSummary?: string;
  /** Communication guidance (person objects). */
  communicationStyle?: string;
  /** Durable AI insights about this object. */
  insights: string[];
  /** Risks (project/goal: 风险与卡点; person: 需要注意的地方). */
  risk: string[];
  /** Opportunities (project/goal: 机会; person: 可以加深关系的方向). */
  opportunities: string[];
  /** 0..1 — how well AI understands this object (see confidence.ts). */
  confidence: number;
  /** ms epoch of last AI update. */
  lastUpdated: number;
}

/** Storage record — one per object, keyed by objectId. */
export interface StoredObjectProfile {
  id: string;
  objectId: string;
  profile: ObjectProfile;
  createdAt: string;
  updatedAt: string;
}

export function emptyProfile(): ObjectProfile {
  return {
    summary: "",
    traits: [],
    preferences: [],
    importantEvents: [],
    recentChanges: [],
    insights: [],
    risk: [],
    opportunities: [],
    confidence: 0,
    lastUpdated: 0,
  };
}

/** Runtime validator for both storage adapters. */
export function isValidStoredObjectProfile(
  value: unknown
): value is StoredObjectProfile {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    typeof r.objectId !== "string" ||
    typeof r.createdAt !== "string" ||
    typeof r.updatedAt !== "string" ||
    typeof r.profile !== "object" ||
    r.profile === null
  ) {
    return false;
  }
  const p = r.profile as Record<string, unknown>;
  return (
    typeof p.summary === "string" &&
    Array.isArray(p.traits) &&
    Array.isArray(p.preferences) &&
    Array.isArray(p.importantEvents) &&
    Array.isArray(p.recentChanges) &&
    Array.isArray(p.insights) &&
    Array.isArray(p.risk) &&
    Array.isArray(p.opportunities) &&
    typeof p.confidence === "number" &&
    typeof p.lastUpdated === "number"
  );
}
