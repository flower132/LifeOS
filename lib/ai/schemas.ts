import { z } from "zod";

export const SelfInsightSchema = z.object({
  focus_areas: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  summary: z.string().default(""),
});

export const PersonInsightSchema = z.object({
  traits: z.array(z.string()).default([]),
  relationship_status: z.string().default(""),
  notes: z.string().default(""),
});

export const EventGoalInsightSchema = z.object({
  summary: z.string().default(""),
  progress_insight: z.string().default(""),
  blockers: z.array(z.string()).default([]),
});

export type SelfInsight = z.infer<typeof SelfInsightSchema>;
export type PersonInsight = z.infer<typeof PersonInsightSchema>;
export type EventGoalInsight = z.infer<typeof EventGoalInsightSchema>;
