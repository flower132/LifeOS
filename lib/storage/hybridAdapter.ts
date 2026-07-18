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
  CompanionMeta,
  MemoryMoment,
  LifeChapter,
  MemoryRelationEdge,
  Anniversary,
  Highlight,
  DecisionMemory,
} from "@/lib/types";
import { AppSettings, StorageAdapter } from "@/lib/storage/types";
import { Memory as UnifiedMemory } from "@/lib/memory/types";
import { localStorageAdapter } from "@/lib/storage/localStorageAdapter";
import { syncService } from "@/lib/sync/SyncService";
import { SyncEntity } from "@/lib/sync/types";

export class HybridStorageAdapter implements StorageAdapter {
  private local = localStorageAdapter;

  // ---- helpers -----------------------------------------------------------
  private requestSync(entity: SyncEntity, recordId?: string): void {
    syncService.requestSync(entity, recordId);
  }

  // ---- version / migration -----------------------------------------------
  async getStorageVersion(): Promise<number> {
    return this.local.getStorageVersion();
  }
  async setStorageVersion(version: number): Promise<void> {
    return this.local.setStorageVersion(version);
  }
  async migrateIfNeeded(): Promise<void> {
    return this.local.migrateIfNeeded();
  }
  async ensureDefaultTemplates(): Promise<void> {
    return this.local.ensureDefaultTemplates();
  }

  // ---- objects -----------------------------------------------------------
  async getObjects(): Promise<LifeObject[]> {
    return this.local.getObjects();
  }
  async getObjectById(id: string): Promise<LifeObject | null> {
    return this.local.getObjectById(id);
  }
  async createObject(
    obj: Omit<LifeObject, "id" | "created_at" | "updated_at">
  ): Promise<LifeObject> {
    const created = await this.local.createObject(obj);
    this.requestSync("objects", created.id);
    return created;
  }
  async updateObject(
    id: string,
    updates: Partial<Omit<LifeObject, "id" | "created_at" | "updated_at">>
  ): Promise<LifeObject> {
    const updated = await this.local.updateObject(id, updates);
    this.requestSync("objects", id);
    return updated;
  }
  async deleteObject(id: string): Promise<void> {
    await this.local.deleteObject(id);
    this.requestSync("objects", id);
  }
  async deleteObjects(
    ids: string[],
    options?: { preserveNotes?: boolean }
  ): Promise<ObjectDeletionSnapshot> {
    const snapshot = await this.local.deleteObjects(ids, options);
    this.requestSync("objects");
    this.requestSync("relations");
    if (!options?.preserveNotes) {
      this.requestSync("notes");
    }
    return snapshot;
  }
  async restoreObjects(snapshot: ObjectDeletionSnapshot): Promise<void> {
    await this.local.restoreObjects(snapshot);
    this.requestSync("objects");
    this.requestSync("relations");
    this.requestSync("notes");
  }
  async setObjects(objects: LifeObject[]): Promise<void> {
    await this.local.setObjects(objects);
    this.requestSync("objects");
  }

  // ---- notes -------------------------------------------------------------
  async getNotes(): Promise<Note[]> {
    return this.local.getNotes();
  }
  async getNotesByObjectId(objectId: string): Promise<Note[]> {
    return this.local.getNotesByObjectId(objectId);
  }
  async createNote(note: Omit<Note, "id" | "created_at">): Promise<Note> {
    const created = await this.local.createNote(note);
    this.requestSync("notes", created.id);
    return created;
  }
  async deleteNote(id: string): Promise<void> {
    await this.local.deleteNote(id);
    this.requestSync("notes", id);
  }
  async setNotes(notes: Note[]): Promise<void> {
    await this.local.setNotes(notes);
    this.requestSync("notes");
  }

  // ---- relations ---------------------------------------------------------
  async getRelations(): Promise<Relation[]> {
    return this.local.getRelations();
  }
  async getRelationsByObjectId(objectId: string): Promise<Relation[]> {
    return this.local.getRelationsByObjectId(objectId);
  }
  async createRelation(
    relation: Omit<Relation, "id" | "created_at">
  ): Promise<Relation> {
    const created = await this.local.createRelation(relation);
    this.requestSync("relations", created.id);
    return created;
  }
  async deleteRelation(id: string): Promise<void> {
    await this.local.deleteRelation(id);
    this.requestSync("relations", id);
  }
  async setRelations(relations: Relation[]): Promise<void> {
    await this.local.setRelations(relations);
    this.requestSync("relations");
  }

  // ---- tags --------------------------------------------------------------
  async getTags(): Promise<Tag[]> {
    return this.local.getTags();
  }
  async createTag(tag: Omit<Tag, "id" | "createdAt" | "usageCount">): Promise<Tag> {
    const created = await this.local.createTag(tag);
    this.requestSync("tags", created.id);
    return created;
  }
  async updateTag(
    id: string,
    updates: Partial<Omit<Tag, "id" | "createdAt">>
  ): Promise<Tag> {
    const updated = await this.local.updateTag(id, updates);
    this.requestSync("tags", id);
    return updated;
  }
  async deleteTag(id: string): Promise<void> {
    await this.local.deleteTag(id);
    this.requestSync("tags", id);
  }
  async setTags(tags: Tag[]): Promise<void> {
    await this.local.setTags(tags);
    this.requestSync("tags");
  }

  // ---- templates ---------------------------------------------------------
  async getTemplates(): Promise<Template[]> {
    return this.local.getTemplates();
  }
  async createTemplate(template: TemplateCreateInput): Promise<Template> {
    const created = await this.local.createTemplate(template);
    this.requestSync("templates", created.id);
    return created;
  }
  async updateTemplate(
    id: string,
    updates: TemplateUpdateInput
  ): Promise<Template> {
    const updated = await this.local.updateTemplate(id, updates);
    this.requestSync("templates", id);
    return updated;
  }
  async deleteTemplate(id: string): Promise<void> {
    await this.local.deleteTemplate(id);
    this.requestSync("templates", id);
  }
  async setTemplates(templates: Template[]): Promise<void> {
    await this.local.setTemplates(templates);
    this.requestSync("templates");
  }

  // ---- settings ----------------------------------------------------------
  async getSettings(): Promise<Partial<AppSettings>> {
    return this.local.getSettings();
  }
  async setSettings(settings: Partial<AppSettings>): Promise<void> {
    await this.local.setSettings(settings);
    this.requestSync("settings");
  }

  // ---- ai analysis history -----------------------------------------------
  async getAIAnalysisHistory(): Promise<AIAnalysisHistoryEntry[]> {
    return this.local.getAIAnalysisHistory();
  }
  async getAIAnalysisHistoryByObjectId(
    objectId: string
  ): Promise<AIAnalysisHistoryEntry[]> {
    return this.local.getAIAnalysisHistoryByObjectId(objectId);
  }
  async getAIAnalysisHistoryByType(
    objectType: import("@/lib/types").LifeObjectType
  ): Promise<AIAnalysisHistoryEntry[]> {
    return this.local.getAIAnalysisHistoryByType(objectType);
  }
  async getAIAnalysisHistoryEntryById(
    id: string
  ): Promise<AIAnalysisHistoryEntry | null> {
    return this.local.getAIAnalysisHistoryEntryById(id);
  }
  async createAIAnalysisHistory(
    entry: Omit<AIAnalysisHistoryEntry, "id" | "createdAt">
  ): Promise<AIAnalysisHistoryEntry> {
    const created = await this.local.createAIAnalysisHistory(entry);
    this.requestSync("aiAnalysisHistory", created.id);
    return created;
  }
  async updateAIAnalysisHistoryObjectId(
    historyId: string,
    objectId: string
  ): Promise<void> {
    await this.local.updateAIAnalysisHistoryObjectId(historyId, objectId);
    this.requestSync("aiAnalysisHistory", historyId);
  }
  async deleteAIAnalysisHistory(id: string): Promise<void> {
    await this.local.deleteAIAnalysisHistory(id);
    this.requestSync("aiAnalysisHistory", id);
  }
  async clearAIAnalysisHistory(): Promise<void> {
    await this.local.clearAIAnalysisHistory();
    this.requestSync("aiAnalysisHistory");
  }
  async setAIAnalysisHistory(entries: AIAnalysisHistoryEntry[]): Promise<void> {
    await this.local.setAIAnalysisHistory(entries);
    this.requestSync("aiAnalysisHistory");
  }

  // ---- intelligence caches (local-only for P0; full sync in P1) ------------
  async getIntelligenceCache(): Promise<IntelligenceCache> {
    return this.local.getIntelligenceCache();
  }
  async setIntelligenceCache(cache: IntelligenceCache): Promise<void> {
    await this.local.setIntelligenceCache(cache);
  }
  async getIntelligenceMeta(): Promise<IntelligenceMeta> {
    return this.local.getIntelligenceMeta();
  }
  async setIntelligenceMeta(meta: IntelligenceMeta): Promise<void> {
    await this.local.setIntelligenceMeta(meta);
  }
  async getTodayStory(date: string): Promise<IntelligenceTodayStory | null> {
    return this.local.getTodayStory(date);
  }
  async createTodayStory(
    story: Omit<IntelligenceTodayStory, "id" | "createdAt">
  ): Promise<IntelligenceTodayStory> {
    return this.local.createTodayStory(story);
  }
  async getCompanionMeta(): Promise<CompanionMeta> {
    return this.local.getCompanionMeta();
  }
  async setCompanionMeta(meta: CompanionMeta): Promise<void> {
    await this.local.setCompanionMeta(meta);
  }

  // ---- long-term memory --------------------------------------------------
  async getMoments(): Promise<MemoryMoment[]> {
    return this.local.getMoments();
  }
  async createMoment(
    moment: Omit<MemoryMoment, "id" | "createdAt" | "updatedAt">
  ): Promise<MemoryMoment> {
    const created = await this.local.createMoment(moment);
    this.requestSync("moments", created.id);
    return created;
  }
  async updateMoment(
    id: string,
    updates: Partial<Omit<MemoryMoment, "id" | "createdAt">>
  ): Promise<MemoryMoment> {
    const updated = await this.local.updateMoment(id, updates);
    this.requestSync("moments", id);
    return updated;
  }
  async deleteMoment(id: string): Promise<void> {
    await this.local.deleteMoment(id);
    this.requestSync("moments", id);
  }
  async setMoments(moments: MemoryMoment[]): Promise<void> {
    await this.local.setMoments(moments);
    this.requestSync("moments");
  }

  async getChapters(): Promise<LifeChapter[]> {
    return this.local.getChapters();
  }
  async createChapter(
    chapter: Omit<LifeChapter, "id" | "createdAt" | "updatedAt">
  ): Promise<LifeChapter> {
    const created = await this.local.createChapter(chapter);
    this.requestSync("chapters", created.id);
    return created;
  }
  async updateChapter(
    id: string,
    updates: Partial<Omit<LifeChapter, "id" | "createdAt">>
  ): Promise<LifeChapter> {
    const updated = await this.local.updateChapter(id, updates);
    this.requestSync("chapters", id);
    return updated;
  }
  async deleteChapter(id: string): Promise<void> {
    await this.local.deleteChapter(id);
    this.requestSync("chapters", id);
  }
  async setChapters(chapters: LifeChapter[]): Promise<void> {
    await this.local.setChapters(chapters);
    this.requestSync("chapters");
  }

  async getMemoryRelations(): Promise<MemoryRelationEdge[]> {
    return this.local.getMemoryRelations();
  }
  async createMemoryRelation(
    edge: Omit<MemoryRelationEdge, "id" | "createdAt">
  ): Promise<MemoryRelationEdge> {
    const created = await this.local.createMemoryRelation(edge);
    this.requestSync("memoryRelations", created.id);
    return created;
  }
  async deleteMemoryRelation(id: string): Promise<void> {
    await this.local.deleteMemoryRelation(id);
    this.requestSync("memoryRelations", id);
  }
  async setMemoryRelations(edges: MemoryRelationEdge[]): Promise<void> {
    await this.local.setMemoryRelations(edges);
    this.requestSync("memoryRelations");
  }

  async getAnniversaries(): Promise<Anniversary[]> {
    return this.local.getAnniversaries();
  }
  async createAnniversary(
    anniversary: Omit<Anniversary, "id" | "createdAt">
  ): Promise<Anniversary> {
    const created = await this.local.createAnniversary(anniversary);
    this.requestSync("anniversaries", created.id);
    return created;
  }
  async deleteAnniversary(id: string): Promise<void> {
    await this.local.deleteAnniversary(id);
    this.requestSync("anniversaries", id);
  }
  async setAnniversaries(anniversaries: Anniversary[]): Promise<void> {
    await this.local.setAnniversaries(anniversaries);
    this.requestSync("anniversaries");
  }

  async getHighlights(): Promise<Highlight[]> {
    return this.local.getHighlights();
  }
  async createHighlight(
    highlight: Omit<Highlight, "id" | "createdAt">
  ): Promise<Highlight> {
    const created = await this.local.createHighlight(highlight);
    this.requestSync("highlights", created.id);
    return created;
  }
  async deleteHighlight(id: string): Promise<void> {
    await this.local.deleteHighlight(id);
    this.requestSync("highlights", id);
  }
  async setHighlights(highlights: Highlight[]): Promise<void> {
    await this.local.setHighlights(highlights);
    this.requestSync("highlights");
  }

  async getDecisions(): Promise<DecisionMemory[]> {
    return this.local.getDecisions();
  }
  async createDecision(
    decision: Omit<DecisionMemory, "id" | "createdAt" | "updatedAt">
  ): Promise<DecisionMemory> {
    const created = await this.local.createDecision(decision);
    this.requestSync("decisions", created.id);
    return created;
  }
  async updateDecision(
    id: string,
    updates: Partial<Omit<DecisionMemory, "id" | "createdAt">>
  ): Promise<DecisionMemory> {
    const updated = await this.local.updateDecision(id, updates);
    this.requestSync("decisions", id);
    return updated;
  }
  async deleteDecision(id: string): Promise<void> {
    await this.local.deleteDecision(id);
    this.requestSync("decisions", id);
  }
  async setDecisions(decisions: DecisionMemory[]): Promise<void> {
    await this.local.setDecisions(decisions);
    this.requestSync("decisions");
  }

  // ---- unified memories --------------------------------------------------
  async getMemories(): Promise<UnifiedMemory[]> {
    return this.local.getMemories();
  }
  async createMemory(
    memory: Omit<UnifiedMemory, "id" | "createdAt" | "updatedAt">
  ): Promise<UnifiedMemory> {
    const created = await this.local.createMemory(memory);
    this.requestSync("memories", created.id);
    return created;
  }
  async updateMemory(
    id: string,
    updates: Partial<Omit<UnifiedMemory, "id" | "createdAt">>
  ): Promise<UnifiedMemory> {
    const updated = await this.local.updateMemory(id, updates);
    this.requestSync("memories", id);
    return updated;
  }
  async deleteMemory(id: string): Promise<void> {
    await this.local.deleteMemory(id);
    this.requestSync("memories", id);
  }
  async setMemories(memories: UnifiedMemory[]): Promise<void> {
    await this.local.setMemories(memories);
    this.requestSync("memories");
  }
}

export const hybridStorageAdapter = new HybridStorageAdapter();
