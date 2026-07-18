import { Note } from "@/lib/types";
import { Memory } from "@/lib/memory/types";

// ---------------------------------------------------------------------------
// Object Timeline — every object's auto-generated timeline from memories and
// notes (e.g. 老板: 2025 认识 → 2026 第一次合作 → 2026 项目冲突 → 重新合作).
// ---------------------------------------------------------------------------

export interface ObjectTimelineEntry {
  date: string;
  monthKey: string;
  title: string;
  kind: "memory" | "note";
  importance: number;
  sourceId: string;
}

export function buildObjectTimeline(params: {
  memories: Memory[];
  notes: Note[];
  /** Only entries at/above this importance appear (memories). */
  minImportance?: number;
}): ObjectTimelineEntry[] {
  const minImportance = params.minImportance ?? 0.4;

  const memoryEntries: ObjectTimelineEntry[] = params.memories
    .filter((m) => m.importance >= minImportance)
    .map((m) => {
      const date = new Date(m.timestamp).toISOString().slice(0, 10);
      return {
        date,
        monthKey: date.slice(0, 7),
        title: m.summary ?? m.content.slice(0, 40),
        kind: "memory" as const,
        importance: m.importance,
        sourceId: m.id,
      };
    });

  const noteEntries: ObjectTimelineEntry[] = params.notes.map((n) => {
    const date = n.created_at.slice(0, 10);
    return {
      date,
      monthKey: date.slice(0, 7),
      title: n.content.slice(0, 40),
      kind: "note" as const,
      importance: 0.2,
      sourceId: n.id,
    };
  });

  return [...memoryEntries, ...noteEntries].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.importance - a.importance
  );
}
