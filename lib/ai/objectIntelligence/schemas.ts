import { z } from "zod";
import {
  Evidence,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  AIAnalysisHistoryEntry,
} from "@/lib/types";

export const EvidenceSchema: z.ZodType<Evidence> = z.object({
  quote: z.string().default(""),
  source: z.string().default(""),
});

export const ObjectAIInsightSchema: z.ZodType<ObjectAIInsight> = z.object({
  id: z.string(),
  category: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  confidence: z.number().min(0).max(100).default(0),
  evidence: z.array(EvidenceSchema).default([]),
  createdAt: z.string().default(""),
});

export const ObjectAISuggestionSchema: z.ZodType<ObjectAISuggestion> =
  z.object({
    id: z.string(),
    title: z.string().default(""),
    description: z.string().default(""),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    generatedAt: z.string().default(""),
  });

export const ObjectMemorySchema: z.ZodType<ObjectMemory> = z.object({
  id: z.string(),
  content: z.string().default(""),
  source: z.enum(["user", "ai", "import", "note"]).default("ai"),
  createdAt: z.string().default(""),
});

export const AIAnalysisHistoryEntrySchema: z.ZodType<AIAnalysisHistoryEntry> =
  z.object({
    id: z.string(),
    objectType: z.enum([
      "person",
      "self",
      "event",
      "idea",
      "goal",
      "project",
      "knowledge",
    ]),
    objectId: z.string().optional(),
    createdAt: z.string().default(""),
    rawTextInput: z.string().default(""),
    imageCount: z.number().default(0),
    imageThumbnails: z.array(z.string()).default([]),
    provider: z.string().default(""),
    model: z.string().default(""),
    durationMs: z.number().default(0),
    rawOutput: z.string().default(""),
    profileSnapshot: z.any().optional(),
    insightsSnapshot: z.array(ObjectAIInsightSchema).optional(),
    suggestionsSnapshot: z.array(ObjectAISuggestionSchema).optional(),
    memoriesSnapshot: z.array(ObjectMemorySchema).optional(),
  });

export type AISuggestionPriorityInput = z.infer<
  typeof ObjectAISuggestionSchema
>["priority"];
export type MemorySourceInput = z.infer<typeof ObjectMemorySchema>["source"];
