import { Note } from "@/lib/types";

// ---------------------------------------------------------------------------
// Relevance scoring — v1 is rule-based (no vector DB). The composite mirrors
// the target formula so the scoring backend can later be swapped for
// Embedding + Vector Search without touching callers:
//
//   score = entityMatch * 0.4
//         + timeWeight * 0.2
//         + semanticSimilarity * 0.3
//         + importance * 0.1
// ---------------------------------------------------------------------------

export interface RelevanceSignals {
  /** Currently discussed object — strong entity match. */
  objectId?: string;
  /** Display name of the discussed entity (mention matching). */
  objectName?: string;
  /** Free-form user input for semantic matching. */
  query?: string;
  /** ISO timestamp treated as "now" (defaults to Date.now()). */
  now?: string;
}

const WEIGHTS = {
  entity: 0.4,
  time: 0.2,
  semantic: 0.3,
  importance: 0.1,
} as const;

/** Half-life of memory freshness, in days. */
const TIME_HALF_LIFE_DAYS = 30;

function entityMatch(note: Note, signals: RelevanceSignals): number {
  // User explicitly linked this note to the object — the strongest signal.
  if (signals.objectId && note.object_id === signals.objectId) return 1;
  if (signals.objectName) {
    const name = signals.objectName.trim().toLowerCase();
    if (name.length >= 2 && note.content.toLowerCase().includes(name)) {
      return 0.6;
    }
  }
  return 0;
}

function timeWeight(note: Note, signals: RelevanceSignals): number {
  const now = signals.now ? new Date(signals.now).getTime() : Date.now();
  const ageDays = Math.max(
    0,
    (now - new Date(note.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  // Exponential decay: 1 today, 0.5 after one half-life.
  return Math.pow(0.5, ageDays / TIME_HALF_LIFE_DAYS);
}

/**
 * Cheap semantic similarity: character-bigram Jaccard overlap between the
 * query terms and the note content. Works for Chinese (no word boundaries)
 * and English alike. Replaceable by embedding cosine similarity later.
 */
function semanticSimilarity(note: Note, signals: RelevanceSignals): number {
  const reference = [signals.query, signals.objectName]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();
  if (!reference) return 0;

  const content = note.content.toLowerCase();
  const refBigrams = bigrams(reference);
  if (refBigrams.size === 0) return 0;

  const contentBigrams = bigrams(content);
  let intersection = 0;
  for (const gram of refBigrams) {
    if (contentBigrams.has(gram)) intersection++;
  }
  return intersection / refBigrams.size;
}

function bigrams(text: string): Set<string> {
  const cleaned = text.replace(/\s+/g, "");
  const grams = new Set<string>();
  for (let i = 0; i < cleaned.length - 1; i++) {
    grams.add(cleaned.slice(i, i + 2));
  }
  return grams;
}

function importance(note: Note): number {
  let score = 0.3;
  // Attachments signal a moment the user cared to capture.
  if (note.attachments.length > 0) score += 0.4;
  // Longer entries usually carry more substance.
  if (note.content.length > 200) score += 0.3;
  else if (note.content.length > 60) score += 0.15;
  return Math.min(1, score);
}

/** Composite relevance of a memory for the current task, in [0, 1]. */
export function scoreMemory(note: Note, signals: RelevanceSignals): number {
  const score =
    entityMatch(note, signals) * WEIGHTS.entity +
    timeWeight(note, signals) * WEIGHTS.time +
    semanticSimilarity(note, signals) * WEIGHTS.semantic +
    importance(note) * WEIGHTS.importance;
  return Math.round(score * 1000) / 1000;
}

/** Score and rank a candidate pool, descending. */
export function rankMemories(
  notes: Note[],
  signals: RelevanceSignals
): { note: Note; score: number }[] {
  return notes
    .map((note) => ({ note, score: scoreMemory(note, signals) }))
    .sort((a, b) => b.score - a.score);
}
