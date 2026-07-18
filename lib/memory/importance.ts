import { LifeObject, Note } from "@/lib/types";
import { MemoryType } from "./types";

// ---------------------------------------------------------------------------
// Importance — v1 rule formula (no ML):
//
//   importance = 0.3 * userMarked
//              + 0.3 * aiImportance
//              + 0.2 * involvesImportantObject
//              + 0.2 * longTermValue
//
// ≥ LONG_TERM_THRESHOLD (0.6) → enters long-term memory; below → history.
// ---------------------------------------------------------------------------

export interface ImportanceSignals {
  /** From the origin note (attachments = user cared to capture). */
  note?: Note;
  /** AI-estimated importance from the extractor (0..1). */
  aiImportance: number;
  /** Objects linked to this memory. */
  linkedObjects: LifeObject[];
  /** Memory type from extraction. */
  type: MemoryType;
  /** Whether AI produced long-term insights. */
  hasInsights: boolean;
}

const HIGH_VALUE_TYPES: MemoryType[] = ["decision", "reflection"];

function userMarked(signals: ImportanceSignals): number {
  // v1: no manual marking UI; attachments are the strongest implicit mark.
  if (signals.note && signals.note.attachments.length > 0) return 1;
  return 0;
}

function involvesImportantObject(signals: ImportanceSignals): number {
  if (signals.linkedObjects.length === 0) return 0;
  // The self object and objects with AI profiles are the user's core world.
  const hasCore = signals.linkedObjects.some(
    (o) => o.type === "self" || (o.memories?.length ?? 0) >= 3 || o.aiProfile
  );
  return hasCore ? 1 : 0.5;
}

function longTermValue(signals: ImportanceSignals): number {
  let score = 0;
  if (HIGH_VALUE_TYPES.includes(signals.type)) score += 0.6;
  if (signals.hasInsights) score += 0.4;
  return Math.min(1, score);
}

export function calculateImportance(signals: ImportanceSignals): number {
  const score =
    0.3 * userMarked(signals) +
    0.3 * signals.aiImportance +
    0.2 * involvesImportantObject(signals) +
    0.2 * longTermValue(signals);
  return Math.round(Math.min(1, score) * 100) / 100;
}
