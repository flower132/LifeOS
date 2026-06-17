import {
  EventGoalInsight,
  EventGoalInsightSchema,
  PersonInsight,
  PersonInsightSchema,
  SelfInsight,
  SelfInsightSchema,
} from "./schemas";

const selfFallback: SelfInsight = {
  focus_areas: [],
  strengths: [],
  weaknesses: [],
  summary: "",
};

const personFallback: PersonInsight = {
  traits: [],
  relationship_status: "",
  notes: "",
};

const eventGoalFallback: EventGoalInsight = {
  summary: "",
  progress_insight: "",
  blockers: [],
};

export function normalizeSelfInsight(raw: unknown): SelfInsight {
  const parsed = SelfInsightSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[LifeOS] SelfInsight schema validation failed:", parsed.error);
    return selfFallback;
  }
  return parsed.data;
}

export function normalizePersonInsight(raw: unknown): PersonInsight {
  const parsed = PersonInsightSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(
      "[LifeOS] PersonInsight schema validation failed:",
      parsed.error
    );
    return personFallback;
  }
  return parsed.data;
}

export function normalizeEventGoalInsight(raw: unknown): EventGoalInsight {
  const parsed = EventGoalInsightSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(
      "[LifeOS] EventGoalInsight schema validation failed:",
      parsed.error
    );
    return eventGoalFallback;
  }
  return parsed.data;
}
