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
} from "@/lib/types";
import { AppSettings, StorageAdapter } from "@/lib/storage/types";
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
}

export const hybridStorageAdapter = new HybridStorageAdapter();
