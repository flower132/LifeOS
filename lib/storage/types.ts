import {
  LifeObject,
  Note,
  Relation,
  Tag,
  Template,
  TemplateCreateInput,
  TemplateUpdateInput,
  AIAnalysisHistoryEntry,
} from "@/lib/types";

import { AIProviderId } from "@/lib/ai/types";

export type DateFormat = "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
export type TimeFormat = "24h" | "12h";

export type AppSettings = {
  language: "zh" | "en";
  theme: "light" | "dark" | "system";
  themeColor: "light" | "dark";
  accentColor: "blue" | "green" | "purple" | "orange";
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  aiEnabled: boolean;
  aiPrivacyMode: boolean;
  aiProvider: AIProviderId;
  aiModel: string;
  aiBaseUrl: string;
  aiApiKey: string;
  // Deprecated: kept for migration from old settings schema.
  openaiKey?: string;
  anthropicKey?: string;
};

export interface StorageAdapter {
  // Migration / version
  getStorageVersion(): Promise<number>;
  setStorageVersion(version: number): Promise<void>;
  migrateIfNeeded(): Promise<void>;
  ensureDefaultTemplates(): Promise<void>;

  // Objects
  getObjects(): Promise<LifeObject[]>;
  getObjectById(id: string): Promise<LifeObject | null>;
  createObject(
    obj: Omit<LifeObject, "id" | "created_at" | "updated_at">
  ): Promise<LifeObject>;
  updateObject(
    id: string,
    updates: Partial<Omit<LifeObject, "id" | "created_at" | "updated_at">>
  ): Promise<LifeObject>;
  deleteObject(id: string): Promise<void>;
  setObjects(objects: LifeObject[]): Promise<void>;

  // Notes
  getNotes(): Promise<Note[]>;
  getNotesByObjectId(objectId: string): Promise<Note[]>;
  createNote(note: Omit<Note, "id" | "created_at">): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  setNotes(notes: Note[]): Promise<void>;

  // Relations
  getRelations(): Promise<Relation[]>;
  getRelationsByObjectId(objectId: string): Promise<Relation[]>;
  createRelation(
    relation: Omit<Relation, "id" | "created_at">
  ): Promise<Relation>;
  deleteRelation(id: string): Promise<void>;
  setRelations(relations: Relation[]): Promise<void>;

  // Tags
  getTags(): Promise<Tag[]>;
  createTag(tag: Omit<Tag, "id" | "createdAt" | "usageCount">): Promise<Tag>;
  updateTag(id: string, updates: Partial<Omit<Tag, "id" | "createdAt">>): Promise<Tag>;
  deleteTag(id: string): Promise<void>;
  setTags(tags: Tag[]): Promise<void>;

  // Templates
  getTemplates(): Promise<Template[]>;
  createTemplate(template: TemplateCreateInput): Promise<Template>;
  updateTemplate(
    id: string,
    updates: TemplateUpdateInput
  ): Promise<Template>;
  deleteTemplate(id: string): Promise<void>;
  setTemplates(templates: Template[]): Promise<void>;

  // Settings
  getSettings(): Promise<Partial<AppSettings>>;
  setSettings(settings: Partial<AppSettings>): Promise<void>;

  // AI Analysis History
  getAIAnalysisHistory(): Promise<AIAnalysisHistoryEntry[]>;
  getAIAnalysisHistoryByObjectId(objectId: string): Promise<AIAnalysisHistoryEntry[]>;
  getAIAnalysisHistoryByType(objectType: import("@/lib/types").LifeObjectType): Promise<AIAnalysisHistoryEntry[]>;
  getAIAnalysisHistoryEntryById(id: string): Promise<AIAnalysisHistoryEntry | null>;
  createAIAnalysisHistory(
    entry: Omit<AIAnalysisHistoryEntry, "id" | "createdAt">
  ): Promise<AIAnalysisHistoryEntry>;
  updateAIAnalysisHistoryObjectId(historyId: string, objectId: string): Promise<void>;
  deleteAIAnalysisHistory(id: string): Promise<void>;
  clearAIAnalysisHistory(): Promise<void>;
}

export interface StorageConfig {
  type: "localStorage" | "supabase";
  supabaseUrl?: string;
  supabaseKey?: string;
}
