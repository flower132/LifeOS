import { LifeObject } from "@/lib/types";
import { MemoryEntities, MemoryRelation } from "./types";
import { MemoryExtraction } from "./extractor";

// ---------------------------------------------------------------------------
// Linker — binds extracted entities to real LifeObjects.
//
// Links live on the Memory record (memory.relations / memory.entities with
// object ids) — user-facing Relation objects are never auto-created, so the
// user's relation graph stays exactly as they curated it.
// ---------------------------------------------------------------------------

export interface LinkResult {
  entities: MemoryEntities;
  relations: MemoryRelation[];
  /** Objects that were linked (for importance scoring). */
  linkedObjects: LifeObject[];
}

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

/** Find the object an extracted name refers to (exact → alias → contains). */
function findObject(
  name: string,
  candidates: LifeObject[]
): LifeObject | undefined {
  const target = normalize(name);
  if (!target) return undefined;

  const exact = candidates.find((o) => normalize(o.name) === target);
  if (exact) return exact;

  // The extracted name may be a nickname contained in the full name, or the
  // other way around (e.g. "张伟" ↔ "张伟（老板）").
  return candidates.find((o) => {
    const objectName = normalize(o.name);
    return (
      objectName.length >= 2 &&
      target.length >= 2 &&
      (objectName.includes(target) || target.includes(objectName))
    );
  });
}

const RELATION_BY_TYPE: Record<string, string> = {
  person: "interaction",
  project: "progress",
  goal: "progress",
  event: "mentioned",
};

/**
 * Resolve extracted entity names to objects and build memory relations.
 */
export function linkEntities(
  extraction: MemoryExtraction,
  objects: LifeObject[]
): LinkResult {
  const linkedObjects: LifeObject[] = [];
  const relations: MemoryRelation[] = [];
  const seen = new Set<string>();

  const link = (
    names: string[],
    type: LifeObject["type"]
  ): string[] => {
    const ids: string[] = [];
    const candidates = objects.filter((o) => o.type === type);
    for (const name of names) {
      const object = findObject(name, candidates);
      if (!object || seen.has(object.id)) continue;
      seen.add(object.id);
      ids.push(object.id);
      linkedObjects.push(object);
      relations.push({
        targetId: object.id,
        relation: RELATION_BY_TYPE[type] ?? "mentioned",
      });
    }
    return ids;
  };

  const people = link(extraction.entities.people, "person");
  const projects = link(extraction.entities.projects, "project");
  const goals = link(extraction.entities.goals, "goal");

  return {
    entities: { people, projects, goals, places: extraction.entities.places },
    relations,
    linkedObjects,
  };
}
