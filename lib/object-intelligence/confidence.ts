import { LifeObject, Note } from "@/lib/types";
import { Memory } from "@/lib/memory/types";

// ---------------------------------------------------------------------------
// Confidence — how well AI understands an object, 0..1 (displayed as %).
//
//   confidence = 0.35 * memoryVolume
//              + 0.25 * interactionFrequency
//              + 0.20 * freshness
//              + 0.20 * userConfirmation
//
// Higher confidence → AI answers more assertively about this object.
// ---------------------------------------------------------------------------

export interface ConfidenceSignals {
  memories: Memory[];
  notes: Note[];
  object: LifeObject;
  now?: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Memory volume: saturates at ~20 memories. */
function memoryVolume(signals: ConfidenceSignals): number {
  return clamp01(signals.memories.length / 20);
}

/** Interaction frequency: memories+notes in the last 90 days, saturates at 12. */
function interactionFrequency(signals: ConfidenceSignals, now: number): number {
  const cutoff = now - 90 * 24 * 60 * 60 * 1000;
  const recentMemories = signals.memories.filter((m) => m.timestamp >= cutoff).length;
  const recentNotes = signals.notes.filter(
    (n) => new Date(n.created_at).getTime() >= cutoff
  ).length;
  return clamp01((recentMemories + recentNotes) / 12);
}

/** Freshness: exponential decay with 60-day half-life since the last record. */
function freshness(signals: ConfidenceSignals, now: number): number {
  const latest = Math.max(
    0,
    ...signals.memories.map((m) => m.timestamp),
    ...signals.notes.map((n) => new Date(n.created_at).getTime())
  );
  if (latest === 0) return 0;
  const ageDays = (now - latest) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / 60);
}

/**
 * User confirmation: explicit AI-review artifacts on the object (aiProfile /
 * insights / suggestions mean the user has seen and kept AI output).
 */
function userConfirmation(signals: ConfidenceSignals): number {
  let score = 0;
  if (signals.object.aiProfile) score += 0.5;
  if ((signals.object.aiInsights?.length ?? 0) > 0) score += 0.3;
  if ((signals.object.aiSuggestions?.length ?? 0) > 0) score += 0.2;
  return clamp01(score);
}

export function calculateConfidence(signals: ConfidenceSignals): number {
  const now = signals.now ?? Date.now();
  const score =
    0.35 * memoryVolume(signals) +
    0.25 * interactionFrequency(signals, now) +
    0.2 * freshness(signals, now) +
    0.2 * userConfirmation(signals);
  return Math.round(clamp01(score) * 100) / 100;
}
