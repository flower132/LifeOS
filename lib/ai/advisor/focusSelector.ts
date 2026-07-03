import { LifeObject, Note } from "@/lib/types";

const FOCUS_TYPES: LifeObject["type"][] = ["person", "goal", "project", "self"];

function isFocusType(type: LifeObject["type"]): boolean {
  return FOCUS_TYPES.includes(type);
}

function scoreObject(object: LifeObject, notes: Note[]): number {
  let score = 0;

  // Prefer active goals / projects over completed ones.
  const status = String(object.properties?.status || "").toLowerCase();
  if (status === "completed" || status === "done") {
    score -= 100;
  } else if (status === "in_progress") {
    score += 30;
  }

  // Prefer high-priority objects.
  const priority = String(object.properties?.priority || "").toLowerCase();
  if (priority === "high") {
    score += 40;
  } else if (priority === "medium") {
    score += 20;
  }

  // Objects with recent notes are more alive.
  const objectNotes = notes.filter((n) => n.object_id === object.id);
  if (objectNotes.length > 0) {
    score += Math.min(objectNotes.length * 5, 30);
    const latestNote = objectNotes.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    const daysSinceLastNote =
      (Date.now() - new Date(latestNote.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceLastNote < 7) {
      score += 20;
    } else if (daysSinceLastNote < 30) {
      score += 10;
    }
  }

  // Self is a stable fallback.
  if (object.type === "self") {
    score += 5;
  }

  return score;
}

export function selectTodayFocus(
  objects: LifeObject[],
  notes: Note[]
): LifeObject | null {
  const candidates = objects.filter((o) => isFocusType(o.type));
  if (candidates.length === 0) return null;

  const scored = candidates.map((object) => ({
    object,
    score: scoreObject(object, notes),
    updatedAt: new Date(object.updated_at).getTime(),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.updatedAt - a.updatedAt;
  });

  return scored[0]?.object ?? null;
}
