import {
  LifeObject,
  Note,
  Relation,
  Tag,
  Template,
  TemplateCreateInput,
  TemplateUpdateInput,
  AIAnalysisHistoryEntry,
  ObjectDeletionSnapshot,
  IntelligenceCache,
  IntelligenceMeta,
  IntelligenceTodayStory,
  QuietModeSettings,
  CompanionMeta,
  MemoryMoment,
  LifeChapter,
  MemoryRelationEdge,
  Anniversary,
  Highlight,
  DecisionMemory,
} from "@/lib/types";

import { AccentColorId } from "@/lib/theme/accentColors";
import { Memory as UnifiedMemory } from "@/lib/memory/types";
import { StoredObjectProfile } from "@/lib/object-intelligence/types";
import { RelationSuggestion } from "@/lib/graph/types";

export type DateFormat = "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
export type TimeFormat = "24h" | "12h";

export type AppSettings = {
  language: "zh" | "en" | "ja";
  theme: "light" | "dark" | "system";
  themeColor: "light" | "dark";
  accentColor: AccentColorId;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  aiEnabled: boolean;
  aiPrivacyMode: boolean;
  // Daily Companion settings
  companionEnabled: boolean;
  allowNotifications: boolean;
  quietMode: QuietModeSettings;
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
  deleteObjects(
    ids: string[],
    options?: { preserveNotes?: boolean }
  ): Promise<ObjectDeletionSnapshot>;
  restoreObjects(snapshot: ObjectDeletionSnapshot): Promise<void>;
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
  updateRelation(
    id: string,
    updates: Partial<Omit<Relation, "id" | "created_at">>
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
  setAIAnalysisHistory(entries: AIAnalysisHistoryEntry[]): Promise<void>;

  // Intelligence Engine caches
  getIntelligenceCache(): Promise<IntelligenceCache>;
  setIntelligenceCache(cache: IntelligenceCache): Promise<void>;
  getIntelligenceMeta(): Promise<IntelligenceMeta>;
  setIntelligenceMeta(meta: IntelligenceMeta): Promise<void>;
  getTodayStory(date: string): Promise<IntelligenceTodayStory | null>;
  createTodayStory(story: Omit<IntelligenceTodayStory, "id" | "createdAt">): Promise<IntelligenceTodayStory>;

  // Daily Companion meta
  getCompanionMeta(): Promise<CompanionMeta>;
  setCompanionMeta(meta: CompanionMeta): Promise<void>;

  // Long-term Memory（长期记忆：Moments / Chapters / Relations / Anniversaries / Highlights / Decisions）
  getMoments(): Promise<MemoryMoment[]>;
  createMoment(moment: Omit<MemoryMoment, "id" | "createdAt" | "updatedAt">): Promise<MemoryMoment>;
  updateMoment(id: string, updates: Partial<Omit<MemoryMoment, "id" | "createdAt">>): Promise<MemoryMoment>;
  deleteMoment(id: string): Promise<void>;
  setMoments(moments: MemoryMoment[]): Promise<void>;

  getChapters(): Promise<LifeChapter[]>;
  createChapter(chapter: Omit<LifeChapter, "id" | "createdAt" | "updatedAt">): Promise<LifeChapter>;
  updateChapter(id: string, updates: Partial<Omit<LifeChapter, "id" | "createdAt">>): Promise<LifeChapter>;
  deleteChapter(id: string): Promise<void>;
  setChapters(chapters: LifeChapter[]): Promise<void>;

  getMemoryRelations(): Promise<MemoryRelationEdge[]>;
  createMemoryRelation(edge: Omit<MemoryRelationEdge, "id" | "createdAt">): Promise<MemoryRelationEdge>;
  deleteMemoryRelation(id: string): Promise<void>;
  setMemoryRelations(edges: MemoryRelationEdge[]): Promise<void>;

  getAnniversaries(): Promise<Anniversary[]>;
  createAnniversary(anniversary: Omit<Anniversary, "id" | "createdAt">): Promise<Anniversary>;
  deleteAnniversary(id: string): Promise<void>;
  setAnniversaries(anniversaries: Anniversary[]): Promise<void>;

  getHighlights(): Promise<Highlight[]>;
  createHighlight(highlight: Omit<Highlight, "id" | "createdAt">): Promise<Highlight>;
  deleteHighlight(id: string): Promise<void>;
  setHighlights(highlights: Highlight[]): Promise<void>;

  getDecisions(): Promise<DecisionMemory[]>;
  createDecision(decision: Omit<DecisionMemory, "id" | "createdAt" | "updatedAt">): Promise<DecisionMemory>;
  updateDecision(id: string, updates: Partial<Omit<DecisionMemory, "id" | "createdAt">>): Promise<DecisionMemory>;
  deleteDecision(id: string): Promise<void>;
  setDecisions(decisions: DecisionMemory[]): Promise<void>;

  // Unified Memory（记忆与知识层：统一核心记录，实体/关系/洞察内嵌）
  getMemories(): Promise<UnifiedMemory[]>;
  createMemory(memory: Omit<UnifiedMemory, "id" | "createdAt" | "updatedAt">): Promise<UnifiedMemory>;
  updateMemory(id: string, updates: Partial<Omit<UnifiedMemory, "id" | "createdAt">>): Promise<UnifiedMemory>;
  deleteMemory(id: string): Promise<void>;
  setMemories(memories: UnifiedMemory[]): Promise<void>;

  // Object Intelligence（对象智能画像，每对象一条，objectId 唯一）
  getObjectProfiles(): Promise<StoredObjectProfile[]>;
  createObjectProfile(profile: Omit<StoredObjectProfile, "id" | "createdAt" | "updatedAt">): Promise<StoredObjectProfile>;
  updateObjectProfile(id: string, updates: Partial<Omit<StoredObjectProfile, "id" | "createdAt">>): Promise<StoredObjectProfile>;
  deleteObjectProfile(id: string): Promise<void>;
  setObjectProfiles(profiles: StoredObjectProfile[]): Promise<void>;

  // Knowledge Graph: Relation Discovery 建议队列（用户确认后才写 relations）
  getRelationSuggestions(): Promise<RelationSuggestion[]>;
  createRelationSuggestion(s: Omit<RelationSuggestion, "id" | "createdAt" | "updatedAt">): Promise<RelationSuggestion>;
  updateRelationSuggestion(id: string, updates: Partial<Omit<RelationSuggestion, "id" | "createdAt">>): Promise<RelationSuggestion>;
  deleteRelationSuggestion(id: string): Promise<void>;
  setRelationSuggestions(suggestions: RelationSuggestion[]): Promise<void>;
}

export interface StorageConfig {
  type: "localStorage" | "supabase";
  supabaseUrl?: string;
  supabaseKey?: string;
}
