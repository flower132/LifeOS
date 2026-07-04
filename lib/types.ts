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

export interface SelfAIProfile {
  type: "self";
  strengths: string[];
  weaknesses: string[];
  growthAreas: string[];
  currentFocus: string;
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
