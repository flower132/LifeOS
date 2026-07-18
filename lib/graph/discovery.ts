import { LifeObject } from "@/lib/types";
import { storage } from "@/lib/storage";
import { useRelationStore } from "@/stores/relationStore";
import { useRelationSuggestionStore } from "@/stores/relationSuggestionStore";
import { relationEngine } from "@/lib/relations/engine";
import { ExtractedRelation } from "@/lib/relations/types";
import { RelationSuggestion } from "./types";

// ---------------------------------------------------------------------------
// Automatic Relation Discovery — AI proposes, the user disposes.
//
// Extracted relation candidates become PENDING suggestions. Nothing is ever
// written to the relations graph without explicit user acceptance.
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

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Convert AI-extracted relation candidates into pending suggestions.
 * Skips: unresolvable names, self-loops, already-existing edges, and
 * duplicates of already-pending suggestions.
 */
export async function discoverRelations(params: {
  relations: ExtractedRelation[];
  objects: LifeObject[];
  sourceMemoryId: string;
}): Promise<RelationSuggestion[]> {
  const { relations, objects, sourceMemoryId } = params;
  const selfObject = objects.find((o) => o.type === "self") ?? null;
  const existingRelations = useRelationStore.getState().relations;
  const pending = useRelationSuggestionStore.getState().suggestions;

  const created: RelationSuggestion[] = [];

  for (const candidate of relations) {
    try {
      const from = resolveObject(candidate.fromName, objects, selfObject);
      const to = resolveObject(candidate.toName, objects, selfObject);
      if (!from || !to || from.id === to.id) continue;

      const key = pairKey(from.id, to.id);

      // Already a real edge with the same semantics — reinforce instead.
      const existingEdge = existingRelations.find(
        (r) =>
          pairKey(r.source_object_id, r.target_object_id) === key &&
          r.type === candidate.type &&
          (r.label ?? "") === (candidate.label ?? "")
      );
      if (existingEdge) {
        await relationEngine.upsertRelation({
          fromObjectId: from.id,
          toObjectId: to.id,
          type: candidate.type,
          label: candidate.label,
          confidence: candidate.confidence,
          sourceMemoryId,
          createdBy: "ai",
        });
        continue;
      }

      // Already suggested and still pending — skip.
      const alreadyPending = pending.some(
        (s) =>
          s.status === "pending" &&
          pairKey(s.fromObjectId, s.toObjectId) === key &&
          s.type === candidate.type &&
          (s.label ?? "") === (candidate.label ?? "")
      );
      if (alreadyPending) continue;

      const suggestion = await storage.createRelationSuggestion({
        fromObjectId: from.id,
        toObjectId: to.id,
        type: candidate.type,
        label: candidate.label,
        confidence: candidate.confidence,
        sourceMemoryId,
        status: "pending",
      });
      useRelationSuggestionStore.getState().upsertLocal(suggestion);
      created.push(suggestion);
    } catch (err) {
      console.warn("[graph] Relation discovery failed for a candidate:", err);
    }
  }

  return created;
}

/** Accept a suggestion → becomes a real graph edge (user-created confirmation). */
export async function acceptRelationSuggestion(id: string): Promise<void> {
  const store = useRelationSuggestionStore.getState();
  const suggestion = store.suggestions.find((s) => s.id === id);
  if (!suggestion || suggestion.status !== "pending") return;

  await relationEngine.upsertRelation({
    fromObjectId: suggestion.fromObjectId,
    toObjectId: suggestion.toObjectId,
    type: suggestion.type,
    label: suggestion.label,
    confidence: suggestion.confidence,
    sourceMemoryId: suggestion.sourceMemoryId,
    createdBy: "ai",
  });

  const updated = await storage.updateRelationSuggestion(id, { status: "accepted" });
  useRelationSuggestionStore.getState().upsertLocal(updated);
}

/** Reject a suggestion → stays out of the graph forever. */
export async function rejectRelationSuggestion(id: string): Promise<void> {
  const store = useRelationSuggestionStore.getState();
  const suggestion = store.suggestions.find((s) => s.id === id);
  if (!suggestion || suggestion.status !== "pending") return;
  const updated = await storage.updateRelationSuggestion(id, { status: "rejected" });
  useRelationSuggestionStore.getState().upsertLocal(updated);
}
