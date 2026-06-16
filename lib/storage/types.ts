import {
  LifeObject,
  Note,
  Relation,
  Tag,
} from "@/lib/types";

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
  aiProvider: "mock" | "openai" | "anthropic";
  aiModel: string;
  openaiKey: string;
  anthropicKey: string;
};

export interface StorageAdapter {
  // Migration / version
  getStorageVersion(): Promise<number>;
  setStorageVersion(version: number): Promise<void>;
  migrateIfNeeded(): Promise<void>;

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

  // Notes
  getNotes(): Promise<Note[]>;
  getNotesByObjectId(objectId: string): Promise<Note[]>;
  createNote(note: Omit<Note, "id" | "created_at">): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  // Relations
  getRelations(): Promise<Relation[]>;
  getRelationsByObjectId(objectId: string): Promise<Relation[]>;
  createRelation(
    relation: Omit<Relation, "id" | "created_at">
  ): Promise<Relation>;
  deleteRelation(id: string): Promise<void>;

  // Tags
  getTags(): Promise<Tag[]>;
  createTag(tag: Omit<Tag, "id" | "createdAt" | "usageCount">): Promise<Tag>;
  updateTag(id: string, updates: Partial<Omit<Tag, "id" | "createdAt">>): Promise<Tag>;
  deleteTag(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<Partial<AppSettings>>;
  setSettings(settings: Partial<AppSettings>): Promise<void>;
}

export interface StorageConfig {
  type: "localStorage" | "supabase";
  supabaseUrl?: string;
  supabaseKey?: string;
}
