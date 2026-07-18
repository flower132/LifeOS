import { LONG_TERM_THRESHOLD, Memory, MemoryType } from "./types";

// ---------------------------------------------------------------------------
// Timeline — the user's life timeline from important memories. Foundation
// for yearly reviews, life chapters, and time travel.
// ---------------------------------------------------------------------------

export interface TimelineEntry {
  /** YYYY-MM-DD */
  date: string;
  monthKey: string;
  memoryId: string;
  title: string;
  type: MemoryType;
  importance: number;
}

/** Important memories as timeline entries, newest first. */
export function buildTimeline(memories: Memory[]): TimelineEntry[] {
  return memories
    .filter((m) => m.importance >= LONG_TERM_THRESHOLD)
    .map((m) => {
      const date = new Date(m.timestamp).toISOString().slice(0, 10);
      return {
        date,
        monthKey: date.slice(0, 7),
        memoryId: m.id,
        title: m.summary ?? m.content.slice(0, 40),
        type: m.type,
        importance: m.importance,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Group timeline entries by month ("2026-07" → entries). */
export function groupByMonth(
  entries: TimelineEntry[]
): { monthKey: string; entries: TimelineEntry[] }[] {
  const groups = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.monthKey) ?? [];
    list.push(entry);
    groups.set(entry.monthKey, list);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, groupedEntries]) => ({ monthKey, entries: groupedEntries }));
}
