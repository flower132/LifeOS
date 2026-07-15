import {
  LifeObject,
  Note,
  Relation,
  IntelligencePattern,
  IntelligenceTodayStory,
  IntelligenceEvidence,
} from "@/lib/types";
import { Language } from "@/lib/i18n";

export interface IntelligenceContext {
  userId: string;
  self: LifeObject & { type: "self" };
  objects: LifeObject[];
  notes: Note[];
  relations: Relation[];
  language: Language;
  analysisWindow: { from: string; to: string };
}

export interface IntelligenceEngineResult {
  patterns: IntelligencePattern[];
  todayStory: IntelligenceTodayStory | null;
}

export interface IntelligenceRunOptions {
  force?: boolean;
  noteId?: string;
}

export interface BuildContextOptions {
  noteId?: string;
  maxNotes?: number;
}

export interface RelatedMemory {
  noteId: string;
  reason: string;
  evidence: IntelligenceEvidence[];
}

export interface PatternEngineInput {
  self: LifeObject & { type: "self" };
  objects: LifeObject[];
  notes: Note[];
  relations: Relation[];
  language: Language;
  recentNoteIds?: string[];
}

export interface TodayStoryEngineInput {
  self: LifeObject & { type: "self" };
  notes: Note[];
  language: Language;
  date: string;
}

export interface RelatedMemoriesEngineInput {
  noteId: string;
  notes: Note[];
  language: Language;
}
