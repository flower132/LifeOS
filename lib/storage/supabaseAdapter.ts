import {
  LifeObject,
  Note,
  Relation,
  Tag,
} from "@/lib/types";
import { StorageAdapter } from "./types";

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * SupabaseAdapter is a placeholder implementation for Supabase-backed storage.
 *
 * To enable:
 * 1. Install @supabase/supabase-js
 * 2. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.
 * 3. Create the following tables in Supabase:
 *    - objects (id, type, name, description, tag_ids, created_at, updated_at)
 *    - notes (id, object_id, content, created_at)
 *    - relations (id, source_object_id, target_object_id, type, strength, note, created_at)
 *    - tags (id, name, color)
 * 4. Replace the throws below with actual Supabase client calls.
 */
export class SupabaseAdapter implements StorageAdapter {
  constructor(
    private readonly url: string,
    private readonly key: string
  ) {
    console.warn(
      "SupabaseAdapter is not fully implemented. Falling back to localStorage behavior."
    );
  }

  // Objects
  async getObjects(): Promise<LifeObject[]> {
    throw new Error("SupabaseAdapter.getObjects not implemented");
  }

  async getObjectById(id: string): Promise<LifeObject | null> {
    throw new Error("SupabaseAdapter.getObjectById not implemented");
  }

  async createObject(
    obj: Omit<LifeObject, "id" | "created_at" | "updated_at">
  ): Promise<LifeObject> {
    throw new Error("SupabaseAdapter.createObject not implemented");
  }

  async updateObject(
    id: string,
    updates: Partial<Omit<LifeObject, "id" | "created_at" | "updated_at">>
  ): Promise<LifeObject> {
    throw new Error("SupabaseAdapter.updateObject not implemented");
  }

  async deleteObject(id: string): Promise<void> {
    throw new Error("SupabaseAdapter.deleteObject not implemented");
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    throw new Error("SupabaseAdapter.getNotes not implemented");
  }

  async getNotesByObjectId(objectId: string): Promise<Note[]> {
    throw new Error("SupabaseAdapter.getNotesByObjectId not implemented");
  }

  async createNote(note: Omit<Note, "id" | "created_at">): Promise<Note> {
    throw new Error("SupabaseAdapter.createNote not implemented");
  }

  async deleteNote(id: string): Promise<void> {
    throw new Error("SupabaseAdapter.deleteNote not implemented");
  }

  // Relations
  async getRelations(): Promise<Relation[]> {
    throw new Error("SupabaseAdapter.getRelations not implemented");
  }

  async getRelationsByObjectId(objectId: string): Promise<Relation[]> {
    throw new Error("SupabaseAdapter.getRelationsByObjectId not implemented");
  }

  async createRelation(
    relation: Omit<Relation, "id" | "created_at">
  ): Promise<Relation> {
    throw new Error("SupabaseAdapter.createRelation not implemented");
  }

  async deleteRelation(id: string): Promise<void> {
    throw new Error("SupabaseAdapter.deleteRelation not implemented");
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    throw new Error("SupabaseAdapter.getTags not implemented");
  }

  async createTag(tag: Omit<Tag, "id">): Promise<Tag> {
    throw new Error("SupabaseAdapter.createTag not implemented");
  }

  async deleteTag(id: string): Promise<void> {
    throw new Error("SupabaseAdapter.deleteTag not implemented");
  }
}
