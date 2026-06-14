import { v4 as uuidv4 } from "uuid";
import {
  LifeObject,
  Note,
  Relation,
  Tag,
} from "@/lib/types";
import { StorageAdapter } from "./types";

const KEYS = {
  objects: "lifeos_objects",
  notes: "lifeos_notes",
  relations: "lifeos_relations",
  tags: "lifeos_tags",
};

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function now(): string {
  return new Date().toISOString();
}

export class LocalStorageAdapter implements StorageAdapter {
  // Objects
  async getObjects(): Promise<LifeObject[]> {
    return getItem<LifeObject[]>(KEYS.objects, []);
  }

  async getObjectById(id: string): Promise<LifeObject | null> {
    const objects = await this.getObjects();
    return objects.find((o) => o.id === id) ?? null;
  }

  async createObject(
    obj: Omit<LifeObject, "id" | "created_at" | "updated_at">
  ): Promise<LifeObject> {
    const objects = await this.getObjects();
    const created: LifeObject = {
      ...obj,
      id: uuidv4(),
      created_at: now(),
      updated_at: now(),
    };
    setItem(KEYS.objects, [...objects, created]);
    return created;
  }

  async updateObject(
    id: string,
    updates: Partial<Omit<LifeObject, "id" | "created_at" | "updated_at">>
  ): Promise<LifeObject> {
    const objects = await this.getObjects();
    const index = objects.findIndex((o) => o.id === id);
    if (index === -1) throw new Error(`Object ${id} not found`);
    const updated: LifeObject = {
      ...objects[index],
      ...updates,
      updated_at: now(),
    };
    objects[index] = updated;
    setItem(KEYS.objects, objects);
    return updated;
  }

  async deleteObject(id: string): Promise<void> {
    const objects = (await this.getObjects()).filter((o) => o.id !== id);
    setItem(KEYS.objects, objects);
    const notes = (await this.getNotes()).filter((n) => n.object_id !== id);
    setItem(KEYS.notes, notes);
    const relations = (await this.getRelations()).filter(
      (r) => r.source_object_id !== id && r.target_object_id !== id
    );
    setItem(KEYS.relations, relations);
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    return getItem<Note[]>(KEYS.notes, []);
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

  async createNote(
    note: Omit<Note, "id" | "created_at">
  ): Promise<Note> {
    const notes = await this.getNotes();
    const created: Note = {
      ...note,
      id: uuidv4(),
      created_at: now(),
    };
    setItem(KEYS.notes, [created, ...notes]);
    return created;
  }

  async deleteNote(id: string): Promise<void> {
    const notes = (await this.getNotes()).filter((n) => n.id !== id);
    setItem(KEYS.notes, notes);
  }

  // Relations
  async getRelations(): Promise<Relation[]> {
    return getItem<Relation[]>(KEYS.relations, []);
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
    const relations = await this.getRelations();
    const created: Relation = {
      ...relation,
      id: uuidv4(),
      created_at: now(),
    };
    setItem(KEYS.relations, [created, ...relations]);
    return created;
  }

  async deleteRelation(id: string): Promise<void> {
    const relations = (await this.getRelations()).filter((r) => r.id !== id);
    setItem(KEYS.relations, relations);
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return getItem<Tag[]>(KEYS.tags, []);
  }

  async createTag(tag: Omit<Tag, "id">): Promise<Tag> {
    const tags = await this.getTags();
    const created: Tag = {
      ...tag,
      id: uuidv4(),
    };
    setItem(KEYS.tags, [...tags, created]);
    return created;
  }

  async deleteTag(id: string): Promise<void> {
    const tags = (await this.getTags()).filter((t) => t.id !== id);
    setItem(KEYS.tags, tags);
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
