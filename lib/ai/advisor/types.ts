import { LifeObject, Note, Relation } from "@/lib/types";

export type AdvisorObjectType = "person" | "goal" | "project" | "self";

export interface AdvisorContext {
  object: LifeObject;
  notes: Note[];
  relations: Relation[];
  relatedObjects: LifeObject[];
}

export interface AdvisorEvidenceReference {
  kind: "note" | "memory" | "relation" | "object";
  id: string;
  objectId?: string;
}

export interface AdvisorEvidence {
  quote: string;
  source: string;
  resolved?: AdvisorEvidenceReference;
}

export interface AdvisorSection {
  content: string;
  evidence: AdvisorEvidence[];
}

export interface AdvisorResult {
  context: AdvisorSection;
  whatINotice: AdvisorSection;
  suggestion: AdvisorSection;
  why: AdvisorSection;
}

export interface AdvisorHomeInsightResult {
  narrative: string;
  maybeToday: string;
  evidence: AdvisorEvidence[];
}

export interface AdvisorAskOptions {
  forceMock?: boolean;
}

export interface AdvisorHomeInsightOptions {
  forceMock?: boolean;
}
