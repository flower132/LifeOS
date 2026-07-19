import { v4 as uuidv4 } from "uuid";
import {
  CompanionContext,
  FocusCandidate,
  FocusEngineResult,
} from "./types";
import {
  LifeObject,
  Note,
  TodayFocus,
  IntelligenceEvidence,
} from "@/lib/types";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { AIStructuredGenerationRequest } from "@/lib/ai/types";
import { daysBetween } from "./utils/date";
import { buildFocusPrompt, buildMockFocusOutput } from "@/lib/ai/prompts/todayFocus";
import { focusOutputSchema } from "./schemas";
import { applyPenalty } from "./learning";
import { resolveTranslation, interpolate, localeFromLanguage } from "@/translations";

/** Translate a focus key in the given language (falls back to key). */
function tt(
  key: string,
  language: "zh" | "en",
  vars: Record<string, string | number> = {}
): string {
  const locale = localeFromLanguage(language);
  const text = resolveTranslation(key, locale, vars);
  return interpolate(text ?? key, vars);
}

// ── Keywords for heuristic signals ───────────────────────────────────────────

const STRONG_EMOTION_KEYWORDS = [
  "开心", "高兴", "兴奋", "惊喜", "感动",
  "难过", "伤心", "痛苦", "绝望", "孤独",
  "生气", "愤怒", "烦躁", "焦虑", "紧张",
  "害怕", "恐惧", "担心", "欣慰", "感激",
  "幸福", "失落", "疲惫", "累", "压力",
  "happy", "sad", "angry", "anxious", "worried",
  "excited", "grateful", "lonely", "stressed", "tired",
];

const HEALTH_KEYWORDS = [
  "身体", "健康", "生病", "感冒", "发烧", "医院", "医生",
  "睡眠", "睡觉", "失眠", "熬夜", "运动", "锻炼", "跑步",
  "瑜伽", "健身", "饮食", "吃饭", "胃口", "体重",
  "headache", "sleep", "insomnia", "exercise", "workout",
  "run", "gym", "health", "sick", "hospital", "doctor",
];

const IN_PROGRESS_STATUS = ["in_progress", "进行中", "active"];

// ── Utilities ────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function getObjectNotes(objectId: string, notes: Note[]): Note[] {
  return notes
    .filter((n) => n.object_id === objectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function latestNote(notes: Note[]): Note | null {
  if (notes.length === 0) return null;
  return notes.reduce((latest, n) =>
    new Date(n.created_at).getTime() > new Date(latest.created_at).getTime() ? n : latest
  );
}

function containsKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

function notesInWindow(notes: Note[], days: number): Note[] {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return notes.filter((n) => n.created_at >= cutoff);
}

function objectStatus(obj: LifeObject): string {
  return String(obj.properties?.status ?? "").toLowerCase();
}

function isActiveGoalOrProject(obj: LifeObject): boolean {
  return (
    (obj.type === "goal" || obj.type === "project") &&
    IN_PROGRESS_STATUS.includes(objectStatus(obj))
  );
}

// ── Candidate builders ───────────────────────────────────────────────────────

function buildObjectCandidates(context: CompanionContext): FocusCandidate[] {
  const focusTypes = ["person", "goal", "project", "self", "event"] as const;
  return context.objects
    .filter((o) => focusTypes.includes(o.type as (typeof focusTypes)[number]))
    .map((obj) => {
      const objectNotes = getObjectNotes(obj.id, context.notes);
      return {
        sourceType: obj.type as TodayFocus["sourceType"],
        objectId: obj.id,
        title: obj.name,
        score: 0,
        anchorNote: latestNote(objectNotes),
        relatedNotes: objectNotes,
      };
    });
}

function buildRelationshipCandidates(context: CompanionContext): FocusCandidate[] {
  return context.relations.map((relation) => {
    const source = context.objects.find((o) => o.id === relation.source_object_id);
    const target = context.objects.find((o) => o.id === relation.target_object_id);
    const names = [source?.name, target?.name].filter(Boolean).join(tt("focus.relationshipAnd", context.language));
    const relatedNotes = context.notes.filter(
      (n) =>
        n.object_id === relation.source_object_id ||
        n.object_id === relation.target_object_id
    );
    return {
      sourceType: "relationship" as const,
      relationId: relation.id,
      title: names || tt("focus.aRelationship", context.language),
      score: 0,
      anchorNote: latestNote(relatedNotes),
      relatedNotes,
    };
  });
}

function buildMemoryCandidates(context: CompanionContext): FocusCandidate[] {
  // Surface a few recent notes that carry strong emotional signal as standalone
  // memory candidates. This ensures a powerful recent moment can become the focus.
  const recent = context.notes
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  return recent
    .filter((note) => containsKeyword(note.content, STRONG_EMOTION_KEYWORDS))
    .slice(0, 3)
    .map((note) => ({
      sourceType: "memory" as const,
      memoryId: note.id,
      title: note.content.slice(0, 15) || tt("focus.aMemory", context.language),
      score: 0,
      anchorNote: note,
      relatedNotes: [note],
    }));
}

function buildEventCandidates(): FocusCandidate[] {
  // Event objects are already covered by buildObjectCandidates; this function
  // exists as an extension point for calendar/date-aware scoring in P1/P2.
  return [];
}

export function buildCandidates(context: CompanionContext): FocusCandidate[] {
  return [
    ...buildObjectCandidates(context),
    ...buildRelationshipCandidates(context),
    ...buildMemoryCandidates(context),
    ...buildEventCandidates(),
  ];
}

// ── Scoring ──────────────────────────────────────────────────────────────────

function scoreRecency(candidate: FocusCandidate): number {
  const latest = candidate.anchorNote;
  if (!latest) return 0;
  const days = daysBetween(latest.created_at, now());
  if (days <= 7) return 30;
  if (days <= 30) return 20;
  if (days <= 90) return 10;
  return 5;
}

function scoreEmotionalWeight(candidate: FocusCandidate): number {
  const recent = notesInWindow(candidate.relatedNotes, 14);
  const hasStrong = recent.some((n) => containsKeyword(n.content, STRONG_EMOTION_KEYWORDS));
  return hasStrong ? 20 : 0;
}

function scoreGoalAlignment(candidate: FocusCandidate, context: CompanionContext): number {
  if (!candidate.objectId) return 0;
  const obj = context.objects.find((o) => o.id === candidate.objectId);
  if (!obj) return 0;
  if (isActiveGoalOrProject(obj)) return 15;
  // Person linked to an active goal/project via relation gets a small bump.
  if (obj.type === "person") {
    const linkedGoalIds = new Set(
      context.relations
        .filter(
          (r) =>
            (r.source_object_id === obj.id || r.target_object_id === obj.id)
        )
        .flatMap((r) => [r.source_object_id, r.target_object_id])
    );
    const hasActiveGoal = context.objects.some(
      (o) => linkedGoalIds.has(o.id) && isActiveGoalOrProject(o)
    );
    if (hasActiveGoal) return 10;
  }
  return 0;
}

function scoreRelationshipRecency(candidate: FocusCandidate): number {
  if (candidate.sourceType !== "person" && candidate.sourceType !== "relationship") {
    return 0;
  }
  const latest = candidate.anchorNote;
  if (!latest) return 0;
  const days = daysBetween(latest.created_at, now());
  if (days <= 14) return 15;
  if (days <= 30) return 10;
  if (days <= 90) return 5;
  return 0;
}

function scorePatternSignal(candidate: FocusCandidate, context: CompanionContext): number {
  const candidateNoteIds = new Set(candidate.relatedNotes.map((n) => n.id));
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return context.patterns.some(
    (p) =>
      p.status === "active" &&
      p.lastSeenAt >= cutoff &&
      p.noteIds.some((id) => candidateNoteIds.has(id))
  )
    ? 10
    : 0;
}

function scoreHealthSignal(candidate: FocusCandidate): number {
  const recent = notesInWindow(candidate.relatedNotes, 14);
  return recent.some((n) => containsKeyword(n.content, HEALTH_KEYWORDS)) ? 5 : 0;
}

export function scoreCandidate(
  candidate: FocusCandidate,
  context: CompanionContext
): number {
  // Completed goals/projects are excluded unless no other candidate exists.
  if (candidate.objectId) {
    const obj = context.objects.find((o) => o.id === candidate.objectId);
    if (obj && (obj.type === "goal" || obj.type === "project")) {
      const status = objectStatus(obj);
      if (status === "completed" || status === "done") {
        return -100;
      }
    }
  }

  const baseScore =
    scoreRecency(candidate) * 0.3 +
    scoreEmotionalWeight(candidate) * 0.2 +
    scoreGoalAlignment(candidate, context) * 0.15 +
    scoreRelationshipRecency(candidate) * 0.15 +
    scorePatternSignal(candidate, context) * 0.1 +
    scoreHealthSignal(candidate) * 0.05;

  const sourceId =
    candidate.objectId ||
    candidate.relationId ||
    candidate.memoryId ||
    candidate.placeId ||
    candidate.habitId;
  if (!sourceId) return baseScore;

  return applyPenalty(baseScore, sourceId);
}

export function rankCandidates(
  candidates: FocusCandidate[],
  context: CompanionContext
): FocusCandidate[] {
  const scored = candidates.map((c) => ({
    ...c,
    score: scoreCandidate(c, context),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// ── AI generation ────────────────────────────────────────────────────────────

async function callStructured(provider: {
  generateStructuredObject(request: AIStructuredGenerationRequest): Promise<string>;
}, prompt: string, schemaHint?: string): Promise<unknown> {
  const request: AIStructuredGenerationRequest = {
    prompt,
    schemaHint,
    objectType: "self",
  };
  const text = await provider.generateStructuredObject(request);
  return JSON.parse(text);
}

async function generateFocusWithAI(
  context: CompanionContext,
  candidate: FocusCandidate
): Promise<{
  title: string;
  explanation: string;
  whyNow: string;
  evidence: IntelligenceEvidence[];
}> {
  const selected = selectProviderForTask("TODAY_FOCUS");
  if (selected.isMock) {
    return buildMockFocusOutput(candidate, context.language);
  }

  const prompt = buildFocusPrompt(context, candidate);
  // Server calls are logged centrally by the /api/ai client proxy.
  try {
    const raw = await callStructured(
      selected.provider,
      prompt,
      JSON.stringify(focusOutputSchema.shape)
    );
    const parsed = focusOutputSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[Companion Focus] Schema parse error:", parsed.error);
      return buildMockFocusOutput(candidate, context.language);
    }
    return parsed.data;
  } catch {
    return buildMockFocusOutput(candidate, context.language);
  }
}

// ── Fallback focus ───────────────────────────────────────────────────────────

function createFallbackFocus(context: CompanionContext, today: string): TodayFocus {
  const self = context.self;
  if (self) {
    return {
      id: uuidv4(),
      date: today,
      sourceType: "self",
      objectId: self.id,
      title: tt("focus.fallbackSelfTitle", context.language),
      explanation: tt("focus.fallbackSelfExplanation", context.language),
      whyNow: tt("focus.fallbackSelfWhyNow", context.language),
      evidence: [],
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    };
  }

  return {
    id: uuidv4(),
    date: today,
    sourceType: "memory",
    title: tt("focus.fallbackMemoryTitle", context.language),
    explanation: tt("focus.fallbackMemoryExplanation", context.language),
    whyNow: tt("focus.fallbackMemoryWhyNow", context.language),
    evidence: [],
    status: "active",
    createdAt: now(),
    updatedAt: now(),
  };
}

// ── Public engine ────────────────────────────────────────────────────────────

export async function generateFocus(
  context: CompanionContext
): Promise<FocusEngineResult> {
  const candidates = buildCandidates(context);
  const ranked = rankCandidates(candidates, context);

  // Use the top candidate if it crosses a minimal threshold; otherwise fall back
  // to a gentle self / capture nudge.
  const top = ranked[0];
  if (!top || top.score < 5) {
    const fallback = createFallbackFocus(context, context.today);
    return {
      focus: fallback,
      candidate: top ?? {
        sourceType: "memory",
        title: tt("focus.fallbackMemoryTitle", context.language),
        score: 0,
        anchorNote: null,
        relatedNotes: [],
      },
    };
  }

  const aiOutput = await generateFocusWithAI(context, top);

  const focus: TodayFocus = {
    id: uuidv4(),
    date: context.today,
    sourceType: top.sourceType,
    objectId: top.objectId,
    relationId: top.relationId,
    memoryId: top.memoryId,
    placeId: top.placeId,
    habitId: top.habitId,
    title: aiOutput.title || top.title.slice(0, 15),
    explanation: aiOutput.explanation || tt("focus.defaultExplanation", context.language),
    whyNow: aiOutput.whyNow || tt("focus.defaultWhyNow", context.language),
    evidence: aiOutput.evidence,
    status: "active",
    createdAt: now(),
    updatedAt: now(),
  };

  return { focus, candidate: top };
}
