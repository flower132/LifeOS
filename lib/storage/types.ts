import {
  LifeObject,
  Note,
  Relation,
  Tag,
} from "@/lib/types";

export interface StorageAdapter {
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
  createTag(tag: Omit<Tag, "id">): Promise<Tag>;
  deleteTag(id: string): Promise<void>;
}

export interface StorageConfig {
  type: "localStorage" | "supabase";
  supabaseUrl?: string;
  supabaseKey?: string;
}
