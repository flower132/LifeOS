import { v4 as uuidv4 } from "uuid";
import { CompanionFeedback } from "@/lib/types";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";

const PENALTY_INCREMENTS: Record<CompanionFeedback["action"], number> = {
  done: -0.15,
  later: 0.05,
  skip: 0.25,
  ignore: 0.1,
  dismiss: 0.2,
};

const MAX_PENALTY = 0.6;
const DECAY_PER_DAY = 0.05;

function now(): string {
  return new Date().toISOString();
}

export function getSourceIdFromFeedback(feedback: CompanionFeedback): string | null {
  // Feedback itemId is the reminder/focus id. For penalty purposes we need the
  // underlying source (object/relation/note id). The engine caller is responsible
  // for storing that in the reason or we fall back to itemId.
  if (feedback.reason) {
    const match = feedback.reason.match(/sourceId:([^\s]+)/);
    if (match) return match[1];
  }
  return feedback.itemId;
}

export function recordFeedback(
  feedback: Omit<CompanionFeedback, "id" | "createdAt">
): void {
  const store = useIntelligenceStore.getState();
  const entry: CompanionFeedback = {
    ...feedback,
    id: uuidv4(),
    createdAt: now(),
  };
  void store.addFeedback(entry);

  const settings = useSettingsStore.getState();
  const threshold = settings.quietMode?.consecutiveRejectionThreshold ?? 3;
  const meta = store.companionMeta;

  let consecutiveRejections = meta.consecutiveRejections;
  if (feedback.action === "done") {
    consecutiveRejections = 0;
  } else if (["later", "skip", "ignore", "dismiss"].includes(feedback.action)) {
    consecutiveRejections = Math.min(consecutiveRejections + 1, Math.max(threshold * 2, 5));
  }

  if (consecutiveRejections !== meta.consecutiveRejections) {
    void store.setCompanionMeta({ ...meta, consecutiveRejections });
  }
}

export function computePenalty(sourceId: string): number {
  const feedback = useIntelligenceStore.getState().cache.feedback;
  let penalty = 0;

  for (const item of feedback) {
    const itemSourceId = getSourceIdFromFeedback(item);
    if (itemSourceId !== sourceId) continue;

    const daysAgo =
      (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const decay = Math.floor(daysAgo / 7) * DECAY_PER_DAY;
    penalty += Math.max(0, (PENALTY_INCREMENTS[item.action] ?? 0) - decay);
  }

  return Math.max(0, Math.min(MAX_PENALTY, penalty));
}

export function applyPenalty(score: number, sourceId: string): number {
  const penalty = computePenalty(sourceId);
  return score * (1 - penalty);
}
