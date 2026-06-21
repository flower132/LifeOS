import { v4 as uuidv4 } from "uuid";
import {
  LifeObject,
  Note,
  Relation,
  Tag,
  Template,
  TemplateCreateInput,
  TemplateUpdateInput,
  TEMPLATE_CATEGORIES,
} from "@/lib/types";
import {
  isValidLifeObject,
  isValidNote,
  isValidRelation,
  isValidTag,
  isValidTemplate,
  validateInputObject,
  validateInputNote,
  validateInputRelation,
  validateInputTag,
  validateInputTemplate,
} from "@/lib/validation";
import { AppSettings, StorageAdapter } from "./types";
import { getDefaultProperties, migratePropertyKeys } from "@/lib/objectProperties";
import { getDefaultTemplates } from "@/lib/templates/defaultTemplates";

const STORAGE_VERSION = 4;
const VERSION_KEY = "lifeos_version";

const KEYS = {
  objects: "lifeos_objects",
  notes: "lifeos_notes",
  relations: "lifeos_relations",
  tags: "lifeos_tags",
  templates: "lifeos_templates",
  settings: "lifeos_settings",
};

const ENTITY_KEYS = [
  KEYS.objects,
  KEYS.notes,
  KEYS.relations,
  KEYS.tags,
  KEYS.templates,
  KEYS.settings,
];

class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: "quota_exceeded" | "corrupted" | "validation"
  ) {
    super(message);
    this.name = "StorageError";
  }
}

function safeGetItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
     
    console.error(
      `[LifeOS] localStorage corruption detected for key "${key}":`,
      err
    );
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      throw new StorageError(
        `localStorage quota exceeded while writing "${key}". Consider exporting and clearing old data.`,
        "quota_exceeded"
      );
    }
    throw err;
  }
}

function backupKey(key: string): string {
  return `${key}_backup_${Date.now()}`;
}

function maybeBackup(key: string): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(key);
  if (!raw) return;

  const backups = Object.keys(window.localStorage)
    .filter((k) => k.startsWith(`${key}_backup_`))
    .sort();

  // Keep at most 3 backups per entity type to avoid unbounded growth.
  if (backups.length >= 3) {
    backups
      .slice(0, backups.length - 2)
      .forEach((k) => window.localStorage.removeItem(k));
  }

  try {
    window.localStorage.setItem(backupKey(key), raw);
  } catch {
    // Backup is best-effort; do not fail the main operation if backup fails.
  }
}

function now(): string {
  return new Date().toISOString();
}

async function recalcTagUsage(): Promise<void> {
  const tags = safeGetItem<Tag[]>(KEYS.tags, []);
  if (tags.length === 0) return;

  const counts = new Map<string, number>();
  const objects = safeGetItem<LifeObject[]>(KEYS.objects, []);

  for (const obj of objects) {
    for (const id of obj.tag_ids) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }

  const updated = tags.map((tag) => {
    const next = counts.get(tag.id) || 0;
    if (tag.usageCount === next) return tag;
    return { ...tag, usageCount: next };
  });

  safeSetItem(KEYS.tags, updated);
}

async function assertObjectExists(objectId: string, label: string): Promise<void> {
  const exists = (await localStorageAdapter.getObjects()).some(
    (object) => object.id === objectId
  );
  if (!exists) {
    throw new StorageError(`${label} object does not exist`, "validation");
  }
}

function sanitizeTagIds(tagIds: string[], existingTagIds: Set<string>): string[] {
  const sanitized: string[] = [];
  for (const id of tagIds) {
    if (existingTagIds.has(id)) {
      sanitized.push(id);
    } else {
      console.warn(`[LifeOS] Removing invalid tag reference: ${id}`);
    }
  }
  return sanitized;
}

function filterValid<T>(
  items: unknown[],
  validator: (item: unknown) => item is T,
  entityName: string
): T[] {
  const valid: T[] = [];
  for (const item of items) {
    if (validator(item)) {
      valid.push(item);
    } else {
       
      console.warn(`[LifeOS] Dropped invalid ${entityName}:`, item);
    }
  }
  return valid;
}

export class LocalStorageAdapter implements StorageAdapter {
  // Version
  async getStorageVersion(): Promise<number> {
    return safeGetItem<number>(VERSION_KEY, 0);
  }

  async setStorageVersion(version: number): Promise<void> {
    safeSetItem(VERSION_KEY, version);
  }

  async migrateIfNeeded(): Promise<void> {
    const version = await this.getStorageVersion();
    if (version >= STORAGE_VERSION) return;

    console.log(
      `[LifeOS] Migrating storage from version ${version} to ${STORAGE_VERSION}`
    );

    if (version < 2) {
      await this.migrateV1ToV2();
    }
    if (version < 3) {
      await this.migrateV2ToV3();
    }
    if (version < 4) {
      await this.migrateV3ToV4();
    }

    await this.setStorageVersion(STORAGE_VERSION);
  }

  private async migrateV1ToV2(): Promise<void> {
    // Inject default templates on first run, using the current language.
    const templates = await this.getTemplates();
    if (templates.length === 0) {
      const settings = await this.getSettings();
      const language = settings.language ?? "en";
      const initial = getDefaultTemplates(language).map((template) => ({
        ...template,
        id: uuidv4(),
        createdAt: now(),
        updatedAt: now(),
        usageCount: 0,
      }));
      safeSetItem(KEYS.templates, initial);
    }

    // Migrate old AI settings schema to new unified schema.
    const settings = await this.getSettings();
    if (
      settings.aiProvider === "openai" &&
      !settings.aiApiKey &&
      settings.openaiKey
    ) {
      settings.aiApiKey = settings.openaiKey;
      settings.aiBaseUrl = "https://api.openai.com/v1";
      if (!settings.aiModel || settings.aiModel === "default") {
        settings.aiModel = "gpt-4o-mini";
      }
    } else if (
      settings.aiProvider === "anthropic" &&
      !settings.aiApiKey &&
      settings.anthropicKey
    ) {
      settings.aiApiKey = settings.anthropicKey;
      settings.aiBaseUrl = "https://api.anthropic.com/v1";
      if (!settings.aiModel || settings.aiModel === "default") {
        settings.aiModel = "claude-3-5-sonnet-latest";
      }
    }
    await this.setSettings(settings);
  }

  private async migrateV2ToV3(): Promise<void> {
    // Ensure every existing object has a structured properties object.
    // Existing description is preserved; properties are initialized with
    // type-specific default empty values so the detail page can render them.
    const objects = await this.getObjects();
    const existingTagIds = new Set(
      (await localStorageAdapter.getTags()).map((tag) => tag.id)
    );
    let mutated = false;
    const migrated = objects.map((object) => {
      if (object.properties && typeof object.properties === "object") {
        return object;
      }
      mutated = true;
      return {
        ...object,
        properties: getDefaultProperties(),
        updated_at: now(),
      };
    });

    if (mutated) {
      // Re-sanitize tag references since we are rewriting objects.
      const sanitized = migrated.map((object) => ({
        ...object,
        tag_ids: sanitizeTagIds(object.tag_ids, existingTagIds),
      }));
      maybeBackup(KEYS.objects);
      safeSetItem(KEYS.objects, sanitized);
      await recalcTagUsage();
      console.log(
        `[LifeOS] Migrated ${sanitized.length} objects to include structured properties`
      );
    }
  }

  private async migrateV3ToV4(): Promise<void> {
    // Migrate legacy Chinese property keys to stable keys for i18n.
    const objects = await this.getObjects();
    let mutated = false;
    const migrated = objects.map((object) => {
      const migratedProperties = migratePropertyKeys(
        object.type,
        object.properties
      );
      if (migratedProperties === object.properties) {
        return object;
      }
      mutated = true;
      return {
        ...object,
        properties: migratedProperties,
        updated_at: now(),
      };
    });

    if (mutated) {
      maybeBackup(KEYS.objects);
      safeSetItem(KEYS.objects, migrated);
      console.log(
        `[LifeOS] Migrated ${migrated.length} objects to stable property keys`
      );
    }
  }

  // Objects
  async getObjects(): Promise<LifeObject[]> {
    const items = safeGetItem<unknown[]>(KEYS.objects, []);
    const valid = filterValid(items, isValidLifeObject, "object");

    // Sanitize tag references so old/corrupt data cannot reference deleted tags.
    const existingTagIds = new Set(
      (await localStorageAdapter.getTags()).map((tag) => tag.id)
    );
    let mutated = false;
    const sanitized = valid.map((obj) => {
      const cleanIds = sanitizeTagIds(obj.tag_ids, existingTagIds);
      if (cleanIds.length !== obj.tag_ids.length) {
        mutated = true;
        return { ...obj, tag_ids: cleanIds };
      }
      return obj;
    });

    if (mutated) {
      safeSetItem(KEYS.objects, sanitized);
      await recalcTagUsage();
    }

    return sanitized;
  }

  async getObjectById(id: string): Promise<LifeObject | null> {
    const objects = await this.getObjects();
    return objects.find((o) => o.id === id) ?? null;
  }

  async createObject(
    obj: Omit<LifeObject, "id" | "created_at" | "updated_at">
  ): Promise<LifeObject> {
    validateInputObject(obj);
    const existingTagIds = new Set(
      (await localStorageAdapter.getTags()).map((tag) => tag.id)
    );
    const sanitizedTagIds = sanitizeTagIds(obj.tag_ids, existingTagIds);
    const objects = await this.getObjects();
    const created: LifeObject = {
      ...obj,
      tag_ids: sanitizedTagIds,
      id: uuidv4(),
      created_at: now(),
      updated_at: now(),
    };
    maybeBackup(KEYS.objects);
    safeSetItem(KEYS.objects, [...objects, created]);
    await recalcTagUsage();
    return created;
  }

  async updateObject(
    id: string,
    updates: Partial<Omit<LifeObject, "id" | "created_at" | "updated_at">>
  ): Promise<LifeObject> {
    const objects = await this.getObjects();
    const index = objects.findIndex((o) => o.id === id);
    if (index === -1) throw new Error(`Object ${id} not found`);

    if (updates.type && !["person", "self", "event", "idea", "goal"].includes(updates.type)) {
      throw new Error(`Invalid object type: ${updates.type}`);
    }
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error("Object name cannot be empty");
    }
    if (updates.tag_ids !== undefined) {
      const existingTagIds = new Set(
        (await localStorageAdapter.getTags()).map((tag) => tag.id)
      );
      updates.tag_ids = sanitizeTagIds(updates.tag_ids, existingTagIds);
    }

    const updated: LifeObject = {
      ...objects[index],
      ...updates,
      updated_at: now(),
    };
    objects[index] = updated;
    maybeBackup(KEYS.objects);
    safeSetItem(KEYS.objects, objects);
    await recalcTagUsage();
    return updated;
  }

  async deleteObject(id: string): Promise<void> {
    const objects = (await this.getObjects()).filter((o) => o.id !== id);
    maybeBackup(KEYS.objects);
    safeSetItem(KEYS.objects, objects);

    const notes = (await this.getNotes()).filter((n) => n.object_id !== id);
    maybeBackup(KEYS.notes);
    safeSetItem(KEYS.notes, notes);

    const relations = (await this.getRelations()).filter(
      (r) => r.source_object_id !== id && r.target_object_id !== id
    );
    maybeBackup(KEYS.relations);
    safeSetItem(KEYS.relations, relations);

    await recalcTagUsage();
  }

  async setObjects(objects: LifeObject[]): Promise<void> {
    const valid = filterValid(objects, isValidLifeObject, "object");
    maybeBackup(KEYS.objects);
    safeSetItem(KEYS.objects, valid);
    await recalcTagUsage();
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    const items = safeGetItem<unknown[]>(KEYS.notes, []);
    return filterValid(items, isValidNote, "note");
  }

  async getNotesByObjectId(objectId: string): Promise<Note[]> {
    const notes = await this.getNotes();
    return notes
      .filter((n) => n.object_id === objectId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  async createNote(note: Omit<Note, "id" | "created_at">): Promise<Note> {
    validateInputNote(note);
    await assertObjectExists(note.object_id, "Note target");
    const notes = await this.getNotes();
    const created: Note = {
      ...note,
      id: uuidv4(),
      created_at: now(),
    };
    maybeBackup(KEYS.notes);
    safeSetItem(KEYS.notes, [created, ...notes]);
    return created;
  }

  async deleteNote(id: string): Promise<void> {
    const notes = (await this.getNotes()).filter((n) => n.id !== id);
    maybeBackup(KEYS.notes);
    safeSetItem(KEYS.notes, notes);
  }

  async setNotes(notes: Note[]): Promise<void> {
    const valid = filterValid(notes, isValidNote, "note");
    maybeBackup(KEYS.notes);
    safeSetItem(KEYS.notes, valid);
  }

  // Relations
  async getRelations(): Promise<Relation[]> {
    const items = safeGetItem<unknown[]>(KEYS.relations, []);
    return filterValid(items, isValidRelation, "relation");
  }

  async getRelationsByObjectId(objectId: string): Promise<Relation[]> {
    const relations = await this.getRelations();
    return relations
      .filter((r) =>
        r.source_object_id === objectId || r.target_object_id === objectId
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  async createRelation(
    relation: Omit<Relation, "id" | "created_at">
  ): Promise<Relation> {
    validateInputRelation(relation);
    if (relation.source_object_id === relation.target_object_id) {
      throw new StorageError("Relation source and target must be different", "validation");
    }
    await Promise.all([
      assertObjectExists(relation.source_object_id, "Relation source"),
      assertObjectExists(relation.target_object_id, "Relation target"),
    ]);
    const relations = await this.getRelations();
    const created: Relation = {
      ...relation,
      id: uuidv4(),
      created_at: now(),
    };
    maybeBackup(KEYS.relations);
    safeSetItem(KEYS.relations, [created, ...relations]);
    return created;
  }

  async deleteRelation(id: string): Promise<void> {
    const relations = (await this.getRelations()).filter((r) => r.id !== id);
    maybeBackup(KEYS.relations);
    safeSetItem(KEYS.relations, relations);
  }

  async setRelations(relations: Relation[]): Promise<void> {
    const valid = filterValid(relations, isValidRelation, "relation");
    maybeBackup(KEYS.relations);
    safeSetItem(KEYS.relations, valid);
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    const items = safeGetItem<unknown[]>(KEYS.tags, []);
    return filterValid(items, isValidTag, "tag");
  }

  async createTag(
    tag: Omit<Tag, "id" | "createdAt" | "usageCount">
  ): Promise<Tag> {
    validateInputTag(tag);
    const tags = await this.getTags();
    const created: Tag = {
      ...tag,
      id: uuidv4(),
      createdAt: now(),
      usageCount: 0,
    };
    maybeBackup(KEYS.tags);
    safeSetItem(KEYS.tags, [...tags, created]);
    return created;
  }

  async updateTag(
    id: string,
    updates: Partial<Omit<Tag, "id" | "createdAt">>
  ): Promise<Tag> {
    const tags = await this.getTags();
    const index = tags.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Tag ${id} not found`);
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error("Tag name cannot be empty");
    }
    const updated: Tag = {
      ...tags[index],
      ...updates,
    };
    tags[index] = updated;
    maybeBackup(KEYS.tags);
    safeSetItem(KEYS.tags, tags);
    return updated;
  }

  async deleteTag(id: string): Promise<void> {
    const tags = (await this.getTags()).filter((t) => t.id !== id);
    maybeBackup(KEYS.tags);
    safeSetItem(KEYS.tags, tags);

    const objects = await this.getObjects();
    const updatedObjects = objects.map((object) => {
      if (!object.tag_ids.includes(id)) return object;
      return {
        ...object,
        tag_ids: object.tag_ids.filter((tagId) => tagId !== id),
        updated_at: now(),
      };
    });
    maybeBackup(KEYS.objects);
    safeSetItem(KEYS.objects, updatedObjects);
    await recalcTagUsage();
  }

  async setTags(tags: Tag[]): Promise<void> {
    const valid = filterValid(tags, isValidTag, "tag");
    maybeBackup(KEYS.tags);
    safeSetItem(KEYS.tags, valid);
    await recalcTagUsage();
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    const items = safeGetItem<unknown[]>(KEYS.templates, []);
    return filterValid(items, isValidTemplate, "template");
  }

  async createTemplate(template: TemplateCreateInput): Promise<Template> {
    validateInputTemplate(template);
    const templates = await this.getTemplates();
    const created: Template = {
      ...template,
      id: uuidv4(),
      createdAt: now(),
      updatedAt: now(),
      usageCount: 0,
    };
    maybeBackup(KEYS.templates);
    safeSetItem(KEYS.templates, [...templates, created]);
    return created;
  }

  async updateTemplate(
    id: string,
    updates: TemplateUpdateInput
  ): Promise<Template> {
    const templates = await this.getTemplates();
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Template ${id} not found`);

    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error("Template name cannot be empty");
    }
    if (
      updates.category !== undefined &&
      !TEMPLATE_CATEGORIES.includes(updates.category)
    ) {
      throw new Error(`Invalid template category: ${updates.category}`);
    }

    const updated: Template = {
      ...templates[index],
      ...updates,
      updatedAt: now(),
    };
    templates[index] = updated;
    maybeBackup(KEYS.templates);
    safeSetItem(KEYS.templates, templates);
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = (await this.getTemplates()).filter((t) => t.id !== id);
    maybeBackup(KEYS.templates);
    safeSetItem(KEYS.templates, templates);
  }

  async setTemplates(templates: Template[]): Promise<void> {
    const valid = filterValid(templates, isValidTemplate, "template");
    maybeBackup(KEYS.templates);
    safeSetItem(KEYS.templates, valid);
  }

  // Settings
  async getSettings(): Promise<Partial<AppSettings>> {
    return safeGetItem<Partial<AppSettings>>(KEYS.settings, {});
  }

  async setSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    maybeBackup(KEYS.settings);
    safeSetItem(KEYS.settings, { ...current, ...settings });
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
export { StorageError, STORAGE_VERSION, ENTITY_KEYS };
