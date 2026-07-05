import { StorageAdapter } from "./types";
import {
  LifeObject, Note, Relation, Tag, Template,
  TemplateCreateInput, TemplateUpdateInput,
  AIAnalysisHistoryEntry, ObjectAIProfile, NoteAttachment,
  ObjectDeletionSnapshot,
} from "@/lib/types";
import { getSupabase, resetSupabase } from "@/lib/supabaseClient";
import { generateId } from "@/lib/id";

const toISO = (d: unknown) =>
  d ? new Date(d as string | number).toISOString() : new Date().toISOString();

function getUid(): Promise<string | null> {
  return getSupabase().auth.getUser().then(({ data }) => data.user?.id ?? null);
}

type DbRow = Record<string, unknown>;

function getString(row: DbRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function getOptionalString(row: DbRow, key: string): string | undefined {
  const value = row[key];
  if (value === undefined || value === null) return undefined;
  return typeof value === "string" ? value : undefined;
}

function getNumber(row: DbRow, key: string): number {
  const value = row[key];
  return typeof value === "number" ? value : 0;
}

function getBoolean(row: DbRow, key: string): boolean {
  const value = row[key];
  return typeof value === "boolean" ? value : false;
}

function getArray<T>(row: DbRow, key: string): T[] {
  const value = row[key];
  return Array.isArray(value) ? value : [];
}

function getRecord(row: DbRow, key: string): Record<string, unknown> {
  const value = row[key];
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

// ---------- helpers ----------
function mapObject(r: DbRow): LifeObject {
  return {
    id: getString(r, "id"),
    type: getString(r, "type") as LifeObject["type"],
    name: getString(r, "name"),
    description: getOptionalString(r, "description"),
    properties: getRecord(r, "properties"),
    aiProfile: r.ai_profile !== null && r.ai_profile !== undefined
      ? (r.ai_profile as ObjectAIProfile)
      : undefined,
    aiInsights: getArray(r, "ai_insights"),
    aiSuggestions: getArray(r, "ai_suggestions"),
    memories: getArray(r, "memories"),
    tag_ids: getArray(r, "tag_ids"),
    created_at: toISO(r.created_at),
    updated_at: toISO(r.updated_at),
  };
}

function mapNote(r: DbRow): Note {
  return {
    id: getString(r, "id"),
    object_id: getString(r, "object_id"),
    content: getString(r, "content"),
    sourceType: (getString(r, "source_type") as Note["sourceType"]) || "text",
    attachments: getArray<NoteAttachment>(r, "attachments"),
    created_at: toISO(r.created_at),
  };
}

function mapRelation(r: DbRow): Relation {
  return {
    id: getString(r, "id"),
    source_object_id: getString(r, "source_object_id"),
    target_object_id: getString(r, "target_object_id"),
    type: getString(r, "type") as Relation["type"],
    strength: typeof r.strength === "number" ? r.strength : undefined,
    note: getOptionalString(r, "note"),
    created_at: toISO(r.created_at),
  };
}

function mapTag(r: DbRow): Tag {
  return {
    id: getString(r, "id"),
    name: getString(r, "name"),
    color: getOptionalString(r, "color"),
    createdAt: toISO(r.created_at),
    usageCount: getNumber(r, "usage_count"),
  };
}

function mapTemplate(r: DbRow): Template {
  return {
    id: getString(r, "id"),
    name: getString(r, "name"),
    category: getString(r, "category") as Template["category"],
    isDefault: getBoolean(r, "is_default"),
    content: getString(r, "content"),
    templateVersion: getNumber(r, "template_version") || 1,
    createdAt: toISO(r.created_at),
    updatedAt: toISO(r.updated_at),
    usageCount: getNumber(r, "usage_count"),
    lastUsedAt: r.last_used_at ? toISO(r.last_used_at) : undefined,
  };
}

function mapSettings(rows: DbRow[]): Record<string, unknown> {
  const s: Record<string, unknown> = {};
  for (const r of rows) {
    const key = getString(r, "key");
    if (key) s[key] = r.value;
  }
  return s;
}

function mapHistory(r: DbRow): AIAnalysisHistoryEntry {
  const profileSnapshot = r.profile_snapshot;
  return {
    id: getString(r, "id"),
    objectType: getString(r, "object_type") as AIAnalysisHistoryEntry["objectType"],
    objectId: getOptionalString(r, "object_id"),
    createdAt: toISO(r.created_at),
    rawTextInput: getString(r, "raw_text_input"),
    imageCount: getNumber(r, "image_count"),
    imageThumbnails: getArray<string>(r, "image_thumbnails"),
    provider: getString(r, "provider"),
    model: getString(r, "model"),
    durationMs: getNumber(r, "duration_ms"),
    rawOutput: getString(r, "raw_output"),
    profileSnapshot:
      profileSnapshot !== null &&
      profileSnapshot !== undefined &&
      typeof profileSnapshot === "object" &&
      !Array.isArray(profileSnapshot)
        ? (profileSnapshot as ObjectAIProfile)
        : undefined,
    insightsSnapshot: getArray(r, "insights_snapshot"),
    suggestionsSnapshot: getArray(r, "suggestions_snapshot"),
    memoriesSnapshot: getArray(r, "memories_snapshot"),
  };
}

// ---------- SupabaseAdapter ----------
export class SupabaseAdapter implements StorageAdapter {
  private cache: {
    objects: LifeObject[]; notes: Note[]; relations: Relation[];
    tags: Tag[]; templates: Template[]; settings: Record<string, unknown>;
    aiAnalysisHistory: AIAnalysisHistoryEntry[];
    _loaded: boolean;
  } = { objects: [], notes: [], relations: [], tags: [], templates: [], settings: {}, aiAnalysisHistory: [], _loaded: false };

  private _initPromise: Promise<void> | null = null;

  constructor() {
    // Use getSupabase() lazily – safe even if called before env vars are set
    const setupAuthListener = () => {
      try {
        getSupabase().auth.onAuthStateChange((event) => {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            this.cache._loaded = false;
            this.init();
          }
          if (event === "SIGNED_OUT") {
            this.cache = { objects: [], notes: [], relations: [], tags: [], templates: [], settings: {}, aiAnalysisHistory: [], _loaded: false };
            resetSupabase();
          }
        });
      } catch {
        // getSupabase() may throw if env vars are not set yet
        // Retry after a short delay (handles lazy init during dev)
      }
    };
    setupAuthListener();
  }

  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      const uid = await getUid();
      if (!uid) return;
      await this.pullAll();
      this.cache._loaded = true;
    })();
    return this._initPromise;
  }

  async refresh() {
    this._initPromise = null;
    return this.init();
  }

  private async pullAll() {
    const uid = await getUid();
    if (!uid) return;

    const client = getSupabase();
    const [objs, notes, rels, tags, tpls, sets, history] = await Promise.all([
      client.from("objects").select("*").eq("user_id", uid),
      client.from("notes").select("*").eq("user_id", uid),
      client.from("relations").select("*").eq("user_id", uid),
      client.from("tags").select("*").eq("user_id", uid),
      client.from("templates").select("*").eq("user_id", uid),
      client.from("settings").select("*").eq("user_id", uid),
      client.from("ai_analysis_history").select("*").eq("user_id", uid),
    ]);

    this.cache.objects    = (objs.data  || []).map(mapObject);
    this.cache.notes     = (notes.data || []).map(mapNote);
    this.cache.relations = (rels.data  || []).map(mapRelation);
    this.cache.tags      = (tags.data  || []).map(mapTag);
    this.cache.templates = (tpls.data || []).map(mapTemplate);
    this.cache.settings  = mapSettings(sets.data || []);
    this.cache.aiAnalysisHistory = (history.data || []).map(mapHistory);
  }

  // ---------- version ----------
  async getStorageVersion(): Promise<number> {
    await this.init();
    return (this.cache.settings["storage_version"] as number) || 0;
  }
  async setStorageVersion(version: number): Promise<void> {
    await this.init();
    await this.saveSetting("storage_version", version);
  }
  async migrateIfNeeded(): Promise<void> {}
  async ensureDefaultTemplates(): Promise<void> {}

  // ---------- Objects ----------
  async getObjects(): Promise<LifeObject[]> {
    await this.init();
    return [...this.cache.objects];
  }
  async getObjectById(id: string): Promise<LifeObject | null> {
    await this.init();
    return this.cache.objects.find((o) => o.id === id) ?? null;
  }
  async createObject(obj: Omit<LifeObject, "id" | "created_at" | "updated_at">): Promise<LifeObject> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const row = {
      id: generateId(), user_id: uid,
      type: obj.type, name: obj.name,
      description: obj.description || null, properties: obj.properties || {},
      ai_profile: obj.aiProfile || null,
      ai_insights: obj.aiInsights || [],
      ai_suggestions: obj.aiSuggestions || [],
      memories: obj.memories || [],
      tag_ids: obj.tag_ids || [], created_at: now, updated_at: now,
    };
    const client = getSupabase();
    const { data, error } = await client.from("objects").insert(row).select().single();
    if (error) throw error;
    const created = mapObject(data);
    this.cache.objects = [created, ...this.cache.objects];
    return created;
  }
  async updateObject(id: string, updates: Partial<Omit<LifeObject, "id" | "created_at" | "updated_at">>): Promise<LifeObject> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const client = getSupabase();
    const { data, error } = await client
      .from("objects")
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.properties !== undefined && { properties: updates.properties }),
        ...(updates.aiProfile !== undefined && { ai_profile: updates.aiProfile }),
        ...(updates.aiInsights !== undefined && { ai_insights: updates.aiInsights }),
        ...(updates.aiSuggestions !== undefined && { ai_suggestions: updates.aiSuggestions }),
        ...(updates.memories !== undefined && { memories: updates.memories }),
        ...(updates.tag_ids !== undefined && { tag_ids: updates.tag_ids }),
        updated_at: now,
      })
      .eq("id", id).eq("user_id", uid)
      .select().single();
    if (error) throw error;
    const updated = mapObject(data);
    this.cache.objects = this.cache.objects.map((o) => (o.id === id ? updated : o));
    return updated;
  }
  async deleteObject(id: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) {
      const client = getSupabase();
      await client.from("objects").delete().eq("id", id).eq("user_id", uid);
    }
    this.cache.objects = this.cache.objects.filter((o) => o.id !== id);
  }

  async deleteObjects(
    ids: string[],
    options?: { preserveNotes?: boolean }
  ): Promise<ObjectDeletionSnapshot> {
    await this.init();
    const uid = await getUid();
    const preserveNotes = options?.preserveNotes !== false;
    const idSet = new Set(ids);
    const deletedAt = Date.now();
    const client = getSupabase();

    const deletedObjects = this.cache.objects.filter((o) => idSet.has(o.id));

    const notesToUnlink = preserveNotes
      ? this.cache.notes.filter(
          (n) => n.object_id !== null && idSet.has(n.object_id)
        )
      : [];
    const notesSnapshot: Note[] = notesToUnlink.map((n) => ({ ...n }));

    const deletedRelations = this.cache.relations.filter(
      (r) => idSet.has(r.source_object_id) || idSet.has(r.target_object_id)
    );

    const historyEntries = this.cache.aiAnalysisHistory
      .filter((h) => h.objectId !== undefined && idSet.has(h.objectId))
      .map((h) => ({ id: h.id, objectId: h.objectId as string }));

    if (uid) {
      const noteIdsToUnlink = notesToUnlink.map((n) => n.id);
      if (noteIdsToUnlink.length > 0) {
        await client
          .from("notes")
          .update({ object_id: null })
          .in("id", noteIdsToUnlink)
          .eq("user_id", uid);
      }

      const relationIdsToDelete = deletedRelations.map((r) => r.id);
      if (relationIdsToDelete.length > 0) {
        await client
          .from("relations")
          .delete()
          .in("id", relationIdsToDelete)
          .eq("user_id", uid);
      }

      const historyIdsToUnlink = historyEntries.map((h) => h.id);
      if (historyIdsToUnlink.length > 0) {
        await client
          .from("ai_analysis_history")
          .update({ object_id: null })
          .in("id", historyIdsToUnlink)
          .eq("user_id", uid);
      }

      await client.from("objects").delete().in("id", ids).eq("user_id", uid);
    }

    this.cache.objects = this.cache.objects.filter((o) => !idSet.has(o.id));
    this.cache.notes = preserveNotes
      ? this.cache.notes.map((n) =>
          n.object_id !== null && idSet.has(n.object_id)
            ? { ...n, object_id: null }
            : n
        )
      : this.cache.notes.filter(
          (n) => n.object_id === null || !idSet.has(n.object_id)
        );
    this.cache.relations = this.cache.relations.filter(
      (r) =>
        !idSet.has(r.source_object_id) && !idSet.has(r.target_object_id)
    );
    this.cache.aiAnalysisHistory = this.cache.aiAnalysisHistory.map((h) =>
      h.objectId !== undefined && idSet.has(h.objectId)
        ? { ...h, objectId: undefined }
        : h
    );

    return {
      objects: deletedObjects,
      relations: deletedRelations,
      notes: notesSnapshot,
      aiHistoryEntries: historyEntries,
      deletedAt,
    };
  }

  async restoreObjects(snapshot: ObjectDeletionSnapshot): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const client = getSupabase();

    const existingIds = new Set(this.cache.objects.map((o) => o.id));
    const objectsToRestore = snapshot.objects.filter((o) => !existingIds.has(o.id));
    if (objectsToRestore.length > 0) {
      const rows = objectsToRestore.map((o) => ({
        id: o.id,
        user_id: uid,
        type: o.type,
        name: o.name,
        description: o.description || null,
        properties: o.properties || {},
        ai_profile: o.aiProfile || null,
        ai_insights: o.aiInsights || [],
        ai_suggestions: o.aiSuggestions || [],
        memories: o.memories || [],
        tag_ids: o.tag_ids || [],
        created_at: o.created_at,
        updated_at: o.updated_at,
      }));
      await client.from("objects").upsert(rows);
      this.cache.objects = [...objectsToRestore, ...this.cache.objects];
    }

    const noteTargetMap = new Map(snapshot.notes.map((n) => [n.id, n.object_id]));
    if (noteTargetMap.size > 0) {
      const noteIds = Array.from(noteTargetMap.keys());
      for (const id of noteIds) {
        await client
          .from("notes")
          .update({ object_id: noteTargetMap.get(id) })
          .eq("id", id)
          .eq("user_id", uid);
      }
      this.cache.notes = this.cache.notes.map((n) =>
        noteTargetMap.has(n.id)
          ? { ...n, object_id: noteTargetMap.get(n.id) ?? n.object_id }
          : n
      );
    }

    const relationIds = new Set(this.cache.relations.map((r) => r.id));
    const relationsToRestore = snapshot.relations.filter(
      (r) => !relationIds.has(r.id)
    );
    if (relationsToRestore.length > 0) {
      const rows = relationsToRestore.map((r) => ({
        id: r.id,
        user_id: uid,
        source_object_id: r.source_object_id,
        target_object_id: r.target_object_id,
        type: r.type,
        strength: r.strength ?? null,
        note: r.note || null,
        created_at: r.created_at,
      }));
      await client.from("relations").upsert(rows);
      this.cache.relations = [...relationsToRestore, ...this.cache.relations];
    }

    const historyTargetMap = new Map(
      snapshot.aiHistoryEntries.map((h) => [h.id, h.objectId])
    );
    if (historyTargetMap.size > 0) {
      for (const [id, objectId] of historyTargetMap.entries()) {
        await client
          .from("ai_analysis_history")
          .update({ object_id: objectId })
          .eq("id", id)
          .eq("user_id", uid);
      }
      this.cache.aiAnalysisHistory = this.cache.aiAnalysisHistory.map((h) =>
        historyTargetMap.has(h.id)
          ? { ...h, objectId: historyTargetMap.get(h.id) }
          : h
      );
    }
  }

  async setObjects(objects: LifeObject[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const client = getSupabase();
    const rows = objects.map((o) => ({
      id: o.id, user_id: uid, type: o.type, name: o.name,
      description: o.description || null, properties: o.properties || {},
      ai_profile: o.aiProfile || null,
      ai_insights: o.aiInsights || [],
      ai_suggestions: o.aiSuggestions || [],
      memories: o.memories || [],
      tag_ids: o.tag_ids || [], created_at: o.created_at, updated_at: o.updated_at,
    }));
    const currentIds = new Set(this.cache.objects.map((o) => o.id));
    const nextIds = new Set(objects.map((o) => o.id));
    const idsToDelete = Array.from(currentIds).filter((id) => !nextIds.has(id));
    if (idsToDelete.length > 0) {
      await client.from("objects").delete().in("id", idsToDelete).eq("user_id", uid);
    }
    if (rows.length > 0) {
      const { error } = await client.from("objects").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    this.cache.objects = objects;
  }

  // ---------- Notes ----------
  async getNotes(): Promise<Note[]> {
    await this.init();
    return [...this.cache.notes];
  }
  async getNotesByObjectId(objectId: string): Promise<Note[]> {
    await this.init();
    return this.cache.notes
      .filter((n) => n.object_id === objectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  async createNote(note: Omit<Note, "id" | "created_at">): Promise<Note> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const row = { id: generateId(), user_id: uid, object_id: note.object_id, content: note.content || "", source_type: note.sourceType || "text", attachments: note.attachments || [], created_at: now };
    const client = getSupabase();
    const { data, error } = await client.from("notes").insert(row).select().single();
    if (error) throw error;
    const created = mapNote(data);
    this.cache.notes = [created, ...this.cache.notes];
    return created;
  }
  async deleteNote(id: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) {
      const client = getSupabase();
      await client.from("notes").delete().eq("id", id).eq("user_id", uid);
    }
    this.cache.notes = this.cache.notes.filter((n) => n.id !== id);
  }
  async setNotes(notes: Note[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const client = getSupabase();
    const rows = notes.map((n) => ({
      id: n.id, user_id: uid, object_id: n.object_id,
      content: n.content || "", source_type: n.sourceType || "text", attachments: n.attachments || [], created_at: n.created_at,
    }));
    const currentIds = new Set(this.cache.notes.map((n) => n.id));
    const nextIds = new Set(notes.map((n) => n.id));
    const idsToDelete = Array.from(currentIds).filter((id) => !nextIds.has(id));
    if (idsToDelete.length > 0) {
      await client.from("notes").delete().in("id", idsToDelete).eq("user_id", uid);
    }
    if (rows.length > 0) {
      const { error } = await client.from("notes").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    this.cache.notes = notes;
  }

  // ---------- Relations ----------
  async getRelations(): Promise<Relation[]> {
    await this.init();
    return [...this.cache.relations];
  }
  async getRelationsByObjectId(objectId: string): Promise<Relation[]> {
    await this.init();
    return this.cache.relations
      .filter((r) => r.source_object_id === objectId || r.target_object_id === objectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  async createRelation(relation: Omit<Relation, "id" | "created_at">): Promise<Relation> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const row = {
      id: generateId(), user_id: uid,
      source_object_id: relation.source_object_id, target_object_id: relation.target_object_id,
      type: relation.type, strength: relation.strength ?? null, note: relation.note || null,
      created_at: now,
    };
    const client = getSupabase();
    const { data, error } = await client.from("relations").insert(row).select().single();
    if (error) throw error;
    const created = mapRelation(data);
    this.cache.relations = [created, ...this.cache.relations];
    return created;
  }
  async deleteRelation(id: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) {
      const client = getSupabase();
      await client.from("relations").delete().eq("id", id).eq("user_id", uid);
    }
    this.cache.relations = this.cache.relations.filter((r) => r.id !== id);
  }
  async setRelations(relations: Relation[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const client = getSupabase();
    const rows = relations.map((r) => ({
      id: r.id, user_id: uid,
      source_object_id: r.source_object_id, target_object_id: r.target_object_id,
      type: r.type, strength: r.strength ?? null, note: r.note || null,
      created_at: r.created_at,
    }));
    const currentIds = new Set(this.cache.relations.map((r) => r.id));
    const nextIds = new Set(relations.map((r) => r.id));
    const idsToDelete = Array.from(currentIds).filter((id) => !nextIds.has(id));
    if (idsToDelete.length > 0) {
      await client.from("relations").delete().in("id", idsToDelete).eq("user_id", uid);
    }
    if (rows.length > 0) {
      const { error } = await client.from("relations").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    this.cache.relations = relations;
  }

  // ---------- Tags ----------
  async getTags(): Promise<Tag[]> {
    await this.init();
    return [...this.cache.tags];
  }
  async createTag(tag: Omit<Tag, "id" | "createdAt" | "usageCount">): Promise<Tag> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const row = { id: generateId(), user_id: uid, name: tag.name, color: tag.color || null, created_at: now, usage_count: 0 };
    const client = getSupabase();
    const { data, error } = await client.from("tags").insert(row).select().single();
    if (error) throw error;
    const created = mapTag(data);
    this.cache.tags = [created, ...this.cache.tags];
    return created;
  }
  async updateTag(id: string, updates: Partial<Omit<Tag, "id" | "createdAt">>): Promise<Tag> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const client = getSupabase();
    const { data, error } = await client
      .from("tags")
      .update({
        ...(updates.name      !== undefined && { name:      updates.name }),
        ...(updates.color     !== undefined && { color:     updates.color }),
        ...(updates.usageCount !== undefined && { usage_count: updates.usageCount }),
      })
      .eq("id", id).eq("user_id", uid)
      .select().single();
    if (error) throw error;
    const updated = mapTag(data);
    this.cache.tags = this.cache.tags.map((t) => (t.id === id ? updated : t));
    return updated;
  }
  async deleteTag(id: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) {
      const client = getSupabase();
      await client.from("tags").delete().eq("id", id).eq("user_id", uid);
    }
    this.cache.tags = this.cache.tags.filter((t) => t.id !== id);
  }
  async setTags(tags: Tag[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const client = getSupabase();
    const rows = tags.map((t) => ({
      id: t.id, user_id: uid, name: t.name, color: t.color || null,
      created_at: t.createdAt, usage_count: t.usageCount,
    }));
    const currentIds = new Set(this.cache.tags.map((t) => t.id));
    const nextIds = new Set(tags.map((t) => t.id));
    const idsToDelete = Array.from(currentIds).filter((id) => !nextIds.has(id));
    if (idsToDelete.length > 0) {
      await client.from("tags").delete().in("id", idsToDelete).eq("user_id", uid);
    }
    if (rows.length > 0) {
      const { error } = await client.from("tags").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    this.cache.tags = tags;
  }

  // ---------- Templates ----------
  async getTemplates(): Promise<Template[]> {
    await this.init();
    return [...this.cache.templates];
  }
  async createTemplate(template: TemplateCreateInput): Promise<Template> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const row = {
      id: generateId(), user_id: uid, name: template.name, category: template.category,
      is_default: template.isDefault, content: template.content || "",
      template_version: template.templateVersion || 1,
      created_at: now, updated_at: now, usage_count: 0, last_used_at: null,
    };
    const client = getSupabase();
    const { data, error } = await client.from("templates").insert(row).select().single();
    if (error) throw error;
    const created = mapTemplate(data);
    this.cache.templates = [created, ...this.cache.templates];
    return created;
  }
  async updateTemplate(id: string, updates: TemplateUpdateInput): Promise<Template> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const client = getSupabase();
    const { data, error } = await client
      .from("templates")
      .update({
        ...(updates.name             !== undefined && { name:             updates.name }),
        ...(updates.category         !== undefined && { category:         updates.category }),
        ...(updates.isDefault       !== undefined && { is_default:       updates.isDefault }),
        ...(updates.content         !== undefined && { content:         updates.content }),
        ...(updates.templateVersion !== undefined && { template_version: updates.templateVersion }),
        ...(updates.usageCount     !== undefined && { usage_count:     updates.usageCount }),
        ...(updates.lastUsedAt     !== undefined && { last_used_at:     updates.lastUsedAt }),
        updated_at: now,
      })
      .eq("id", id).eq("user_id", uid)
      .select().single();
    if (error) throw error;
    const updated = mapTemplate(data);
    this.cache.templates = this.cache.templates.map((t) => (t.id === id ? updated : t));
    return updated;
  }
  async deleteTemplate(id: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) {
      const client = getSupabase();
      await client.from("templates").delete().eq("id", id).eq("user_id", uid);
    }
    this.cache.templates = this.cache.templates.filter((t) => t.id !== id);
  }
  async setTemplates(templates: Template[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const client = getSupabase();
    const rows = templates.map((t) => ({
      id: t.id, user_id: uid, name: t.name, category: t.category,
      is_default: t.isDefault, content: t.content || "",
      template_version: t.templateVersion, created_at: t.createdAt, updated_at: t.updatedAt,
      usage_count: t.usageCount, last_used_at: t.lastUsedAt || null,
    }));
    const currentIds = new Set(this.cache.templates.map((t) => t.id));
    const nextIds = new Set(templates.map((t) => t.id));
    const idsToDelete = Array.from(currentIds).filter((id) => !nextIds.has(id));
    if (idsToDelete.length > 0) {
      await client.from("templates").delete().in("id", idsToDelete).eq("user_id", uid);
    }
    if (rows.length > 0) {
      const { error } = await client.from("templates").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    this.cache.templates = templates;
  }

  // ---------- Settings ----------
  async getSettings(): Promise<Record<string, unknown>> {
    await this.init();
    return { ...this.cache.settings };
  }
  async setSettings(settings: Record<string, unknown>): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const client = getSupabase();
    const rows = Object.entries(settings).map(([key, value]) => ({
      user_id: uid, key, value: JSON.stringify(value), updated_at: now,
    }));
    for (const row of rows) {
      await client
        .from("settings")
        .upsert(row, { onConflict: "user_id,key" });
    }
    this.cache.settings = { ...this.cache.settings, ...settings };
  }
  async saveSetting(key: string, value: unknown): Promise<void> {
    await this.setSettings({ [key]: value });
  }
  async getSetting(key: string): Promise<unknown> {
    await this.init();
    return this.cache.settings[key];
  }

  async getRemoteSummary(): Promise<{
    objects: number;
    notes: number;
    relations: number;
    tags: number;
    templates: number;
    settings: number;
    aiAnalysisHistory: number;
    hasData: boolean;
  }> {
    await this.init();
    const uid = await getUid();
    if (!uid) {
      return {
        objects: 0,
        notes: 0,
        relations: 0,
        tags: 0,
        templates: 0,
        settings: 0,
        aiAnalysisHistory: 0,
        hasData: false,
      };
    }
    const client = getSupabase();
    const counts = await Promise.all([
      client.from("objects").select("id", { count: "exact", head: true }).eq("user_id", uid),
      client.from("notes").select("id", { count: "exact", head: true }).eq("user_id", uid),
      client.from("relations").select("id", { count: "exact", head: true }).eq("user_id", uid),
      client.from("tags").select("id", { count: "exact", head: true }).eq("user_id", uid),
      client.from("templates").select("id", { count: "exact", head: true }).eq("user_id", uid),
      client.from("settings").select("key", { count: "exact", head: true }).eq("user_id", uid),
      client.from("ai_analysis_history").select("id", { count: "exact", head: true }).eq("user_id", uid),
    ]);
    const [objects, notes, relations, tags, templates, settings, aiAnalysisHistory] = counts.map(
      (c) => c.count ?? 0
    );
    const hasData =
      objects > 0 ||
      notes > 0 ||
      relations > 0 ||
      tags > 0 ||
      templates > 0 ||
      settings > 0 ||
      aiAnalysisHistory > 0;
    return {
      objects,
      notes,
      relations,
      tags,
      templates,
      settings,
      aiAnalysisHistory,
      hasData,
    };
  }

  // ---------- AI Analysis History ----------
  async setAIAnalysisHistory(entries: AIAnalysisHistoryEntry[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const client = getSupabase();
    const rows = entries.map((e) => ({
      id: e.id,
      user_id: uid,
      object_type: e.objectType,
      object_id: e.objectId || null,
      created_at: e.createdAt,
      raw_text_input: e.rawTextInput,
      image_count: e.imageCount,
      image_thumbnails: e.imageThumbnails,
      provider: e.provider,
      model: e.model,
      duration_ms: e.durationMs,
      raw_output: e.rawOutput,
      profile_snapshot: e.profileSnapshot || null,
      insights_snapshot: e.insightsSnapshot || [],
      suggestions_snapshot: e.suggestionsSnapshot || [],
      memories_snapshot: e.memoriesSnapshot || [],
    }));
    const currentIds = new Set(this.cache.aiAnalysisHistory.map((h) => h.id));
    const nextIds = new Set(entries.map((e) => e.id));
    const idsToDelete = Array.from(currentIds).filter((id) => !nextIds.has(id));
    if (idsToDelete.length > 0) {
      await client.from("ai_analysis_history").delete().in("id", idsToDelete).eq("user_id", uid);
    }
    if (rows.length > 0) {
      const { error } = await client.from("ai_analysis_history").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    this.cache.aiAnalysisHistory = entries;
  }

  // ---------- AI Analysis History ----------
  async getAIAnalysisHistory(): Promise<AIAnalysisHistoryEntry[]> {
    await this.init();
    return [...this.cache.aiAnalysisHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getAIAnalysisHistoryByObjectId(objectId: string): Promise<AIAnalysisHistoryEntry[]> {
    await this.init();
    return this.cache.aiAnalysisHistory
      .filter((h) => h.objectId === objectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAIAnalysisHistoryByType(
    objectType: import("@/lib/types").LifeObjectType
  ): Promise<AIAnalysisHistoryEntry[]> {
    await this.init();
    return this.cache.aiAnalysisHistory
      .filter((h) => h.objectType === objectType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAIAnalysisHistoryEntryById(id: string): Promise<AIAnalysisHistoryEntry | null> {
    await this.init();
    return this.cache.aiAnalysisHistory.find((h) => h.id === id) ?? null;
  }

  async createAIAnalysisHistory(
    entry: Omit<AIAnalysisHistoryEntry, "id" | "createdAt">
  ): Promise<AIAnalysisHistoryEntry> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");

    const now = new Date().toISOString();
    const row = {
      id: generateId(),
      user_id: uid,
      object_type: entry.objectType,
      object_id: entry.objectId || null,
      created_at: now,
      raw_text_input: entry.rawTextInput,
      image_count: entry.imageCount,
      image_thumbnails: entry.imageThumbnails,
      provider: entry.provider,
      model: entry.model,
      duration_ms: entry.durationMs,
      raw_output: entry.rawOutput,
      profile_snapshot: entry.profileSnapshot || null,
      insights_snapshot: entry.insightsSnapshot || [],
      suggestions_snapshot: entry.suggestionsSnapshot || [],
      memories_snapshot: entry.memoriesSnapshot || [],
    };

    const client = getSupabase();
    const { data, error } = await client.from("ai_analysis_history").insert(row).select().single();
    if (error) throw error;

    const created = mapHistory(data);
    this.cache.aiAnalysisHistory = [created, ...this.cache.aiAnalysisHistory];
    return created;
  }

  async updateAIAnalysisHistoryObjectId(historyId: string, objectId: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");

    const client = getSupabase();
    const { error } = await client
      .from("ai_analysis_history")
      .update({ object_id: objectId })
      .eq("id", historyId)
      .eq("user_id", uid);
    if (error) throw error;

    this.cache.aiAnalysisHistory = this.cache.aiAnalysisHistory.map((h) =>
      h.id === historyId ? { ...h, objectId } : h
    );
  }

  async deleteAIAnalysisHistory(id: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) {
      const client = getSupabase();
      await client.from("ai_analysis_history").delete().eq("id", id).eq("user_id", uid);
    }
    this.cache.aiAnalysisHistory = this.cache.aiAnalysisHistory.filter((h) => h.id !== id);
  }

  async clearAIAnalysisHistory(): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) {
      const client = getSupabase();
      await client.from("ai_analysis_history").delete().eq("user_id", uid);
    }
    this.cache.aiAnalysisHistory = [];
  }
}
