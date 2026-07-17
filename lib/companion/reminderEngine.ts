import { v4 as uuidv4 } from "uuid";
import { CompanionContext } from "./types";
import { CompanionReminder, Note } from "@/lib/types";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { AIStructuredGenerationRequest } from "@/lib/ai/types";
import { reminderOutputSchema } from "./schemas";
import {
  buildReminderPrompt,
  buildMockReminderOutput,
  ReminderCandidate,
} from "@/lib/ai/prompts/reminder";
import { applyPenalty } from "./learning";

function now(): string {
  return new Date().toISOString();
}

const HEALTH_KEYWORDS = [
  "身体", "健康", "生病", "感冒", "发烧", "医院", "医生",
  "睡眠", "睡觉", "失眠", "熬夜", "运动", "锻炼", "跑步",
  "瑜伽", "健身", "饮食", "吃饭", "胃口", "体重",
  "headache", "sleep", "insomnia", "exercise", "workout",
  "run", "gym", "health", "sick", "hospital", "doctor",
];

function containsKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

function latestNote(notes: Note[]): Note | null {
  if (notes.length === 0) return null;
  return notes.reduce((latest, n) =>
    new Date(n.created_at).getTime() > new Date(latest.created_at).getTime() ? n : latest
  );
}

function daysSince(note: Note): number {
  return (
    (Date.now() - new Date(note.created_at).getTime()) /
    (1000 * 60 * 60 * 24)
  );
}

function buildPersonCandidates(context: CompanionContext): ReminderCandidate[] {
  const todayMonthDay = context.today.slice(5); // "MM-DD"

  return context.objects
    .filter((o) => o.type === "person")
    .map((obj) => {
      const relatedNotes = context.notes
        .filter((n) => n.object_id === obj.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const birthday = String(obj.properties?.birthday ?? "").slice(5);
      const anniversary = String(obj.properties?.anniversary ?? "").slice(5);
      const isBirthdayToday = birthday === todayMonthDay;
      const isAnniversaryToday = anniversary === todayMonthDay;

      return {
        sourceType: "person" as const,
        objectId: obj.id,
        title: isBirthdayToday
          ? `${obj.name}的生日`
          : isAnniversaryToday
          ? `${obj.name}的纪念日`
          : obj.name,
        anchorNote: latestNote(relatedNotes),
        relatedNotes,
        isSpecialDate: isBirthdayToday || isAnniversaryToday,
      };
    })
    .filter((c) => c.anchorNote && (daysSince(c.anchorNote) >= 14 || c.isSpecialDate));
}

function buildRelationshipCandidates(context: CompanionContext): ReminderCandidate[] {
  return context.relations.map((relation) => {
    const relatedNotes = context.notes.filter(
      (n) =>
        n.object_id === relation.source_object_id ||
        n.object_id === relation.target_object_id
    );
    const source = context.objects.find((o) => o.id === relation.source_object_id);
    const target = context.objects.find((o) => o.id === relation.target_object_id);
    return {
      sourceType: "relationship" as const,
      relationId: relation.id,
      title: [source?.name, target?.name].filter(Boolean).join(" 与 ") || "一段关系",
      anchorNote: latestNote(relatedNotes),
      relatedNotes,
    };
  });
}

function buildGoalProjectCandidates(context: CompanionContext): ReminderCandidate[] {
  return context.objects
    .filter((o) => o.type === "goal" || o.type === "project")
    .map((obj) => {
      const relatedNotes = context.notes
        .filter((n) => n.object_id === obj.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return {
        sourceType: obj.type as "goal" | "project",
        objectId: obj.id,
        title: obj.name,
        anchorNote: latestNote(relatedNotes),
        relatedNotes,
      };
    })
    .filter((c) => {
      if (!c.anchorNote) return false;
      const days = daysSince(c.anchorNote);
      // "Had momentum then went quiet": latest note 8-30 days ago.
      return days >= 8 && days <= 30;
    });
}

function buildHealthCandidates(context: CompanionContext): ReminderCandidate[] {
  const recent = context.notes.filter((n) => {
    const days = (Date.now() - new Date(n.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 14 && containsKeyword(n.content, HEALTH_KEYWORDS);
  });
  if (recent.length === 0) return [];

  const self = context.objects.find((o) => o.type === "self");
  return [
    {
      sourceType: "health" as const,
      objectId: self?.id,
      title: "健康",
      anchorNote: latestNote(recent),
      relatedNotes: recent,
    },
  ];
}

function buildMemoryCandidates(): ReminderCandidate[] {
  // Anniversary / date-related memories are handled in P1/P2.
  return [];
}

function buildCandidates(context: CompanionContext): ReminderCandidate[] {
  return [
    ...buildPersonCandidates(context),
    ...buildRelationshipCandidates(context),
    ...buildGoalProjectCandidates(context),
    ...buildHealthCandidates(context),
    ...buildMemoryCandidates(),
  ];
}

function scoreCandidate(candidate: ReminderCandidate): number {
  let score = 0;
  const latest = candidate.anchorNote;
  if (!latest) return 0;

  const days = daysSince(latest);

  if (candidate.isSpecialDate) {
    score += 80;
  }

  if (candidate.sourceType === "person" || candidate.sourceType === "relationship") {
    if (days >= 60) score += 50;
    else if (days >= 30) score += 35;
    else if (days >= 14) score += 25;
  }

  if (candidate.sourceType === "goal" || candidate.sourceType === "project") {
    if (days <= 14) score += 20;
    else if (days <= 30) score += 30;
  }

  if (candidate.sourceType === "health") {
    score += 40;
  }

  // Emotional weight bump.
  const hasEmotion = candidate.relatedNotes.some(
    (n) =>
      containsKeyword(n.content, ["担心", "焦虑", "难过", "不舒服", "疼", "痛"]) ||
      containsKeyword(n.content, ["worried", "anxious", "sad", "unwell", "pain"])
  );
  if (hasEmotion) score += 15;

  const sourceId =
    candidate.objectId || candidate.relationId || candidate.memoryId;
  if (!sourceId) return score;

  return applyPenalty(score, sourceId);
}

function rankCandidates(candidates: ReminderCandidate[]): ReminderCandidate[] {
  const scored = candidates.map((c) => ({ candidate: c, score: scoreCandidate(c) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.candidate);
}

async function callStructured(
  provider: {
    generateStructuredObject(request: AIStructuredGenerationRequest): Promise<string>;
  },
  prompt: string,
  schemaHint?: string
): Promise<unknown> {
  const request: AIStructuredGenerationRequest = {
    prompt,
    schemaHint,
    objectType: "self",
  };
  const text = await provider.generateStructuredObject(request);
  return JSON.parse(text);
}

export async function generateReminder(
  context: CompanionContext
): Promise<CompanionReminder | null> {
  const candidates = buildCandidates(context);
  const ranked = rankCandidates(candidates);
  const top = ranked[0];

  if (!top || scoreCandidate(top) < 20) return null;

  const selected = selectProviderForTask("REMINDER");
  let output: {
    title: string;
    whyNow: string;
    actionLabel: string;
    evidence: { quote: string; source: string }[];
  };

  if (selected.isMock) {
    output = buildMockReminderOutput(top);
  } else {
    const prompt = buildReminderPrompt(context, top);
    // Server calls are logged centrally by the /api/ai client proxy.
    try {
      const raw = await callStructured(
        selected.provider,
        prompt,
        JSON.stringify(reminderOutputSchema.shape)
      );
      const parsed = reminderOutputSchema.safeParse(raw);
      if (!parsed.success) {
        console.error("[Companion Reminder] Schema parse error:", parsed.error);
        output = buildMockReminderOutput(top);
      } else {
        output = parsed.data;
      }
    } catch {
      output = buildMockReminderOutput(top);
    }
  }

  return {
    id: uuidv4(),
    date: context.today,
    triggerSource: top.sourceType,
    objectId: top.objectId,
    relationId: top.relationId,
    memoryId: top.memoryId,
    title: output.title || top.title.slice(0, 15),
    whyNow: output.whyNow || "这个主题最近出现在你的记录里。",
    actionLabel: output.actionLabel || "记录",
    status: "pending",
    evidence: output.evidence,
    createdAt: now(),
  };
}
