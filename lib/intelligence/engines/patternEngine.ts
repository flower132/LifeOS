import { v4 as uuidv4 } from "uuid";
import { IntelligencePattern, Note } from "@/lib/types";
import { PatternEngineInput } from "../core/types";
import { PatternOutput, patternOutputSchema } from "../schemas";

function mapPatternOutput(output: PatternOutput, existingPatterns: IntelligencePattern[]): IntelligencePattern[] {
  const now = new Date().toISOString();
  return output.patterns.map((p) => {
    const existing = existingPatterns.find(
      (ep) => ep.title === p.title && ep.category === p.category
    );
    return {
      id: existing?.id ?? uuidv4(),
      title: p.title,
      description: p.description,
      category: p.category,
      firstSeenAt: existing ? minDate(existing.firstSeenAt, p.firstSeenAt) : p.firstSeenAt,
      lastSeenAt: existing ? maxDate(existing.lastSeenAt, p.lastSeenAt) : p.lastSeenAt,
      frequency: p.frequency,
      confidence: p.confidence,
      evidence: mergeEvidence(existing?.evidence ?? [], p.evidence),
      noteIds: mergeNoteIds(existing?.noteIds ?? [], p.noteIds),
      status: existing?.status ?? "active",
      userFeedback: existing?.userFeedback,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  });
}

function minDate(a: string, b: string): string {
  return new Date(a) < new Date(b) ? a : b;
}

function maxDate(a: string, b: string): string {
  return new Date(a) > new Date(b) ? a : b;
}

function mergeEvidence(existing: { quote: string; source: string }[], incoming: { quote: string; source: string }[]): { quote: string; source: string }[] {
  const seen = new Set(existing.map((e) => `${e.source}:${e.quote}`));
  const merged = [...existing];
  for (const e of incoming) {
    const key = `${e.source}:${e.quote}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(e);
    }
  }
  return merged;
}

function mergeNoteIds(existing: string[], incoming: string[]): string[] {
  const set = new Set([...existing, ...incoming]);
  return Array.from(set);
}

export async function discoverPatterns(
  rawOutput: unknown,
  input: PatternEngineInput,
  existingPatterns: IntelligencePattern[]
): Promise<IntelligencePattern[]> {
  const parsed = patternOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.error("[Intelligence] Pattern output parse error:", parsed.error);
    return [];
  }
  return mapPatternOutput(parsed.data, existingPatterns);
}

export function serializeNotesForPattern(notes: Note[]): string {
  return notes
    .map((n) => `[note:${n.id}] ${n.created_at}\n${n.content}`)
    .join("\n\n---\n\n");
}
