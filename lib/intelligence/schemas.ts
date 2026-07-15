import { z } from "zod";

export const intelligenceEvidenceSchema = z.object({
  quote: z.string(),
  source: z.string(),
});

export const patternOutputSchema = z.object({
  patterns: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(["emotion", "behavior", "relationship", "decision", "goal", "health", "work"]),
      firstSeenAt: z.string(),
      lastSeenAt: z.string(),
      frequency: z.enum(["recurring", "spike", "declining", "stable"]),
      confidence: z.number().min(0).max(1),
      evidence: z.array(intelligenceEvidenceSchema),
      noteIds: z.array(z.string()).default([]),
    })
  ),
});

export const todayStoryOutputSchema = z.object({
  story: z.string(),
  evidence: z.array(intelligenceEvidenceSchema),
});

export const relatedMemoriesOutputSchema = z.object({
  relatedMemories: z.array(
    z.object({
      noteId: z.string(),
      reason: z.string(),
      evidence: z.array(intelligenceEvidenceSchema),
    })
  ),
});

export type PatternOutput = z.infer<typeof patternOutputSchema>;
export type TodayStoryOutput = z.infer<typeof todayStoryOutputSchema>;
export type RelatedMemoriesOutput = z.infer<typeof relatedMemoriesOutputSchema>;
