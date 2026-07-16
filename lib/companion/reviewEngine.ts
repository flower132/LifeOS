import { v4 as uuidv4 } from "uuid";
import { CompanionContext } from "./types";
import {
  DailyTimeline,
  WeeklyReview,
  MonthlyStory,
} from "@/lib/types";
import {
  timelineOutputSchema,
  weeklyReviewOutputSchema,
  monthlyStoryOutputSchema,
  TimelineOutput,
  WeeklyReviewOutput,
  MonthlyStoryOutput,
} from "./schemas";
import {
  buildDailyTimelinePrompt,
  buildWeeklyReviewPrompt,
  buildMonthlyStoryPrompt,
  buildMockDailyTimelineOutput,
  buildMockWeeklyReviewOutput,
  buildMockMonthlyStoryOutput,
} from "./prompts/reviewPrompt";
import { selectProviderForAnalysis } from "@/lib/ai/objectIntelligence/fallback";
import { AIStructuredGenerationRequest } from "@/lib/ai/types";
import { addAILog } from "@/lib/ai/logs";
import { getISOWeekBounds, getMonthBounds } from "./utils/date";

function now(): string {
  return new Date().toISOString();
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

function mapTimelineOutput(
  rawOutput: unknown,
  date: string
): DailyTimeline | null {
  const parsed = timelineOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.error("[Companion Review] Daily timeline parse error:", parsed.error);
    return null;
  }
  const summary = parsed.data.summary?.trim();
  if (!summary) return null;
  return {
    date,
    summary,
    evidence: parsed.data.evidence,
    createdAt: now(),
    updatedAt: now(),
  };
}

function mapWeeklyReviewOutput(
  rawOutput: unknown,
  weekKey: string,
  periodFrom: string,
  periodTo: string
): WeeklyReview | null {
  const parsed = weeklyReviewOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.error("[Companion Review] Weekly review parse error:", parsed.error);
    return null;
  }
  const data = parsed.data;
  const hasContent =
    data.mostImportantPerson ||
    data.mostImportantGoal ||
    data.growth ||
    data.emotion ||
    data.gratitude;
  if (!hasContent) return null;

  return {
    id: uuidv4(),
    weekKey,
    periodFrom,
    periodTo,
    mostImportantPerson: data.mostImportantPerson,
    mostImportantGoal: data.mostImportantGoal,
    growth: data.growth,
    emotion: data.emotion,
    gratitude: data.gratitude,
    status: "active",
    createdAt: now(),
  };
}

function mapMonthlyStoryOutput(
  rawOutput: unknown,
  monthKey: string,
  periodFrom: string,
  periodTo: string
): MonthlyStory | null {
  const parsed = monthlyStoryOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.error("[Companion Review] Monthly story parse error:", parsed.error);
    return null;
  }
  const story = parsed.data.story?.trim();
  if (!story) return null;
  return {
    id: uuidv4(),
    monthKey,
    periodFrom,
    periodTo,
    story,
    evidence: parsed.data.evidence,
    status: "active",
    createdAt: now(),
  };
}

export async function generateDailyTimeline(
  context: CompanionContext,
  date: string
): Promise<DailyTimeline | null> {
  const notes = context.notes.filter((n) => n.created_at.startsWith(date));
  if (notes.length === 0) return null;

  const selected = selectProviderForAnalysis();
  let output: TimelineOutput;

  if (selected.isMock) {
    output = buildMockDailyTimelineOutput(notes);
  } else {
    const prompt = buildDailyTimelinePrompt(context, date);
    const start = performance.now();
    try {
      const raw = await callStructured(
        selected.provider,
        prompt,
        JSON.stringify(timelineOutputSchema.shape)
      );
      const parsed = timelineOutputSchema.safeParse(raw);
      if (!parsed.success) {
        console.error("[Companion Review] Daily timeline parse error:", parsed.error);
        output = buildMockDailyTimelineOutput(notes);
      } else {
        output = parsed.data;
      }
      addAILog({
        provider: selected.providerId,
        model: selected.model,
        durationMs: Math.round(performance.now() - start),
        status: "success",
      });
    } catch (err) {
      addAILog({
        provider: selected.providerId,
        model: selected.model,
        durationMs: Math.round(performance.now() - start),
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
      output = buildMockDailyTimelineOutput(notes);
    }
  }

  return mapTimelineOutput(output, date);
}

export async function generateWeeklyReview(
  context: CompanionContext,
  weekKey: string
): Promise<WeeklyReview | null> {
  const bounds = getISOWeekBounds(weekKey);
  if (!bounds) return null;

  const notes = context.notes.filter(
    (n) => n.created_at >= bounds.from && n.created_at <= bounds.to
  );
  if (notes.length < 3) return null;

  const selected = selectProviderForAnalysis();
  let output: WeeklyReviewOutput;

  if (selected.isMock) {
    output = buildMockWeeklyReviewOutput(notes);
  } else {
    const prompt = buildWeeklyReviewPrompt(context, weekKey);
    const start = performance.now();
    try {
      const raw = await callStructured(
        selected.provider,
        prompt,
        JSON.stringify(weeklyReviewOutputSchema.shape)
      );
      const parsed = weeklyReviewOutputSchema.safeParse(raw);
      if (!parsed.success) {
        console.error("[Companion Review] Weekly review parse error:", parsed.error);
        output = buildMockWeeklyReviewOutput(notes);
      } else {
        output = parsed.data;
      }
      addAILog({
        provider: selected.providerId,
        model: selected.model,
        durationMs: Math.round(performance.now() - start),
        status: "success",
      });
    } catch (err) {
      addAILog({
        provider: selected.providerId,
        model: selected.model,
        durationMs: Math.round(performance.now() - start),
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
      output = buildMockWeeklyReviewOutput(notes);
    }
  }

  return mapWeeklyReviewOutput(output, weekKey, bounds.from, bounds.to);
}

export async function generateMonthlyStory(
  context: CompanionContext,
  monthKey: string
): Promise<MonthlyStory | null> {
  const bounds = getMonthBounds(monthKey);
  if (!bounds) return null;

  const notes = context.notes.filter(
    (n) => n.created_at >= bounds.from && n.created_at <= bounds.to
  );
  if (notes.length < 5) return null;

  const selected = selectProviderForAnalysis();
  let output: MonthlyStoryOutput;

  if (selected.isMock) {
    output = buildMockMonthlyStoryOutput(notes);
  } else {
    const prompt = buildMonthlyStoryPrompt(context, monthKey);
    const start = performance.now();
    try {
      const raw = await callStructured(
        selected.provider,
        prompt,
        JSON.stringify(monthlyStoryOutputSchema.shape)
      );
      const parsed = monthlyStoryOutputSchema.safeParse(raw);
      if (!parsed.success) {
        console.error("[Companion Review] Monthly story parse error:", parsed.error);
        output = buildMockMonthlyStoryOutput(notes);
      } else {
        output = parsed.data;
      }
      addAILog({
        provider: selected.providerId,
        model: selected.model,
        durationMs: Math.round(performance.now() - start),
        status: "success",
      });
    } catch (err) {
      addAILog({
        provider: selected.providerId,
        model: selected.model,
        durationMs: Math.round(performance.now() - start),
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
      output = buildMockMonthlyStoryOutput(notes);
    }
  }

  return mapMonthlyStoryOutput(output, monthKey, bounds.from, bounds.to);
}
