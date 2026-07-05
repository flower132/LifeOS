import { DataStats } from "./types";

function safeParseArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getLocalDataStats(): DataStats {
  const objects = safeParseArray<{ memories?: unknown[] }>("lifeos_objects");
  const notes = safeParseArray<unknown>("lifeos_notes");
  const relations = safeParseArray<unknown>("lifeos_relations");
  const tags = safeParseArray<unknown>("lifeos_tags");
  const templates = safeParseArray<unknown>("lifeos_templates");

  const memories = objects.reduce(
    (sum, obj) => sum + (Array.isArray(obj.memories) ? obj.memories.length : 0),
    0
  );

  return {
    objects: objects.length,
    memories,
    notes: notes.length,
    relations: relations.length,
    tags: tags.length,
    templates: templates.length,
  };
}

export function hasLocalData(): boolean {
  const stats = getLocalDataStats();
  return (
    stats.objects > 0 ||
    stats.notes > 0 ||
    stats.relations > 0 ||
    stats.tags > 0 ||
    stats.templates > 0
  );
}
