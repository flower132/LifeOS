import { z } from "zod";
import { intelligenceEvidenceSchema } from "@/lib/intelligence/schemas";

export const focusOutputSchema = z.object({
  title: z.string().max(15),
  explanation: z.string().max(50),
  whyNow: z.string().max(80),
  evidence: z.array(
    z.object({
      quote: z.string(),
      source: z.string(),
    })
  ),
});

export const reflectionOutputSchema = z.object({
  question: z.string().max(40),
  seedSource: z.enum(["memory", "goal", "project", "relationship", "self"]),
  seedId: z.string(),
  evidence: z.array(
    z.object({
      quote: z.string(),
      source: z.string(),
    })
  ),
});

export type FocusOutput = z.infer<typeof focusOutputSchema>;
export type ReflectionOutput = z.infer<typeof reflectionOutputSchema>;

export const reminderOutputSchema = z.object({
  title: z.string().max(15),
  whyNow: z.string().max(80),
  actionLabel: z.string().max(10).default("记录"),
  evidence: z.array(
    z.object({
      quote: z.string(),
      source: z.string(),
    })
  ),
});

export type ReminderOutput = z.infer<typeof reminderOutputSchema>;

export const timelineOutputSchema = z.object({
  summary: z.string().max(150),
  evidence: z.array(
    z.object({
      quote: z.string(),
      source: z.string(),
    })
  ),
});

export const weeklyReviewOutputSchema = z.object({
  mostImportantPerson: z
    .object({
      name: z.string(),
      objectId: z.string().optional(),
      reason: z.string(),
      evidence: z.array(intelligenceEvidenceSchema),
    })
    .optional(),
  mostImportantGoal: z
    .object({
      name: z.string(),
      objectId: z.string().optional(),
      reason: z.string(),
      evidence: z.array(intelligenceEvidenceSchema),
    })
    .optional(),
  growth: z
    .object({
      statement: z.string(),
      evidence: z.array(intelligenceEvidenceSchema),
    })
    .optional(),
  emotion: z
    .object({
      statement: z.string(),
      evidence: z.array(intelligenceEvidenceSchema),
    })
    .optional(),
  gratitude: z
    .object({
      statement: z.string(),
      evidence: z.array(intelligenceEvidenceSchema),
    })
    .optional(),
});

export const monthlyStoryOutputSchema = z.object({
  story: z.string().min(100).max(1500),
  evidence: z.array(intelligenceEvidenceSchema),
});

export type TimelineOutput = z.infer<typeof timelineOutputSchema>;
export type WeeklyReviewOutput = z.infer<typeof weeklyReviewOutputSchema>;
export type MonthlyStoryOutput = z.infer<typeof monthlyStoryOutputSchema>;
