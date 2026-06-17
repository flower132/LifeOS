export type LifeObjectType = "person" | "self" | "event" | "idea" | "goal";

export const LIFE_OBJECT_TYPES: LifeObjectType[] = [
  "person",
  "self",
  "event",
  "idea",
  "goal",
];

export interface LifeObject {
  id: string;
  type: LifeObjectType;
  name: string;
  description?: string;
  tag_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  object_id: string;
  content: string;
  created_at: string;
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
  | "task"
  | "custom";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "person",
  "self",
  "goal",
  "event",
  "idea",
  "task",
  "custom",
];

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  isDefault: boolean;
  content: string;
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

