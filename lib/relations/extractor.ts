import { LifeObject, Relation } from "@/lib/types";
import { relationEngine } from "./engine";
import { ExtractedRelation } from "./types";

// ---------------------------------------------------------------------------
// Relation Extraction application — turns AI-extracted relation candidates
// into Knowledge Graph edges: name resolution ("我" → self), object matching,
// dedupe + confidence reinforcement via the Relation Engine.
// ---------------------------------------------------------------------------

const SELF_ALIASES = ["我", "自己", "本人", "user", "me", "self"];

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

function resolveObject(
  name: string,
  objects: LifeObject[],
  selfObject: LifeObject | null
): LifeObject | undefined {
  const target = normalize(name);
  if (!target) return undefined;
  if (SELF_ALIASES.includes(target)) return selfObject ?? undefined;

  const exact = objects.find((o) => normalize(o.name) === target);
  if (exact) return exact;

  return objects.find((o) => {
    const objectName = normalize(o.name);
    return (
      objectName.length >= 2 &&
      target.length >= 2 &&
      (objectName.includes(target) || target.includes(objectName))
    );
  });
}

export interface ApplyRelationsResult {
  created: Relation[];
  reinforced: Relation[];
  /** Candidates dropped (unresolvable names or self-loops). */
  skipped: number;
}

/**
 * Apply AI-extracted relations to the graph. Never throws — extraction is a
 * best-effort side effect of the memory pipeline.
 */
export async function applyExtractedRelations(params: {
  relations: ExtractedRelation[];
  objects: LifeObject[];
  sourceMemoryId: string;
}): Promise<ApplyRelationsResult> {
  const result: ApplyRelationsResult = { created: [], reinforced: [], skipped: 0 };
  const { objects, relations, sourceMemoryId } = params;
  const selfObject = objects.find((o) => o.type === "self") ?? null;

  for (const candidate of relations) {
    try {
      const from = resolveObject(candidate.fromName, objects, selfObject);
      const to = resolveObject(candidate.toName, objects, selfObject);
      if (!from || !to || from.id === to.id) {
        result.skipped++;
        continue;
      }

      const hadEdge = Boolean(
        relationEngine.getRelationBetween(from.id, to.id)
      );
      const relation = await relationEngine.upsertRelation({
        fromObjectId: from.id,
        toObjectId: to.id,
        type: candidate.type,
        label: candidate.label,
        confidence: candidate.confidence,
        sourceMemoryId,
        createdBy: "ai",
      });

      if (hadEdge) result.reinforced.push(relation);
      else result.created.push(relation);
    } catch (err) {
      console.warn("[relations] Failed to apply extracted relation:", err);
      result.skipped++;
    }
  }

  return result;
}
