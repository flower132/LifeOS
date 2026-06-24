import { StorageAdapter } from "./types";
import {
  LifeObject, Note, Relation, Tag, Template,
  TemplateCreateInput, TemplateUpdateInput,
} from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

const toISO = (d: unknown) =>
  d ? new Date(d as string | number).toISOString() : new Date().toISOString();

function getUid(): Promise<string | null> {
  return supabase.auth.getUser().then(({ data }) => data.user?.id ?? null);
}

// ---------- helpers ----------
function mapObject(r: any): LifeObject {
  return {
    id: r.id, type: r.type, name: r.name,
    description: r.description || undefined,
    properties: r.properties || {},
    tag_ids: r.tag_ids || [],
    created_at: toISO(r.created_at),
    updated_at: toISO(r.updated_at),
  };
}
function mapNote(r: any): Note {
  return { id: r.id, object_id: r.object_id, content: r.content || "", created_at: toISO(r.created_at) };
}
function mapRelation(r: any): Relation {
  return {
    id: r.id, source_object_id: r.source_object_id, target_object_id: r.target_object_id,
    type: r.type, strength: r.strength ?? undefined, note: r.note || undefined,
    created_at: toISO(r.created_at),
  };
}
function mapTag(r: any): Tag {
  return { id: r.id, name: r.name, color: r.color || undefined, createdAt: toISO(r.created_at), usageCount: r.usage_count || 0 };
}
function mapTemplate(r: any): Template {
  return {
    id: r.id, name: r.name, category: r.category,
    isDefault: r.is_default, content: r.content || "",
    templateVersion: r.template_version || 1,
    createdAt: toISO(r.created_at), updatedAt: toISO(r.updated_at),
    usageCount: r.usage_count || 0,
    lastUsedAt: r.last_used_at ? toISO(r.last_used_at) : undefined,
  };
}
function mapSettings(rows: any[]): Record<string, unknown> {
  const s: Record<string, unknown> = {};
  rows.forEach((r: any) => { s[r.key] = r.value; });
  return s;
}

// ---------- SupabaseAdapter ----------
export class SupabaseAdapter implements StorageAdapter {
  private cache: {
    objects: LifeObject[]; notes: Note[]; relations: Relation[];
    tags: Tag[]; templates: Template[]; settings: Record<string, unknown>;
    _loaded: boolean;
  } = { objects: [], notes: [], relations: [], tags: [], templates: [], settings: {}, _loaded: false };

  private _initPromise: Promise<void> | null = null;

  constructor() {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        this.cache._loaded = false;
        this.init();
      }
      if (event === "SIGNED_OUT") {
        this.cache = { objects: [], notes: [], relations: [], tags: [], templates: [], settings: {}, _loaded: false };
      }
    });
  }

  private async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      const uid = await getUid();
      if (!uid) return;
      await this.pullAll();
      this.cache._loaded = true;
    })();
    return this._initPromise;
  }

  private async pullAll() {
    const uid = await getUid();
    if (!uid) return;

    const [objs, notes, rels, tags, tpls, sets] = await Promise.all([
      supabase.from("objects").select("*").eq("user_id", uid),
      supabase.from("notes").select("*").eq("user_id", uid),
      supabase.from("relations").select("*").eq("user_id", uid),
      supabase.from("tags").select("*").eq("user_id", uid),
      supabase.from("templates").select("*").eq("user_id", uid),
      supabase.from("settings").select("*").eq("user_id", uid),
    ]);

    this.cache.objects    = (objs.data  || []).map(mapObject);
    this.cache.notes     = (notes.data || []).map(mapNote);
    this.cache.relations = (rels.data  || []).map(mapRelation);
    this.cache.tags      = (tags.data  || []).map(mapTag);
    this.cache.templates = (tpls.data || []).map(mapTemplate);
    this.cache.settings  = mapSettings(sets.data || []);
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
      id: crypto.randomUUID(), user_id: uid,
      type: obj.type, name: obj.name,
      description: obj.description || null, properties: obj.properties || {},
      tag_ids: obj.tag_ids || [], created_at: now, updated_at: now,
    };
    const { data, error } = await supabase.from("objects").insert(row).select().single();
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
    const { data, error } = await supabase
      .from("objects")
      .update({
        ...(updates.name       !== undefined && { name:       updates.name }),
        ...(updates.type       !== undefined && { type:       updates.type }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.properties !== undefined && { properties: updates.properties }),
        ...(updates.tag_ids    !== undefined && { tag_ids:    updates.tag_ids }),
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
    if (uid) await supabase.from("objects").delete().eq("id", id).eq("user_id", uid);
    this.cache.objects = this.cache.objects.filter((o) => o.id !== id);
  }
  async setObjects(objects: LifeObject[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const rows = objects.map((o) => ({
      id: o.id, user_id: uid, type: o.type, name: o.name,
      description: o.description || null, properties: o.properties || {},
      tag_ids: o.tag_ids || [], created_at: o.created_at, updated_at: o.updated_at,
    }));
    await supabase.from("objects").delete().eq("user_id", uid);
    if (rows.length > 0) await supabase.from("objects").insert(rows);
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
    const row = { id: crypto.randomUUID(), user_id: uid, object_id: note.object_id, content: note.content || "", created_at: now };
    const { data, error } = await supabase.from("notes").insert(row).select().single();
    if (error) throw error;
    const created = mapNote(data);
    this.cache.notes = [created, ...this.cache.notes];
    return created;
  }
  async deleteNote(id: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) await supabase.from("notes").delete().eq("id", id).eq("user_id", uid);
    this.cache.notes = this.cache.notes.filter((n) => n.id !== id);
  }
  async setNotes(notes: Note[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const rows = notes.map((n) => ({
      id: n.id, user_id: uid, object_id: n.object_id,
      content: n.content || "", created_at: n.created_at,
    }));
    await supabase.from("notes").delete().eq("user_id", uid);
    if (rows.length > 0) await supabase.from("notes").insert(rows);
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
      id: crypto.randomUUID(), user_id: uid,
      source_object_id: relation.source_object_id, target_object_id: relation.target_object_id,
      type: relation.type, strength: relation.strength ?? null, note: relation.note || null,
      created_at: now,
    };
    const { data, error } = await supabase.from("relations").insert(row).select().single();
    if (error) throw error;
    const created = mapRelation(data);
    this.cache.relations = [created, ...this.cache.relations];
    return created;
  }
  async deleteRelation(id: string): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (uid) await supabase.from("relations").delete().eq("id", id).eq("user_id", uid);
    this.cache.relations = this.cache.relations.filter((r) => r.id !== id);
  }
  async setRelations(relations: Relation[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const rows = relations.map((r) => ({
      id: r.id, user_id: uid,
      source_object_id: r.source_object_id, target_object_id: r.target_object_id,
      type: r.type, strength: r.strength ?? null, note: r.note || null,
      created_at: r.created_at,
    }));
    await supabase.from("relations").delete().eq("user_id", uid);
    if (rows.length > 0) await supabase.from("relations").insert(rows);
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
    const row = { id: crypto.randomUUID(), user_id: uid, name: tag.name, color: tag.color || null, created_at: now, usage_count: 0 };
    const { data, error } = await supabase.from("tags").insert(row).select().single();
    if (error) throw error;
    const created = mapTag(data);
    this.cache.tags = [created, ...this.cache.tags];
    return created;
  }
  async updateTag(id: string, updates: Partial<Omit<Tag, "id" | "createdAt">>): Promise<Tag> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const { data, error } = await supabase
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
    if (uid) await supabase.from("tags").delete().eq("id", id).eq("user_id", uid);
    this.cache.tags = this.cache.tags.filter((t) => t.id !== id);
  }
  async setTags(tags: Tag[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const rows = tags.map((t) => ({
      id: t.id, user_id: uid, name: t.name, color: t.color || null,
      created_at: t.createdAt, usage_count: t.usageCount,
    }));
    await supabase.from("tags").delete().eq("user_id", uid);
    if (rows.length > 0) await supabase.from("tags").insert(rows);
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
      id: crypto.randomUUID(), user_id: uid, name: template.name, category: template.category,
      is_default: template.isDefault, content: template.content || "",
      template_version: template.templateVersion || 1,
      created_at: now, updated_at: now, usage_count: 0, last_used_at: null,
    };
    const { data, error } = await supabase.from("templates").insert(row).select().single();
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
    const { data, error } = await supabase
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
    if (uid) await supabase.from("templates").delete().eq("id", id).eq("user_id", uid);
    this.cache.templates = this.cache.templates.filter((t) => t.id !== id);
  }
  async setTemplates(templates: Template[]): Promise<void> {
    await this.init();
    const uid = await getUid();
    if (!uid) throw new Error("Not authenticated");
    const rows = templates.map((t) => ({
      id: t.id, user_id: uid, name: t.name, category: t.category,
      is_default: t.isDefault, content: t.content || "",
      template_version: t.templateVersion, created_at: t.createdAt, updated_at: t.updatedAt,
      usage_count: t.usageCount, last_used_at: t.lastUsedAt || null,
    }));
    await supabase.from("templates").delete().eq("user_id", uid);
    if (rows.length > 0) await supabase.from("templates").insert(rows);
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
    const rows = Object.entries(settings).map(([key, value]) => ({
      user_id: uid, key, value: JSON.stringify(value), updated_at: now,
    }));
    for (const row of rows) {
      await supabase
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
}
