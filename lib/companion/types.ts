import {
  LifeObject,
  Note,
  Relation,
  IntelligencePattern,
  TodayFocus,
  IntelligenceTodayStory,
  CompanionMeta,
} from "@/lib/types";

export interface CompanionContext {
  self: LifeObject | null;
  objects: LifeObject[];
  notes: Note[];
  relations: Relation[];
  patterns: IntelligencePattern[];
  today: string; // YYYY-MM-DD local date
  language: "zh" | "en" | "ja";
}

export interface FocusCandidate {
  sourceType: TodayFocus["sourceType"];
  objectId?: string;
  relationId?: string;
  memoryId?: string;
  placeId?: string;
  habitId?: string;
  title: string;
  score: number;
  /** Most recent note that contributes to this candidate, if any. */
  anchorNote: Note | null;
  /** Notes relevant to this candidate. */
  relatedNotes: Note[];
}

export interface FocusEngineResult {
  focus: TodayFocus;
  candidate: FocusCandidate;
}

export interface StoryEngineResult {
  story: IntelligenceTodayStory | null;
}

export interface EnsureFocusOptions {
  force?: boolean;
  skipAi?: boolean;
}

export interface EnsureStoryOptions {
  force?: boolean;
}

export type CompanionAppearanceKind =
  | "focus"
  | "story"
  | "reminder"
  | "reflection"
  | "timeline"
  | "weekly"
  | "monthly";

export interface CompanionAppearance {
  kind: CompanionAppearanceKind;
  id?: string;
  createdAt: string;
}

export type { CompanionMeta };
