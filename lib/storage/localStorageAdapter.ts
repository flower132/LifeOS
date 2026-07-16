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
import {
  isValidLifeObject,
  isValidNote,
  isValidRelation,
  isValidTag,
  isValidTemplate,
  isValidAIAnalysisHistoryEntry,
  isValidIntelligenceCache,
  isValidIntelligenceMeta,
  isValidIntelligenceTodayStory,
  isValidCompanionMeta,
  isValidMemoryMoment,
  isValidLifeChapter,
  isValidMemoryRelationEdge,
  isValidAnniversary,
  isValidHighlight,
  isValidDecisionMemory,
  validateInputObject,
  validateInputNote,
  validateInputRelation,
  validateInputTag,
  validateInputTemplate,
} from "@/lib/validation";
import { AppSettings, StorageAdapter } from "./types";
import {
  getDefaultProperties,
  migratePropertyKeys,
  PROPERTY_SCHEMAS,
  templateToProperties,
} from "@/lib/objectProperties";
import {
  getDefaultTemplates,
  CURRENT_TEMPLATE_VERSION,
  migrateLegacyTemplateContent,
} from "@/lib/templates/defaultTemplates";

const STORAGE_VERSION = 6;
const VERSION_KEY = "lifeos_version";

const KEYS = {
  objects: "lifeos_objects",
  notes: "lifeos_notes",
  relations: "lifeos_relations",
  tags: "lifeos_tags",
  templates: "lifeos_templates",
  settings: "lifeos_settings",
  aiAnalysisHistory: "lifeos_ai_analysis_history",
  intelligenceCache: "lifeos_intelligence_cache",
  intelligenceMeta: "lifeos_intelligence_meta",
  todayStories: "lifeos_today_stories",
  companionMeta: "lifeos_companion_meta",
  // Long-term Memory
  moments: "lifeos_moments",
  chapters: "lifeos_chapters",
  memoryRelations: "lifeos_memory_relations",
  anniversaries: "lifeos_anniversaries",
  highlights: "lifeos_highlights",
  decisions: "lifeos_decisions",
};

const DEFAULT_INTELLIGENCE_CACHE: IntelligenceCache = {
  chapters: [],
  patterns: [],
  relationshipPatterns: [],
  decisions: [],
  decisionPatterns: [],
  growthSnapshots: [],
  themeSnapshots: [],
  crossObjectInsights: [],
  reflectionQuestions: [],
  todayStories: [],
  todayFocuses: [],
  reminders: [],
  reflections: [],
  dailyTimelines: [],
  weeklyReviews: [],
  monthlyStories: [],
  feedback: [],
};

const DEFAULT_INTELLIGENCE_META: IntelligenceMeta = {
  lastFullAnalysisAt: null,
  lastIncrementalAnalysisAt: null,
  analysisVersion: "1.0.0",
  pendingUpdate: false,
};

const DEFAULT_COMPANION_META: CompanionMeta = {
  lastFocusDate: null,
  lastReminderDate: null,
  lastReflectionDate: null,
  lastWeeklyWeekKey: null,
  lastMonthlyMonthKey: null,
  consecutiveRejections: 0,
  lastAppearanceAt: null,
  appearanceCountToday: 0,
};

const ENTITY_KEYS = [
  KEYS.objects,
  KEYS.notes,
  KEYS.relations,
  KEYS.tags,
  KEYS.templates,
  KEYS.settings,
  KEYS.intelligenceCache,
  KEYS.intelligenceMeta,
  KEYS.todayStories,
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

function looksLikeTemplateContent(
  content: string,
  type: string,
  schemaLabelsByType: Record<string, Set<string>>
): boolean {
  const schemaLabels = schemaLabelsByType[type];
  if (!schemaLabels) return false;

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Short free-text descriptions are unlikely to be templates.
  if (lines.length < 3) return false;

  let labelMatches = 0;
  let labelLines = 0;

  for (const line of lines) {
    const match = line.match(/^(.+?)[：:]\s*(.*)$/);
    if (!match) continue;
    const label = match[1].trim().toLowerCase();
    if (!label) continue;
    labelLines++;
    if (schemaLabels.has(label)) {
      labelMatches++;
    }
  }

  // Consider it a template if a majority of labeled lines match known schema
  // labels, or if it contains markdown headings.
  const hasHeadings = lines.some((line) => line.startsWith("#"));
  return hasHeadings || (labelLines > 0 && labelMatches / labelLines >= 0.5);
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
    // Always ensure default templates are present and up-to-date, regardless of
    // storage version. This repairs old default templates stored in localStorage.
    await this.ensureDefaultTemplates();

    const version = await this.getStorageVersion();
    if (version >= STORAGE_VERSION) return;

    if (version < 2) {
      await this.migrateV1ToV2();
    }
    if (version < 3) {
      await this.migrateV2ToV3();
    }
    if (version < 4) {
      await this.migrateV3ToV4();
    }
    if (version < 5) {
      await this.migrateV4ToV5();
    }
    if (version < 6) {
      await this.migrateV5ToV6();
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
    }
  }

  private async migrateV4ToV5(): Promise<void> {
    // Stop storing raw template markdown in description. For objects whose
    // description looks like an auto-generated default template, parse any
    // remaining fields into properties and clear the description. Manual
    // descriptions are left untouched.
    const objects = await this.getObjects();
    const schemaLabelsByType: Record<string, Set<string>> = Object.fromEntries(
      Object.entries(PROPERTY_SCHEMAS).map(([type, fields]) => [
        type,
        new Set(
          fields.flatMap((f) => [
            f.label.zh,
            f.label.en.toLowerCase(),
            ...(f.legacyLabels?.zh ?? []),
            ...(f.legacyLabels?.en?.map((l) => l.toLowerCase()) ?? []),
          ])
        ),
      ])
    );

    let mutated = false;
    const migrated = objects.map((object) => {
      let nextProperties = object.properties;
      let nextDescription = object.description;

      if (
        object.description &&
        typeof object.description === "string" &&
        looksLikeTemplateContent(object.description, object.type, schemaLabelsByType)
      ) {
        const parsed = templateToProperties(object.type, object.description);
        nextProperties = { ...parsed, ...object.properties };
        nextDescription = undefined;
      }

      const migratedProperties = migratePropertyKeys(
        object.type,
        nextProperties
      );

      if (
        migratedProperties === object.properties &&
        nextDescription === object.description
      ) {
        return object;
      }

      mutated = true;
      const next: LifeObject = {
        ...object,
        properties: migratedProperties,
        updated_at: now(),
      };
      if (nextDescription !== object.description) {
        next.description = nextDescription;
      }
      return next;
    });

    if (mutated) {
      maybeBackup(KEYS.objects);
      safeSetItem(KEYS.objects, migrated);
    }
  }

  private async migrateV5ToV6(): Promise<void> {
    // Add default sourceType and attachments fields to notes created before
    // the Living Person MVP introduced structured intelligence capture.
    const notes = await this.getNotes();
    let mutated = false;
    const migrated = notes.map((note) => {
      if (
        (note.sourceType !== undefined && note.sourceType !== null) &&
        note.attachments !== undefined
      ) {
        return note;
      }
      mutated = true;
      return {
        ...note,
        sourceType: note.sourceType || "text",
        attachments: note.attachments || [],
      };
    });

    if (mutated) {
      maybeBackup(KEYS.notes);
      safeSetItem(KEYS.notes, migrated);
    }
  }

  async ensureDefaultTemplates(): Promise<void> {
    // Ensure all default templates exist and are up-to-date. Old default
    // templates stored in localStorage are upgraded to the latest content and
    // version, while preserving id/createdAt/usageCount/lastUsedAt.
    const settings = await this.getSettings();
    const language = settings.language ?? "en";
    const latestDefaults = getDefaultTemplates(language);
    const latestByCategory = new Map(
      latestDefaults.map((template) => [template.category, template])
    );

    const storedTemplates = await this.getTemplates();
    const storedByCategory = new Map(
      storedTemplates
        .filter((template) => template.isDefault)
        .map((template) => [template.category, template])
    );

    let mutated = false;
    const nextTemplates: Template[] = [];

    for (const template of storedTemplates) {
      const latest = latestByCategory.get(template.category);
      if (!latest || !template.isDefault) {
        nextTemplates.push(template);
        continue;
      }

      const currentVersion = template.templateVersion ?? 0;
      const needsUpgrade = currentVersion < CURRENT_TEMPLATE_VERSION;
      const migratedContent = migrateLegacyTemplateContent(template.content);
      const contentChanged =
        migratedContent !== template.content ||
        template.name !== latest.name ||
        needsUpgrade;

      if (contentChanged) {
        mutated = true;
        nextTemplates.push({
          ...template,
          name: latest.name,
          content: migratedContent,
          templateVersion: CURRENT_TEMPLATE_VERSION,
          updatedAt: now(),
        });
      } else {
        nextTemplates.push(template);
      }
    }

    // Add any missing default templates.
    for (const latest of latestDefaults) {
      if (!storedByCategory.has(latest.category)) {
        mutated = true;
        nextTemplates.push({
          ...latest,
          id: uuidv4(),
          createdAt: now(),
          updatedAt: now(),
          usageCount: 0,
        });
      }
    }

    if (mutated) {
      maybeBackup(KEYS.templates);
      safeSetItem(KEYS.templates, nextTemplates);
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

    if (updates.type && !["person", "self", "event", "idea", "goal", "project", "knowledge"].includes(updates.type)) {
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

  async deleteObjects(
    ids: string[],
    options?: { preserveNotes?: boolean }
  ): Promise<ObjectDeletionSnapshot> {
    const preserveNotes = options?.preserveNotes !== false;
    const idSet = new Set(ids);
    const deletedAt = Date.now();

    const allObjects = await this.getObjects();
    const deletedObjects = allObjects.filter((o) => idSet.has(o.id));
    const remainingObjects = allObjects.filter((o) => !idSet.has(o.id));

    const allNotes = await this.getNotes();
    const notesToUnlink = preserveNotes
      ? allNotes.filter((n) => n.object_id !== null && idSet.has(n.object_id))
      : [];
    const notesSnapshot: Note[] = notesToUnlink.map((n) => ({ ...n }));
    const remainingNotes = preserveNotes
      ? allNotes.map((n) =>
          n.object_id !== null && idSet.has(n.object_id)
            ? { ...n, object_id: null }
            : n
        )
      : allNotes.filter((n) => n.object_id === null || !idSet.has(n.object_id));

    const allRelations = await this.getRelations();
    const deletedRelations = allRelations.filter(
      (r) => idSet.has(r.source_object_id) || idSet.has(r.target_object_id)
    );
    const remainingRelations = allRelations.filter(
      (r) =>
        !idSet.has(r.source_object_id) && !idSet.has(r.target_object_id)
    );

    const allHistory = await this.getAIAnalysisHistory();
    const historyEntries = allHistory
      .filter((h) => h.objectId !== undefined && idSet.has(h.objectId))
      .map((h) => ({ id: h.id, objectId: h.objectId as string }));
    const remainingHistory = allHistory.map((h) =>
      h.objectId !== undefined && idSet.has(h.objectId)
        ? { ...h, objectId: undefined }
        : h
    );

    maybeBackup(KEYS.objects);
    safeSetItem(KEYS.objects, remainingObjects);
    maybeBackup(KEYS.notes);
    safeSetItem(KEYS.notes, remainingNotes);
    maybeBackup(KEYS.relations);
    safeSetItem(KEYS.relations, remainingRelations);
    maybeBackup(KEYS.aiAnalysisHistory);
    safeSetItem(KEYS.aiAnalysisHistory, remainingHistory);

    await recalcTagUsage();

    return {
      objects: deletedObjects,
      relations: deletedRelations,
      notes: notesSnapshot,
      aiHistoryEntries: historyEntries,
      deletedAt,
    };
  }

  async restoreObjects(snapshot: ObjectDeletionSnapshot): Promise<void> {
    const objects = await this.getObjects();
    const existingIds = new Set(objects.map((o) => o.id));
    const objectsToRestore = snapshot.objects.filter((o) => !existingIds.has(o.id));
    const nextObjects = [...objectsToRestore, ...objects];

    const notes = await this.getNotes();
    const noteTargetMap = new Map(
      snapshot.notes.map((n) => [n.id, n.object_id])
    );
    const nextNotes = notes.map((n) => {
      if (noteTargetMap.has(n.id)) {
        return { ...n, object_id: noteTargetMap.get(n.id) ?? n.object_id };
      }
      return n;
    });

    const relations = await this.getRelations();
    const relationIds = new Set(relations.map((r) => r.id));
    const relationsToRestore = snapshot.relations.filter(
      (r) => !relationIds.has(r.id)
    );
    const nextRelations = [...relationsToRestore, ...relations];

    const history = await this.getAIAnalysisHistory();
    const historyTargetMap = new Map(
      snapshot.aiHistoryEntries.map((h) => [h.id, h.objectId])
    );
    const nextHistory = history.map((h) => {
      if (historyTargetMap.has(h.id)) {
        return { ...h, objectId: historyTargetMap.get(h.id) };
      }
      return h;
    });

    maybeBackup(KEYS.objects);
    safeSetItem(KEYS.objects, nextObjects);
    maybeBackup(KEYS.notes);
    safeSetItem(KEYS.notes, nextNotes);
    maybeBackup(KEYS.relations);
    safeSetItem(KEYS.relations, nextRelations);
    maybeBackup(KEYS.aiAnalysisHistory);
    safeSetItem(KEYS.aiAnalysisHistory, nextHistory);

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
    if (!note.object_id) {
      throw new StorageError("Note object_id is required", "validation");
    }
    await assertObjectExists(note.object_id, "Note target");
    const notes = await this.getNotes();
    const created: Note = {
      ...note,
      sourceType: note.sourceType || "text",
      attachments: note.attachments || [],
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

  // AI Analysis History
  async getAIAnalysisHistory(): Promise<AIAnalysisHistoryEntry[]> {
    const items = safeGetItem<unknown[]>(KEYS.aiAnalysisHistory, []);
    return filterValid(items, isValidAIAnalysisHistoryEntry, "aiAnalysisHistory");
  }

  async getAIAnalysisHistoryByObjectId(
    objectId: string
  ): Promise<AIAnalysisHistoryEntry[]> {
    const history = await this.getAIAnalysisHistory();
    return history
      .filter((h) => h.objectId === objectId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getAIAnalysisHistoryByType(
    objectType: import("@/lib/types").LifeObjectType
  ): Promise<AIAnalysisHistoryEntry[]> {
    const history = await this.getAIAnalysisHistory();
    return history
      .filter((h) => h.objectType === objectType)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getAIAnalysisHistoryEntryById(
    id: string
  ): Promise<AIAnalysisHistoryEntry | null> {
    const history = await this.getAIAnalysisHistory();
    return history.find((h) => h.id === id) ?? null;
  }

  async createAIAnalysisHistory(
    entry: Omit<AIAnalysisHistoryEntry, "id" | "createdAt">
  ): Promise<AIAnalysisHistoryEntry> {
    const history = await this.getAIAnalysisHistory();
    const created: AIAnalysisHistoryEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: now(),
    };
    const MAX_HISTORY = 50;
    const next = [created, ...history].slice(0, MAX_HISTORY);
    maybeBackup(KEYS.aiAnalysisHistory);
    safeSetItem(KEYS.aiAnalysisHistory, next);
    return created;
  }

  async updateAIAnalysisHistoryObjectId(
    historyId: string,
    objectId: string
  ): Promise<void> {
    const history = await this.getAIAnalysisHistory();
    const updated = history.map((h) =>
      h.id === historyId ? { ...h, objectId } : h
    );
    maybeBackup(KEYS.aiAnalysisHistory);
    safeSetItem(KEYS.aiAnalysisHistory, updated);
  }

  async deleteAIAnalysisHistory(id: string): Promise<void> {
    const history = (await this.getAIAnalysisHistory()).filter(
      (h) => h.id !== id
    );
    maybeBackup(KEYS.aiAnalysisHistory);
    safeSetItem(KEYS.aiAnalysisHistory, history);
  }

  async clearAIAnalysisHistory(): Promise<void> {
    if (typeof window === "undefined") return;
    maybeBackup(KEYS.aiAnalysisHistory);
    window.localStorage.removeItem(KEYS.aiAnalysisHistory);
  }

  async setAIAnalysisHistory(entries: AIAnalysisHistoryEntry[]): Promise<void> {
    const valid = entries.filter((e) => isValidAIAnalysisHistoryEntry(e));
    safeSetItem(KEYS.aiAnalysisHistory, valid);
  }

  // Intelligence Engine caches
  async getIntelligenceCache(): Promise<IntelligenceCache> {
    const raw = safeGetItem<unknown>(KEYS.intelligenceCache, null);
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      // Merge with defaults so older caches missing new Daily Companion arrays
      // continue to work without being reset.
      return { ...DEFAULT_INTELLIGENCE_CACHE, ...raw } as IntelligenceCache;
    }
    return DEFAULT_INTELLIGENCE_CACHE;
  }

  async setIntelligenceCache(cache: IntelligenceCache): Promise<void> {
    if (!isValidIntelligenceCache(cache)) {
      throw new StorageError("Invalid intelligence cache", "validation");
    }
    safeSetItem(KEYS.intelligenceCache, cache);
  }

  async getIntelligenceMeta(): Promise<IntelligenceMeta> {
    const raw = safeGetItem<unknown>(KEYS.intelligenceMeta, null);
    if (isValidIntelligenceMeta(raw)) {
      return raw;
    }
    return DEFAULT_INTELLIGENCE_META;
  }

  async setIntelligenceMeta(meta: IntelligenceMeta): Promise<void> {
    if (!isValidIntelligenceMeta(meta)) {
      throw new StorageError("Invalid intelligence meta", "validation");
    }
    safeSetItem(KEYS.intelligenceMeta, meta);
  }

  // Daily Companion meta
  async getCompanionMeta(): Promise<CompanionMeta> {
    const raw = safeGetItem<unknown>(KEYS.companionMeta, null);
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const merged = { ...DEFAULT_COMPANION_META, ...raw };
      if (isValidCompanionMeta(merged)) {
        return merged as CompanionMeta;
      }
    }
    return DEFAULT_COMPANION_META;
  }

  async setCompanionMeta(meta: CompanionMeta): Promise<void> {
    if (!isValidCompanionMeta(meta)) {
      throw new StorageError("Invalid companion meta", "validation");
    }
    safeSetItem(KEYS.companionMeta, meta);
  }

  async getTodayStory(date: string): Promise<IntelligenceTodayStory | null> {
    const stories = safeGetItem<unknown[]>(KEYS.todayStories, []);
    if (!Array.isArray(stories)) return null;
    const valid = filterValid(stories, isValidIntelligenceTodayStory, "todayStory");
    return valid.find((s) => s.date === date) ?? null;
  }

  async createTodayStory(
    story: Omit<IntelligenceTodayStory, "id" | "createdAt">
  ): Promise<IntelligenceTodayStory> {
    if (!story.date || typeof story.story !== "string" || story.story.trim().length === 0) {
      throw new StorageError("Invalid today story", "validation");
    }
    const stories = safeGetItem<unknown[]>(KEYS.todayStories, []);
    const valid = filterValid(stories, isValidIntelligenceTodayStory, "todayStory");
    const created: IntelligenceTodayStory = {
      ...story,
      id: uuidv4(),
      createdAt: now(),
    };
    const next = [created, ...valid.filter((s) => s.date !== story.date)].slice(0, 30);
    safeSetItem(KEYS.todayStories, next);
    return created;
  }

  // ── Long-term Memory: Moments ──────────────────────────────────────────────
  async getMoments(): Promise<MemoryMoment[]> {
    const items = safeGetItem<unknown[]>(KEYS.moments, []);
    return filterValid(items, isValidMemoryMoment, "moment");
  }

  async createMoment(
    moment: Omit<MemoryMoment, "id" | "createdAt" | "updatedAt">
  ): Promise<MemoryMoment> {
    const moments = await this.getMoments();
    const created: MemoryMoment = {
      ...moment,
      id: uuidv4(),
      createdAt: now(),
      updatedAt: now(),
    };
    maybeBackup(KEYS.moments);
    safeSetItem(KEYS.moments, [...moments, created]);
    return created;
  }

  async updateMoment(
    id: string,
    updates: Partial<Omit<MemoryMoment, "id" | "createdAt">>
  ): Promise<MemoryMoment> {
    const moments = await this.getMoments();
    const index = moments.findIndex((m) => m.id === id);
    if (index === -1) throw new StorageError("Moment not found", "validation");
    const updated: MemoryMoment = { ...moments[index], ...updates, updatedAt: now() };
    moments[index] = updated;
    maybeBackup(KEYS.moments);
    safeSetItem(KEYS.moments, moments);
    return updated;
  }

  async deleteMoment(id: string): Promise<void> {
    const moments = (await this.getMoments()).filter((m) => m.id !== id);
    maybeBackup(KEYS.moments);
    safeSetItem(KEYS.moments, moments);
  }

  async setMoments(moments: MemoryMoment[]): Promise<void> {
    const valid = filterValid(moments, isValidMemoryMoment, "moment");
    maybeBackup(KEYS.moments);
    safeSetItem(KEYS.moments, valid);
  }

  // ── Long-term Memory: Chapters ─────────────────────────────────────────────
  async getChapters(): Promise<LifeChapter[]> {
    const items = safeGetItem<unknown[]>(KEYS.chapters, []);
    return filterValid(items, isValidLifeChapter, "chapter");
  }

  async createChapter(
    chapter: Omit<LifeChapter, "id" | "createdAt" | "updatedAt">
  ): Promise<LifeChapter> {
    const chapters = await this.getChapters();
    const created: LifeChapter = {
      ...chapter,
      id: uuidv4(),
      createdAt: now(),
      updatedAt: now(),
    };
    maybeBackup(KEYS.chapters);
    safeSetItem(KEYS.chapters, [...chapters, created]);
    return created;
  }

  async updateChapter(
    id: string,
    updates: Partial<Omit<LifeChapter, "id" | "createdAt">>
  ): Promise<LifeChapter> {
    const chapters = await this.getChapters();
    const index = chapters.findIndex((c) => c.id === id);
    if (index === -1) throw new StorageError("Chapter not found", "validation");
    const updated: LifeChapter = { ...chapters[index], ...updates, updatedAt: now() };
    chapters[index] = updated;
    maybeBackup(KEYS.chapters);
    safeSetItem(KEYS.chapters, chapters);
    return updated;
  }

  async deleteChapter(id: string): Promise<void> {
    const chapters = (await this.getChapters()).filter((c) => c.id !== id);
    maybeBackup(KEYS.chapters);
    safeSetItem(KEYS.chapters, chapters);
  }

  async setChapters(chapters: LifeChapter[]): Promise<void> {
    const valid = filterValid(chapters, isValidLifeChapter, "chapter");
    maybeBackup(KEYS.chapters);
    safeSetItem(KEYS.chapters, valid);
  }

  // ── Long-term Memory: Memory Relations ─────────────────────────────────────
  async getMemoryRelations(): Promise<MemoryRelationEdge[]> {
    const items = safeGetItem<unknown[]>(KEYS.memoryRelations, []);
    return filterValid(items, isValidMemoryRelationEdge, "memoryRelation");
  }

  async createMemoryRelation(
    edge: Omit<MemoryRelationEdge, "id" | "createdAt">
  ): Promise<MemoryRelationEdge> {
    const edges = await this.getMemoryRelations();
    const created: MemoryRelationEdge = {
      ...edge,
      id: uuidv4(),
      createdAt: now(),
    };
    maybeBackup(KEYS.memoryRelations);
    safeSetItem(KEYS.memoryRelations, [...edges, created]);
    return created;
  }

  async deleteMemoryRelation(id: string): Promise<void> {
    const edges = (await this.getMemoryRelations()).filter((e) => e.id !== id);
    maybeBackup(KEYS.memoryRelations);
    safeSetItem(KEYS.memoryRelations, edges);
  }

  async setMemoryRelations(edges: MemoryRelationEdge[]): Promise<void> {
    const valid = filterValid(edges, isValidMemoryRelationEdge, "memoryRelation");
    maybeBackup(KEYS.memoryRelations);
    safeSetItem(KEYS.memoryRelations, valid);
  }

  // ── Long-term Memory: Anniversaries ────────────────────────────────────────
  async getAnniversaries(): Promise<Anniversary[]> {
    const items = safeGetItem<unknown[]>(KEYS.anniversaries, []);
    return filterValid(items, isValidAnniversary, "anniversary");
  }

  async createAnniversary(
    anniversary: Omit<Anniversary, "id" | "createdAt">
  ): Promise<Anniversary> {
    const anniversaries = await this.getAnniversaries();
    const created: Anniversary = {
      ...anniversary,
      id: uuidv4(),
      createdAt: now(),
    };
    maybeBackup(KEYS.anniversaries);
    safeSetItem(KEYS.anniversaries, [...anniversaries, created]);
    return created;
  }

  async deleteAnniversary(id: string): Promise<void> {
    const anniversaries = (await this.getAnniversaries()).filter((a) => a.id !== id);
    maybeBackup(KEYS.anniversaries);
    safeSetItem(KEYS.anniversaries, anniversaries);
  }

  async setAnniversaries(anniversaries: Anniversary[]): Promise<void> {
    const valid = filterValid(anniversaries, isValidAnniversary, "anniversary");
    maybeBackup(KEYS.anniversaries);
    safeSetItem(KEYS.anniversaries, valid);
  }

  // ── Long-term Memory: Highlights ───────────────────────────────────────────
  async getHighlights(): Promise<Highlight[]> {
    const items = safeGetItem<unknown[]>(KEYS.highlights, []);
    return filterValid(items, isValidHighlight, "highlight");
  }

  async createHighlight(
    highlight: Omit<Highlight, "id" | "createdAt">
  ): Promise<Highlight> {
    const highlights = await this.getHighlights();
    const created: Highlight = {
      ...highlight,
      id: uuidv4(),
      createdAt: now(),
    };
    maybeBackup(KEYS.highlights);
    safeSetItem(KEYS.highlights, [...highlights, created]);
    return created;
  }

  async deleteHighlight(id: string): Promise<void> {
    const highlights = (await this.getHighlights()).filter((h) => h.id !== id);
    maybeBackup(KEYS.highlights);
    safeSetItem(KEYS.highlights, highlights);
  }

  async setHighlights(highlights: Highlight[]): Promise<void> {
    const valid = filterValid(highlights, isValidHighlight, "highlight");
    maybeBackup(KEYS.highlights);
    safeSetItem(KEYS.highlights, valid);
  }

  // ── Long-term Memory: Decisions ────────────────────────────────────────────
  async getDecisions(): Promise<DecisionMemory[]> {
    const items = safeGetItem<unknown[]>(KEYS.decisions, []);
    return filterValid(items, isValidDecisionMemory, "decision");
  }

  async createDecision(
    decision: Omit<DecisionMemory, "id" | "createdAt" | "updatedAt">
  ): Promise<DecisionMemory> {
    const decisions = await this.getDecisions();
    const created: DecisionMemory = {
      ...decision,
      id: uuidv4(),
      createdAt: now(),
      updatedAt: now(),
    };
    maybeBackup(KEYS.decisions);
    safeSetItem(KEYS.decisions, [created, ...decisions]);
    return created;
  }

  async updateDecision(
    id: string,
    updates: Partial<Omit<DecisionMemory, "id" | "createdAt">>
  ): Promise<DecisionMemory> {
    const decisions = await this.getDecisions();
    const index = decisions.findIndex((d) => d.id === id);
    if (index === -1) throw new StorageError("Decision not found", "validation");
    const updated: DecisionMemory = { ...decisions[index], ...updates, updatedAt: now() };
    decisions[index] = updated;
    maybeBackup(KEYS.decisions);
    safeSetItem(KEYS.decisions, decisions);
    return updated;
  }

  async deleteDecision(id: string): Promise<void> {
    const decisions = (await this.getDecisions()).filter((d) => d.id !== id);
    maybeBackup(KEYS.decisions);
    safeSetItem(KEYS.decisions, decisions);
  }

  async setDecisions(decisions: DecisionMemory[]): Promise<void> {
    const valid = filterValid(decisions, isValidDecisionMemory, "decision");
    maybeBackup(KEYS.decisions);
    safeSetItem(KEYS.decisions, valid);
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
export { StorageError, STORAGE_VERSION, ENTITY_KEYS };
