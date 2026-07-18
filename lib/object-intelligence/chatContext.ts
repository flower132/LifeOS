import { LifeObject, Note, Relation } from "@/lib/types";
import { Memory } from "@/lib/memory/types";
import { ObjectProfile } from "./types";
import { ObjectTimelineEntry } from "./timeline";
import { RelationshipGraph } from "./relationship";

// ---------------------------------------------------------------------------
// Chat Context — the full intelligence bundle for one object, assembled for
// the AI Summary Card and the Communication Assistant.
// ---------------------------------------------------------------------------

export interface ObjectChatContext {
  object: LifeObject;
  profile: ObjectProfile | null;
  knowledgeLines: string[];
  timeline: ObjectTimelineEntry[];
  graph: RelationshipGraph;
  memories: Memory[];
  notes: Note[];
  relations: Relation[];
}

export function buildObjectChatContext(params: {
  object: LifeObject;
  profile: ObjectProfile | null;
  knowledgeLines: string[];
  timeline: ObjectTimelineEntry[];
  graph: RelationshipGraph;
  memories: Memory[];
  notes: Note[];
  relations: Relation[];
}): ObjectChatContext {
  return { ...params };
}
