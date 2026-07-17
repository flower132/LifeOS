import { LifeObject, Note } from "@/lib/types";
import { AIContextSource } from "./types";

// ---------------------------------------------------------------------------
// Source collection — every piece of context carries its origin so AI output
// can be traced back to real memories/objects (user trust).
// ---------------------------------------------------------------------------

const PREVIEW_LEN = 60;

function preview(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > PREVIEW_LEN
    ? `${trimmed.slice(0, PREVIEW_LEN)}…`
    : trimmed;
}

export function noteSource(note: Note): AIContextSource {
  return {
    kind: "note",
    id: note.id,
    label: preview(note.content),
    date: note.created_at,
  };
}

export function objectSource(object: LifeObject): AIContextSource {
  return {
    kind: object.type === "goal" || object.type === "project" ? "goal" : "object",
    id: object.id,
    label: object.name,
    date: object.updated_at,
  };
}

export function insightSource(objectId: string, title: string): AIContextSource {
  return { kind: "insight", id: objectId, label: preview(title) };
}

export function dedupeSources(
  sources: AIContextSource[],
  cap = 20
): AIContextSource[] {
  const seen = new Set<string>();
  const out: AIContextSource[] = [];
  for (const source of sources) {
    const key = `${source.kind}:${source.id}:${source.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(source);
    if (out.length >= cap) break;
  }
  return out;
}
