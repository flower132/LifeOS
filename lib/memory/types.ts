// ---------------------------------------------------------------------------
// Unified Memory — the single core record of the Memory & Knowledge Layer.
//
// One shape for every kind of memory (note / event / conversation /
// reflection / decision / experience / summary). Entities, relations and
// insights are embedded in the record so Local Mode and Cloud Mode share an
// identical JSON structure; the embedded fields map 1:1 onto the normalized
// tables (memory_entities / memory_relations / memory_insights) if the
// schema is ever normalized.
// ---------------------------------------------------------------------------

export type MemoryType =
  | "event"
  | "note"
  | "conversation"
  | "reflection"
  | "decision"
  | "experience"
  | "summary";

export type MemorySourceType = "text" | "image" | "file" | "voice" | "ai";

export interface MemoryEntities {
  /** LifeObject ids resolved by the linker (people objects). */
  people: string[];
  projects: string[];
  goals: string[];
  /** Free-text places (no place object type yet). */
  places: string[];
}

export interface MemoryRelation {
  /** Target LifeObject id. */
  targetId: string;
  /** e.g. "mentioned" | "interaction" | "decision_about" | "progress". */
  relation: string;
}

export interface MemorySource {
  type: MemorySourceType;
  /** Origin note id when the memory derives from a note. */
  noteId?: string;
}

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  /** AI one-line summary (long-term contexts use this, not the raw text). */
  summary?: string;
  entities: MemoryEntities;
  /** Topic tags extracted by AI (e.g. "成本控制"). */
  topics: string[];
  emotions?: string[];
  /** AI insights (e.g. "老板偏好风险控制"). */
  insights: string[];
  /** 0..1 — see importance.ts. ≥ LONG_TERM_THRESHOLD enters long-term memory. */
  importance: number;
  /** Event time (ms epoch) — when it happened, not when it was saved. */
  timestamp: number;
  source: MemorySource;
  relations: MemoryRelation[];
  createdAt: string;
  updatedAt: string;
}

/** Importance at/above which a memory is treated as long-term knowledge. */
export const LONG_TERM_THRESHOLD = 0.6;

const MEMORY_TYPES: MemoryType[] = [
  "event",
  "note",
  "conversation",
  "reflection",
  "decision",
  "experience",
  "summary",
];

const SOURCE_TYPES: MemorySourceType[] = ["text", "image", "file", "voice", "ai"];

/** Runtime validator used by both storage adapters (filterValid pattern). */
export function isValidMemory(value: unknown): value is Memory {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    typeof m.type === "string" &&
    MEMORY_TYPES.includes(m.type as MemoryType) &&
    typeof m.content === "string" &&
    typeof m.importance === "number" &&
    typeof m.timestamp === "number" &&
    typeof m.createdAt === "string" &&
    typeof m.updatedAt === "string" &&
    typeof m.source === "object" &&
    m.source !== null &&
    SOURCE_TYPES.includes((m.source as MemorySource).type) &&
    Array.isArray(m.topics) &&
    Array.isArray(m.insights) &&
    Array.isArray(m.relations) &&
    typeof m.entities === "object" &&
    m.entities !== null &&
    Array.isArray((m.entities as MemoryEntities).people) &&
    Array.isArray((m.entities as MemoryEntities).projects) &&
    Array.isArray((m.entities as MemoryEntities).goals) &&
    Array.isArray((m.entities as MemoryEntities).places)
  );
}
