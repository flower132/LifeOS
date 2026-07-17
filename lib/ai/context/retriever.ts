import { LifeObject, Note, Relation } from "@/lib/types";
import { IntelligencePattern } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useIntelligenceStore } from "@/stores/intelligenceStore";

// ---------------------------------------------------------------------------
// Retriever — the only data-access layer of the Context Engine. Reads the
// existing client stores (localStorage / Supabase hybrid storage behind
// them); no new database, no server round-trips.
// ---------------------------------------------------------------------------

export interface RawWorld {
  self: LifeObject | null;
  objects: LifeObject[];
  notes: Note[];
  relations: Relation[];
  patterns: IntelligencePattern[];
}

/** Snapshot of the user's world, or null during SSR / before hydration. */
export function getWorld(): RawWorld | null {
  if (typeof window === "undefined") return null;
  const objects = useObjectStore.getState().objects;
  const notes = useNoteStore.getState().notes;
  const relations = useRelationStore.getState().relations;
  const patterns = useIntelligenceStore.getState().cache.patterns;
  return {
    self: objects.find((o) => o.type === "self") ?? null,
    objects,
    notes,
    relations,
    patterns,
  };
}

const IN_PROGRESS_STATUS = ["in_progress", "进行中", "active"];

export function getObjectById(world: RawWorld, id: string): LifeObject | undefined {
  return world.objects.find((o) => o.id === id);
}

export function getNotesForObject(world: RawWorld, objectId: string): Note[] {
  return world.notes
    .filter((n) => n.object_id === objectId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export function getRecentNotes(world: RawWorld, limit: number): Note[] {
  return [...world.notes]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

export function getActiveGoals(world: RawWorld): LifeObject[] {
  return world.objects.filter(
    (o) =>
      (o.type === "goal" || o.type === "project") &&
      IN_PROGRESS_STATUS.includes(
        String(o.properties?.status ?? "").toLowerCase()
      )
  );
}

export function getRelationsFor(world: RawWorld, objectId: string): Relation[] {
  return world.relations.filter(
    (r) => r.source_object_id === objectId || r.target_object_id === objectId
  );
}

/** Objects connected to the given object via relations (excluding itself). */
export function getRelatedObjects(world: RawWorld, objectId: string): LifeObject[] {
  const relatedIds = new Set(
    getRelationsFor(world, objectId).flatMap((r) => [
      r.source_object_id,
      r.target_object_id,
    ])
  );
  relatedIds.delete(objectId);
  return world.objects.filter((o) => relatedIds.has(o.id));
}

/** All person objects, most recently updated first. */
export function getPeople(world: RawWorld, limit = 10): LifeObject[] {
  return world.objects
    .filter((o) => o.type === "person")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, limit);
}
