import {
  LifeObject,
  Note,
  Relation,
  Tag,
  Template,
  TemplateCreateInput,
  AIAnalysisHistoryEntry,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  IntelligenceCache,
  IntelligenceMeta,
  IntelligenceTodayStory,
} from "./types";

const VALID_OBJECT_TYPES = new Set([
  "person",
  "self",
  "event",
  "idea",
  "goal",
  "project",
  "knowledge",
]);

const VALID_RELATION_TYPES = new Set([
  "family",
  "friend",
  "colleague",
  "mentor",
  "partner",
  "custom",
]);

const VALID_TEMPLATE_CATEGORIES = new Set([
  "person",
  "self",
  "goal",
  "event",
  "idea",
  "task",
  "custom",
]);

const VALID_NOTE_SOURCE_TYPES = new Set([
  "text",
  "chat",
  "email",
  "social_post",
  "document",
  "resume",
  "image",
]);

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function isValidLifeObject(obj: unknown): obj is LifeObject {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;

  if (!isValidId(o.id)) return false;
  if (!VALID_OBJECT_TYPES.has(o.type as string)) return false;
  if (typeof o.name !== "string" || o.name.trim().length === 0) return false;
  if (!Array.isArray(o.tag_ids)) return false;
  if (!o.tag_ids.every((id) => isValidId(id))) return false;
  if (!isValidIsoDate(o.created_at)) return false;
  if (!isValidIsoDate(o.updated_at)) return false;
  if (o.description !== undefined && typeof o.description !== "string") {
    return false;
  }
  if (o.properties !== undefined && (typeof o.properties !== "object" || o.properties === null)) {
    return false;
  }
  if (o.aiProfile !== undefined && (typeof o.aiProfile !== "object" || o.aiProfile === null)) {
    return false;
  }
  if (o.aiInsights !== undefined && !Array.isArray(o.aiInsights)) {
    return false;
  }
  if (o.aiSuggestions !== undefined && !Array.isArray(o.aiSuggestions)) {
    return false;
  }
  if (o.memories !== undefined && !Array.isArray(o.memories)) {
    return false;
  }

  return true;
}

export function isValidNote(obj: unknown): obj is Note {
  if (!obj || typeof obj !== "object") return false;
  const n = obj as Record<string, unknown>;

  if (!isValidId(n.id)) return false;
  if (n.object_id !== null && !isValidId(n.object_id)) return false;
  if (typeof n.content !== "string" || n.content.trim().length === 0) {
    return false;
  }
  if (n.sourceType !== undefined && !VALID_NOTE_SOURCE_TYPES.has(n.sourceType as string)) {
    return false;
  }
  if (n.attachments !== undefined && !Array.isArray(n.attachments)) {
    return false;
  }
  if (!isValidIsoDate(n.created_at)) return false;

  return true;
}

export function isValidRelation(obj: unknown): obj is Relation {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;

  if (!isValidId(r.id)) return false;
  if (!isValidId(r.source_object_id)) return false;
  if (!isValidId(r.target_object_id)) return false;
  if (!VALID_RELATION_TYPES.has(r.type as string)) return false;
  if (!isValidIsoDate(r.created_at)) return false;
  if (r.note !== undefined && typeof r.note !== "string") return false;
  if (
    r.strength !== undefined &&
    (typeof r.strength !== "number" || r.strength < 0 || r.strength > 1)
  ) {
    return false;
  }

  return true;
}

export function isValidTag(obj: unknown): obj is Tag {
  if (!obj || typeof obj !== "object") return false;
  const t = obj as Record<string, unknown>;

  if (!isValidId(t.id)) return false;
  if (typeof t.name !== "string" || t.name.trim().length === 0) return false;
  if (!isValidIsoDate(t.createdAt)) return false;
  if (typeof t.usageCount !== "number" || t.usageCount < 0) return false;
  if (t.color !== undefined && typeof t.color !== "string") return false;

  return true;
}

export function validateInputObject(
  obj: Omit<LifeObject, "id" | "created_at" | "updated_at"
>
): void {
  if (!VALID_OBJECT_TYPES.has(obj.type)) {
    throw new Error(`Invalid object type: ${obj.type}`);
  }
  if (!obj.name || obj.name.trim().length === 0) {
    throw new Error("Object name is required");
  }
  if (!Array.isArray(obj.tag_ids)) {
    throw new Error("Object tag_ids must be an array");
  }
}

export function validateInputNote(
  note: Omit<Note, "id" | "created_at">
): void {
  if (note.object_id !== null && (!note.object_id || note.object_id.trim().length === 0)) {
    throw new Error("Note object_id is required");
  }
  if (!note.content || note.content.trim().length === 0) {
    throw new Error("Note content is required");
  }
  if (note.attachments !== undefined && !Array.isArray(note.attachments)) {
    throw new Error("Note attachments must be an array");
  }
}

export function validateInputRelation(
  relation: Omit<Relation, "id" | "created_at">
): void {
  if (!relation.source_object_id || !relation.target_object_id) {
    throw new Error("Relation source and target object ids are required");
  }
  if (!VALID_RELATION_TYPES.has(relation.type)) {
    throw new Error(`Invalid relation type: ${relation.type}`);
  }
}

export function validateInputTag(
  tag: Omit<Tag, "id" | "createdAt" | "usageCount"
>
): void {
  if (!tag.name || tag.name.trim().length === 0) {
    throw new Error("Tag name is required");
  }
}

export function isValidTemplate(obj: unknown): obj is Template {
  if (!obj || typeof obj !== "object") return false;
  const t = obj as Record<string, unknown>;

  if (!isValidId(t.id)) return false;
  if (typeof t.name !== "string" || t.name.trim().length === 0) return false;
  if (!VALID_TEMPLATE_CATEGORIES.has(t.category as string)) return false;
  if (typeof t.isDefault !== "boolean") return false;
  if (typeof t.content !== "string") return false;
  if (
    t.templateVersion !== undefined &&
    typeof t.templateVersion !== "number"
  ) {
    return false;
  }
  if (!isValidIsoDate(t.createdAt)) return false;
  if (!isValidIsoDate(t.updatedAt)) return false;
  if (typeof t.usageCount !== "number" || t.usageCount < 0) return false;
  if (t.lastUsedAt !== undefined && !isValidIsoDate(t.lastUsedAt)) return false;

  return true;
}

export function validateInputTemplate(template: TemplateCreateInput): void {
  if (!template.name || template.name.trim().length === 0) {
    throw new Error("Template name is required");
  }
  if (!VALID_TEMPLATE_CATEGORIES.has(template.category)) {
    throw new Error(`Invalid template category: ${template.category}`);
  }
  if (typeof template.isDefault !== "boolean") {
    throw new Error("Template isDefault must be a boolean");
  }
  if (typeof template.content !== "string") {
    throw new Error("Template content must be a string");
  }
  if (typeof template.templateVersion !== "number") {
    throw new Error("Template templateVersion must be a number");
  }
}

// ── AI Object Intelligence validators ───────────────────────────────────────

export function isValidObjectAIInsight(obj: unknown): obj is ObjectAIInsight {
  if (!obj || typeof obj !== "object") return false;
  const item = obj as Record<string, unknown>;

  if (!isValidId(item.id)) return false;
  if (typeof item.category !== "string") return false;
  if (typeof item.title !== "string") return false;
  if (typeof item.description !== "string") return false;
  if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 100) {
    return false;
  }
  if (!Array.isArray(item.evidence)) return false;
  if (!isValidIsoDate(item.createdAt)) return false;

  return true;
}

export function isValidObjectAISuggestion(obj: unknown): obj is ObjectAISuggestion {
  if (!obj || typeof obj !== "object") return false;
  const item = obj as Record<string, unknown>;

  if (!isValidId(item.id)) return false;
  if (typeof item.title !== "string") return false;
  if (typeof item.description !== "string") return false;
  if (!["low", "medium", "high"].includes(item.priority as string)) return false;
  if (item.status !== undefined && !["active", "done", "dismissed"].includes(item.status as string)) {
    return false;
  }
  if (item.completedAt !== undefined && !isValidIsoDate(item.completedAt)) return false;
  if (!isValidIsoDate(item.generatedAt)) return false;

  return true;
}

export function isValidObjectMemory(obj: unknown): obj is ObjectMemory {
  if (!obj || typeof obj !== "object") return false;
  const item = obj as Record<string, unknown>;

  if (!isValidId(item.id)) return false;
  if (typeof item.content !== "string") return false;
  if (!["user", "ai", "import", "note"].includes(item.source as string)) return false;
  if (!isValidIsoDate(item.createdAt)) return false;

  return true;
}

export function isValidAIAnalysisHistoryEntry(obj: unknown): obj is AIAnalysisHistoryEntry {
  if (!obj || typeof obj !== "object") return false;
  const h = obj as Record<string, unknown>;

  if (!isValidId(h.id)) return false;
  if (!VALID_OBJECT_TYPES.has(h.objectType as string)) return false;
  if (h.objectId !== undefined && typeof h.objectId !== "string") return false;
  if (!isValidIsoDate(h.createdAt)) return false;
  if (typeof h.rawTextInput !== "string") return false;
  if (typeof h.imageCount !== "number" || h.imageCount < 0) return false;
  if (!Array.isArray(h.imageThumbnails)) return false;
  if (typeof h.provider !== "string") return false;
  if (typeof h.model !== "string") return false;
  if (typeof h.durationMs !== "number" || h.durationMs < 0) return false;
  if (typeof h.rawOutput !== "string") return false;

  if (h.profileSnapshot !== undefined && (typeof h.profileSnapshot !== "object" || h.profileSnapshot === null)) {
    return false;
  }
  if (h.insightsSnapshot !== undefined && !Array.isArray(h.insightsSnapshot)) {
    return false;
  }
  if (h.suggestionsSnapshot !== undefined && !Array.isArray(h.suggestionsSnapshot)) {
    return false;
  }
  if (h.memoriesSnapshot !== undefined && !Array.isArray(h.memoriesSnapshot)) {
    return false;
  }

  return true;
}

// ── Intelligence Engine validators ──────────────────────────────────────────

const VALID_INTELLIGENCE_PATTERN_CATEGORIES = new Set([
  "emotion",
  "behavior",
  "relationship",
  "decision",
  "goal",
  "health",
  "work",
]);

const VALID_INTELLIGENCE_PATTERN_FREQUENCIES = new Set([
  "recurring",
  "spike",
  "declining",
  "stable",
]);

const VALID_INTELLIGENCE_PATTERN_STATUSES = new Set([
  "active",
  "dismissed",
  "confirmed",
]);

const VALID_INTELLIGENCE_USER_FEEDBACK = new Set([
  "agree",
  "disagree",
  "neutral",
]);

function isValidIntelligenceEvidence(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const e = obj as Record<string, unknown>;
  return typeof e.quote === "string" && typeof e.source === "string";
}

export function isValidDailyTimeline(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.date === "string" &&
    typeof t.summary === "string" &&
    Array.isArray(t.evidence) &&
    t.evidence.every(isValidIntelligenceEvidence) &&
    typeof t.createdAt === "string" &&
    typeof t.updatedAt === "string"
  );
}

export function isValidWeeklyReview(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  const sectionValid = (s: unknown) => {
    if (!s || typeof s !== "object") return false;
    const sec = s as Record<string, unknown>;
    return typeof sec.statement === "string" && Array.isArray(sec.evidence) && sec.evidence.every(isValidIntelligenceEvidence);
  };
  const namedSectionValid = (s: unknown) => {
    if (!s || typeof s !== "object") return false;
    const sec = s as Record<string, unknown>;
    return (
      typeof sec.name === "string" &&
      typeof sec.reason === "string" &&
      Array.isArray(sec.evidence) &&
      sec.evidence.every(isValidIntelligenceEvidence)
    );
  };
  return (
    typeof r.id === "string" &&
    typeof r.weekKey === "string" &&
    typeof r.periodFrom === "string" &&
    typeof r.periodTo === "string" &&
    (r.mostImportantPerson === undefined || namedSectionValid(r.mostImportantPerson)) &&
    (r.mostImportantGoal === undefined || namedSectionValid(r.mostImportantGoal)) &&
    (r.growth === undefined || sectionValid(r.growth)) &&
    (r.emotion === undefined || sectionValid(r.emotion)) &&
    (r.gratitude === undefined || sectionValid(r.gratitude)) &&
    (r.status === "active" || r.status === "dismissed") &&
    typeof r.createdAt === "string"
  );
}

export function isValidMonthlyStory(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.monthKey === "string" &&
    typeof s.periodFrom === "string" &&
    typeof s.periodTo === "string" &&
    typeof s.story === "string" &&
    Array.isArray(s.evidence) &&
    s.evidence.every(isValidIntelligenceEvidence) &&
    (s.status === "active" || s.status === "dismissed") &&
    typeof s.createdAt === "string"
  );
}

export function isValidCompanionMeta(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const m = obj as Record<string, unknown>;
  const nullableString = (v: unknown) => v === null || typeof v === "string";
  return (
    nullableString(m.lastFocusDate) &&
    nullableString(m.lastReminderDate) &&
    nullableString(m.lastReflectionDate) &&
    nullableString(m.lastWeeklyWeekKey) &&
    nullableString(m.lastMonthlyMonthKey) &&
    typeof m.consecutiveRejections === "number" &&
    nullableString(m.lastAppearanceAt) &&
    typeof m.appearanceCountToday === "number"
  );
}

export function isValidIntelligenceCache(obj: unknown): obj is IntelligenceCache {
  if (!obj || typeof obj !== "object") return false;
  const c = obj as Record<string, unknown>;

  const arrays = [
    "chapters",
    "patterns",
    "relationshipPatterns",
    "decisions",
    "decisionPatterns",
    "growthSnapshots",
    "themeSnapshots",
    "crossObjectInsights",
    "reflectionQuestions",
    "todayStories",
    "todayFocuses",
    "reminders",
    "reflections",
    "dailyTimelines",
    "weeklyReviews",
    "monthlyStories",
    "feedback",
  ];

  for (const key of arrays) {
    if (!Array.isArray(c[key])) return false;
  }

  return true;
}

export function isValidIntelligenceMeta(obj: unknown): obj is IntelligenceMeta {
  if (!obj || typeof obj !== "object") return false;
  const m = obj as Record<string, unknown>;

  if (m.lastFullAnalysisAt !== null && m.lastFullAnalysisAt !== undefined && !isValidIsoDate(m.lastFullAnalysisAt)) {
    return false;
  }
  if (
    m.lastIncrementalAnalysisAt !== null &&
    m.lastIncrementalAnalysisAt !== undefined &&
    !isValidIsoDate(m.lastIncrementalAnalysisAt)
  ) {
    return false;
  }
  if (typeof m.analysisVersion !== "string") return false;
  if (typeof m.pendingUpdate !== "boolean") return false;

  return true;
}

export function isValidIntelligencePattern(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const p = obj as Record<string, unknown>;

  if (!isValidId(p.id)) return false;
  if (typeof p.title !== "string" || p.title.trim().length === 0) return false;
  if (typeof p.description !== "string") return false;
  if (!VALID_INTELLIGENCE_PATTERN_CATEGORIES.has(p.category as string)) return false;
  if (!isValidIsoDate(p.firstSeenAt)) return false;
  if (!isValidIsoDate(p.lastSeenAt)) return false;
  if (!VALID_INTELLIGENCE_PATTERN_FREQUENCIES.has(p.frequency as string)) return false;
  if (typeof p.confidence !== "number" || p.confidence < 0 || p.confidence > 1) return false;
  if (!Array.isArray(p.evidence) || !p.evidence.every(isValidIntelligenceEvidence)) return false;
  if (!Array.isArray(p.noteIds)) return false;
  if (!VALID_INTELLIGENCE_PATTERN_STATUSES.has(p.status as string)) return false;
  if (p.userFeedback !== undefined && !VALID_INTELLIGENCE_USER_FEEDBACK.has(p.userFeedback as string)) {
    return false;
  }
  if (!isValidIsoDate(p.createdAt)) return false;
  if (!isValidIsoDate(p.updatedAt)) return false;

  return true;
}

export function isValidIntelligenceTodayStory(obj: unknown): obj is IntelligenceTodayStory {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;

  if (!isValidId(s.id)) return false;
  if (typeof s.date !== "string" || s.date.trim().length === 0) return false;
  if (typeof s.story !== "string" || s.story.trim().length === 0) return false;
  if (!Array.isArray(s.evidence) || !s.evidence.every(isValidIntelligenceEvidence)) return false;
  if (!isValidIsoDate(s.createdAt)) return false;

  return true;
}

