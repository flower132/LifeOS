export type LifeObjectType =
  | "person"
  | "self"
  | "event"
  | "idea"
  | "goal"
  | "project"
  | "knowledge";

export const LIFE_OBJECT_TYPES: LifeObjectType[] = [
  "person",
  "self",
  "event",
  "idea",
  "goal",
  "project",
  "knowledge",
];

export interface LifeObject {
  id: string;
  type: LifeObjectType;
  name: string;
  description?: string;
  properties?: Record<string, unknown>;
  aiProfile?: ObjectAIProfile;
  aiInsights?: ObjectAIInsight[];
  aiSuggestions?: ObjectAISuggestion[];
  memories?: ObjectMemory[];
  tag_ids: string[];
  created_at: string;
  updated_at: string;
}

export type ObjectProperties = Record<string, unknown>;

// ── AI Object Intelligence Engine ───────────────────────────────────────────

export interface Evidence {
  quote: string;
  source: string; // e.g. "chat_log_line_12", "screenshot_3"
}

export interface ObjectAIInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  confidence: number; // 0-100
  evidence: Evidence[];
  createdAt: string; // ISO
}

export type AISuggestionStatus = "active" | "done" | "dismissed";

export type AISuggestionPriority = "low" | "medium" | "high";

export interface ObjectAISuggestion {
  id: string;
  title: string;
  description: string;
  priority: AISuggestionPriority;
  status: AISuggestionStatus;
  completedAt?: string;
  generatedAt: string; // ISO
}

export type MemorySource = "user" | "ai" | "import" | "note";

export interface ObjectMemory {
  id: string;
  content: string;
  source: MemorySource;
  createdAt: string; // ISO
}

// ── AI Profiles (discriminated by object type) ──────────────────────────────

export interface PersonAIProfile {
  type: "person";
  relationshipContext?: string;
  mbti: string;
  mbtiConfidence: number;
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    emotionalStability: number;
  };
  personalitySummary: string;
  rollingSummary?: string;
}

export interface GoalAIProfile {
  type: "goal";
  difficulty: number;
  successProbability: number;
  requiredResources: string[];
  estimatedDuration: string;
  motivationType: "intrinsic" | "extrinsic" | "mixed";
}

export interface ProjectAIProfile {
  type: "project";
  complexity: number;
  riskLevel: "low" | "medium" | "high";
  timelineEstimate: string;
  keyStakeholders: string[];
}

export interface LifePattern {
  repeatedTopics: string[];
  goalChanges: string[];
  emotionalTrend?: string;
  relationshipChanges: string[];
  learningDirections: string[];
  valueEvolution: string[];
  updatedAt: string;
}

export interface SelfAIProfile {
  type: "self";
  strengths: string[];
  weaknesses: string[];
  growthAreas: string[];
  currentFocus: string;
  understandingSummary: string;
  growthThemes: string[];
  reflectionSeeds: string[];
  lifePattern: LifePattern;
}

export interface KnowledgeAIProfile {
  type: "knowledge";
  difficulty: number;
  relatedTopics: string[];
  knowledgeGraph: { node: string; relation: string; target: string }[];
}

export interface EventAIProfile {
  type: "event";
  impactLevel: "low" | "medium" | "high";
  importance: number;
  stakeholders: string[];
}

export interface IdeaAIProfile {
  type: "idea";
  novelty: number;
  feasibility: number;
  marketPotential: number;
  relatedDomains: string[];
}

export type ObjectAIProfile =
  | PersonAIProfile
  | GoalAIProfile
  | ProjectAIProfile
  | SelfAIProfile
  | KnowledgeAIProfile
  | EventAIProfile
  | IdeaAIProfile;

export type ObjectAIProfileType = ObjectAIProfile["type"];

// ── AI Analysis History ─────────────────────────────────────────────────────

export interface AIAnalysisHistoryEntry {
  id: string;
  objectType: LifeObjectType;
  objectId?: string;
  createdAt: string;
  rawTextInput: string;
  imageCount: number;
  imageThumbnails: string[];
  provider: string;
  model: string;
  durationMs: number;
  rawOutput: string;
  profileSnapshot?: ObjectAIProfile;
  insightsSnapshot?: ObjectAIInsight[];
  suggestionsSnapshot?: ObjectAISuggestion[];
  memoriesSnapshot?: ObjectMemory[];
}

// ── Intelligence Engine ─────────────────────────────────────────────────────

export type IntelligencePatternCategory =
  | "emotion"
  | "behavior"
  | "relationship"
  | "decision"
  | "goal"
  | "health"
  | "work";

export type IntelligencePatternFrequency =
  | "recurring"
  | "spike"
  | "declining"
  | "stable";

export type IntelligencePatternStatus = "active" | "dismissed" | "confirmed";
export type IntelligenceUserFeedback = "agree" | "disagree" | "neutral";

export interface IntelligenceEvidence {
  quote: string;
  source: string; // e.g. "note:<id>", "memory:<id>", "object:<id>"
}

export interface IntelligenceChapter {
  id: string;
  title: string;
  summary: string;
  startAt: string; // ISO
  endAt?: string; // ISO
  objectsInvolved: string[];
  noteIds: string[];
  evidence: IntelligenceEvidence[];
  status: "active" | "closed";
  userModified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntelligencePattern {
  id: string;
  title: string;
  description: string;
  category: IntelligencePatternCategory;
  firstSeenAt: string; // ISO
  lastSeenAt: string; // ISO
  frequency: IntelligencePatternFrequency;
  confidence: number; // 0-1
  evidence: IntelligenceEvidence[];
  noteIds: string[];
  status: IntelligencePatternStatus;
  userFeedback?: IntelligenceUserFeedback;
  createdAt: string;
  updatedAt: string;
}

export interface IntelligenceRelationshipPattern {
  id: string;
  personId: string;
  personName: string;
  observation: string;
  trend: "closer" | "distant" | "stable" | "complex";
  evidence: IntelligenceEvidence[];
  noteIds: string[];
  status: "active" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export interface IntelligenceDecision {
  id: string;
  title: string;
  madeAt: string; // ISO
  context: string;
  reason: string;
  outcome?: string;
  relatedGoalIds: string[];
  relatedPersonIds: string[];
  noteIds: string[];
  evidence: IntelligenceEvidence[];
  status: "identified" | "confirmed" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface IntelligenceDecisionPattern {
  id: string;
  observation: string;
  decisionsInvolved: string[];
  evidence: IntelligenceEvidence[];
  createdAt: string;
  updatedAt: string;
}

export interface IntelligenceGrowthTheme {
  id: string;
  statement: string;
  direction: "growing" | "emerging" | "struggling" | "stable";
  evidence: IntelligenceEvidence[];
}

export interface IntelligenceGrowthSnapshot {
  id: string;
  periodFrom: string; // ISO
  periodTo: string; // ISO
  summary: string;
  themes: IntelligenceGrowthTheme[];
  evidence: IntelligenceEvidence[];
  createdAt: string;
}

export interface IntelligenceThemeSnapshot {
  id: string;
  periodFrom: string; // ISO
  periodTo: string; // ISO
  themes: { statement: string; evidence: IntelligenceEvidence[] }[];
  createdAt: string;
}

export interface IntelligenceCrossObjectInsight {
  id: string;
  title: string;
  description: string;
  category: "growth" | "pattern" | "relationship" | "decision" | "theme";
  sourceIds: string[];
  evidence: IntelligenceEvidence[];
  status: "active" | "dismissed";
  userFeedback?: "agree" | "disagree";
  createdAt: string;
  updatedAt: string;
}

export interface IntelligenceReflectionQuestion {
  id: string;
  question: string;
  triggeredBy: {
    type: "pattern" | "growth" | "relationship" | "decision" | "today";
    id: string;
  };
  evidence: IntelligenceEvidence[];
  status: "pending" | "answered" | "dismissed";
  answeredAt?: string;
  answer?: string;
  createdAt: string;
}

export interface IntelligenceTodayStory {
  id: string;
  date: string; // YYYY-MM-DD
  story: string;
  greeting?: string; // optional warm opening sentence
  evidence: IntelligenceEvidence[];
  createdAt: string;
}

// ── Daily Companion ───────────────────────────────────────────────────────────

export type TodayFocusSourceType =
  | "person"
  | "goal"
  | "project"
  | "self"
  | "relationship"
  | "memory"
  | "event"
  | "decision"
  | "place"
  | "habit";

export interface TodayFocus {
  id: string;
  date: string; // YYYY-MM-DD local date
  sourceType: TodayFocusSourceType;
  objectId?: string;
  relationId?: string;
  memoryId?: string;
  placeId?: string;
  habitId?: string;
  title: string; // <= 15 chars
  explanation: string; // <= 50 chars
  whyNow: string; // <= 80 chars
  evidence: IntelligenceEvidence[];
  status: "active" | "done" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export type ReminderTriggerSource =
  | "person"
  | "goal"
  | "project"
  | "health"
  | "relationship"
  | "memory";

export interface CompanionReminder {
  id: string;
  date: string; // YYYY-MM-DD local date
  triggerSource: ReminderTriggerSource;
  objectId?: string;
  relationId?: string;
  memoryId?: string;
  title: string; // <= 15 chars
  whyNow: string; // <= 80 chars
  actionLabel: string;
  actionRoute?: string;
  status: "pending" | "done" | "later" | "skipped";
  respondedAt?: string;
  evidence: IntelligenceEvidence[];
  createdAt: string;
}

export interface ReflectionQuestion {
  id: string;
  date: string; // YYYY-MM-DD local date
  question: string; // <= 40 chars
  seedSource: "memory" | "goal" | "project" | "relationship" | "self";
  seedId: string;
  answer?: string;
  status: "pending" | "answered" | "dismissed";
  answeredAt?: string;
  evidence: IntelligenceEvidence[];
  createdAt: string;
}

export interface DailyTimeline {
  date: string; // YYYY-MM-DD
  summary: string; // <= 150 chars
  evidence: IntelligenceEvidence[];
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReview {
  id: string;
  weekKey: string; // e.g. "2026-W29"
  periodFrom: string; // ISO
  periodTo: string; // ISO
  mostImportantPerson?: {
    name: string;
    objectId?: string;
    reason: string;
    evidence: IntelligenceEvidence[];
  };
  mostImportantGoal?: {
    name: string;
    objectId?: string;
    reason: string;
    evidence: IntelligenceEvidence[];
  };
  growth?: { statement: string; evidence: IntelligenceEvidence[] };
  emotion?: { statement: string; evidence: IntelligenceEvidence[] };
  gratitude?: { statement: string; evidence: IntelligenceEvidence[] };
  status: "active" | "dismissed";
  createdAt: string;
}

export interface MonthlyStory {
  id: string;
  monthKey: string; // e.g. "2026-07"
  periodFrom: string; // ISO
  periodTo: string; // ISO
  story: string; // 300-500 words
  evidence: IntelligenceEvidence[];
  status: "active" | "dismissed";
  createdAt: string;
}

export interface CompanionFeedback {
  id: string;
  kind: "focus" | "reminder" | "reflection" | "insight" | "suggestion";
  itemId: string;
  action: "done" | "later" | "skip" | "ignore" | "dismiss";
  reason?: string;
  createdAt: string;
}

export interface QuietModeSettings {
  enabled: boolean;
  doNotDisturbStart: string; // "22:00"
  doNotDisturbEnd: string; // "07:00"
  consecutiveRejectionThreshold: number;
  lowMoodKeywords: string[];
}

export interface IntelligenceCache {
  chapters: IntelligenceChapter[];
  patterns: IntelligencePattern[];
  relationshipPatterns: IntelligenceRelationshipPattern[];
  decisions: IntelligenceDecision[];
  decisionPatterns: IntelligenceDecisionPattern[];
  growthSnapshots: IntelligenceGrowthSnapshot[];
  themeSnapshots: IntelligenceThemeSnapshot[];
  crossObjectInsights: IntelligenceCrossObjectInsight[];
  reflectionQuestions: IntelligenceReflectionQuestion[];
  todayStories: IntelligenceTodayStory[];
  // Daily Companion outputs
  todayFocuses: TodayFocus[];
  reminders: CompanionReminder[];
  reflections: ReflectionQuestion[];
  dailyTimelines: DailyTimeline[];
  weeklyReviews: WeeklyReview[];
  monthlyStories: MonthlyStory[];
  feedback: CompanionFeedback[];
}

export interface IntelligenceMeta {
  lastFullAnalysisAt: string | null;
  lastIncrementalAnalysisAt: string | null;
  analysisVersion: string;
  pendingUpdate: boolean;
}

export interface CompanionMeta {
  lastFocusDate: string | null;
  lastReminderDate: string | null;
  lastReflectionDate: string | null;
  lastWeeklyWeekKey: string | null;
  lastMonthlyMonthKey: string | null;
  consecutiveRejections: number;
  lastAppearanceAt: string | null;
  appearanceCountToday: number;
}

export type IntelligenceRunType = "full" | "incremental" | "todayStory";

// ── Core domain types ───────────────────────────────────────────────────────

export type NoteSourceType =
  | "text"
  | "chat"
  | "email"
  | "social_post"
  | "document"
  | "resume"
  | "image";

export interface NoteAttachment {
  mimeType: string;
  base64Data: string;
}

export interface Note {
  id: string;
  object_id: string | null;
  content: string;
  sourceType: NoteSourceType;
  attachments: NoteAttachment[];
  created_at: string;
}

export interface ObjectDeletionSnapshot {
  objects: LifeObject[];
  relations: Relation[];
  notes: Note[]; // unlinked notes that still hold their original object_id
  aiHistoryEntries: { id: string; objectId: string }[];
  deletedAt: number;
}

export type RelationType =
  | "family"
  | "friend"
  | "colleague"
  | "mentor"
  | "partner"
  | "custom";

export const RELATION_TYPES: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "mentor",
  "partner",
  "custom",
];

export interface Relation {
  id: string;
  source_object_id: string;
  target_object_id: string;
  type: RelationType;
  strength?: number;
  note?: string;
  created_at: string;
  // ── V2 Knowledge Graph (Relation Engine) — all optional, legacy rows omit them ──
  /** Free-form predicate label (e.g. "合作项目", "准备"), for AI-extracted semantics. */
  label?: string;
  /** 0..1 — extraction confidence / human-confirmed strength of this edge. */
  confidence?: number;
  /** Provenance: the memory this relation was extracted from. */
  sourceMemoryId?: string;
  /** "ai" (auto-extracted) or "user" (manually created). Legacy rows: "user". */
  createdBy?: "ai" | "user";
  updated_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  usageCount: number;
}

export const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
  "#64748b",
];

export type TemplateCategory =
  | "person"
  | "self"
  | "goal"
  | "event"
  | "idea"
  | "project"
  | "knowledge"
  | "task"
  | "custom";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "person",
  "self",
  "goal",
  "event",
  "idea",
  "project",
  "knowledge",
  "task",
  "custom",
];

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  isDefault: boolean;
  content: string;
  templateVersion: number;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsedAt?: string;
}

export type TemplateCreateInput = Omit<
  Template,
  "id" | "createdAt" | "updatedAt" | "usageCount"
>;

export type TemplateUpdateInput = Partial<Omit<Template, "id" | "createdAt">>;

export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ── Long-term Memory ────────────────────────────────────────────────────────
// 长期记忆基础设施：为年度回顾、人生章节、时间旅行、决策模式、AI 深度洞察
// 提供统一的数据基础。所有派生实体由 lib/services 下的引擎自动维护。

export type Season = "spring" | "summer" | "autumn" | "winter";

/** 由 TimeEngine 为每条记忆自动计算的时间分面。禁止页面自行计算。 */
export interface TimeFacets {
  day: string; // YYYY-MM-DD local day
  week: string; // ISO week key, e.g. "2026-W29"
  month: string; // YYYY-MM
  quarter: string; // e.g. "2026-Q3"
  year: number;
  weekday: number; // 0-6, Sunday = 0
  hour: number; // 0-23, local hour
  season: Season;
}

/** 一天中的叙事时段。 */
export type Daypart = "earlyMorning" | "morning" | "afternoon" | "evening" | "night";

export type MemoryRecordKind =
  | "note"
  | "objectMemory"
  | "moment"
  | "decision"
  | "reflection";

/**
 * 统一记忆视图：把 Note、ObjectMemory、Moment、Decision、Reflection
 * 归一化为带时间分面的 MemoryRecord，供 Timeline / History / Search 使用。
 * MemoryRecord 是虚拟视图，不单独持久化。
 */
export interface MemoryRecord {
  id: string; // stable view id, e.g. "note:<id>"
  kind: MemoryRecordKind;
  content: string;
  sourceId: string; // original entity id
  objectId?: string | null;
  objectName?: string;
  createdAt: string; // ISO
  facets: TimeFacets;
}

// ── Memory Moments（重要人生时刻） ───────────────────────────────────────────

export type MomentKind =
  | "first_meeting" // 第一次认识某人
  | "first_goal" // 第一次创建目标
  | "first_travel" // 第一次旅行
  | "first_move" // 第一次搬家
  | "first_goal_completed" // 第一次完成目标
  | "first_job_change" // 第一次换工作
  | "first_venture" // 第一次创业
  | "first_graduation" // 第一次毕业
  | "milestone"; // 其他重要时刻

/** Moment 不是 Tag，Moment 是一种特殊的 Memory。 */
export interface MemoryMoment {
  id: string;
  kind: MomentKind;
  /** 引擎幂等键：同一来源的 Moment 重复检测时保持稳定，例如 "first_meeting:<personId>" */
  dedupeKey: string;
  title: string;
  description?: string;
  memoryIds: string[]; // related MemoryRecord ids
  objectIds: string[]; // related LifeObject ids
  occurredAt: string; // ISO, when the moment happened
  createdAt: string;
  updatedAt: string;
}

// ── Life Chapters（人生章节） ────────────────────────────────────────────────

export interface LifeChapter {
  id: string;
  /** 引擎幂等键：以章节起点标识，例如 "chapter:2025-03-01" */
  dedupeKey: string;
  title: string;
  description: string;
  startDate: string; // ISO
  endDate?: string; // ISO; undefined = ongoing
  people: string[]; // LifeObject ids (person)
  goals: string[]; // LifeObject ids (goal)
  places: string[]; // free-form place names
  representativeMemoryIds: string[]; // MemoryRecord ids
  status: "active" | "closed";
  createdAt: string;
  updatedAt: string;
}

// ── Memory Connections（记忆关联） ───────────────────────────────────────────

export interface MemoryRelationEdge {
  id: string;
  sourceMemoryId: string; // MemoryRecord id
  targetMemoryId: string; // MemoryRecord id
  reason: string; // why the two memories are connected
  confidence: number; // 0-1
  createdAt: string;
}

// ── Anniversaries（周年） ───────────────────────────────────────────────────

export type AnniversarySourceType = "person" | "goal" | "project" | "event" | "moment";

export interface Anniversary {
  id: string;
  title: string; // e.g. "认识 Alice"
  sourceType: AnniversarySourceType;
  sourceId: string; // LifeObject id or MemoryMoment id
  originalDate: string; // ISO of the original event
  monthDay: string; // "MM-DD" — used for "去年今天" matching
  createdAt: string;
}

// ── Highlights（年度亮点） ───────────────────────────────────────────────────

export type HighlightCategory =
  | "most_important" // 今年最重要的 Memory
  | "most_growth" // 成长最大的 Memory
  | "happiest" // 最快乐
  | "hardest" // 最困难
  | "key_decision" // 最重要决定
  | "relationship_change"; // 关系变化最大

export interface Highlight {
  id: string;
  year: number;
  category: HighlightCategory;
  title: string;
  memoryId?: string; // MemoryRecord id
  objectId?: string; // LifeObject id
  score: number; // engine-computed importance, 0-1
  createdAt: string;
}

// ── Decision Memory（决策记忆） ──────────────────────────────────────────────

export interface DecisionMemory {
  id: string;
  decision: string;
  context: string;
  emotion: string;
  reason: string;
  outcome?: string;
  review?: string;
  objectIds: string[]; // related LifeObject ids
  decidedAt: string; // ISO, when the decision was made
  createdAt: string;
  updatedAt: string;
}

export type DecisionMemoryCreateInput = Omit<
  DecisionMemory,
  "id" | "createdAt" | "updatedAt"
>;

export type DecisionMemoryUpdateInput = Partial<
  Omit<DecisionMemory, "id" | "createdAt">
>;
