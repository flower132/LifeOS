import { z } from "zod";
import { Language } from "@/lib/i18n";
import { AIImageInput } from "@/lib/ai/types";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { buildMemoryExtractPrompt } from "@/lib/ai/prompts/memoryExtract";
import { MemoryType } from "./types";

// ---------------------------------------------------------------------------
// Extractor — AI knowledge extraction from raw input. Always goes through
// the AI Router (postAI → /api/ai → router → provider), never directly to a
// provider. Privacy/mock mode degrades to a local rule-based extraction with
// zero network calls.
// ---------------------------------------------------------------------------

const extractionSchema = z.object({
  type: z
    .enum(["event", "note", "conversation", "reflection", "decision", "experience"])
    .default("note"),
  summary: z.string().default(""),
  entities: z
    .object({
      people: z.array(z.string()).default([]),
      projects: z.array(z.string()).default([]),
      goals: z.array(z.string()).default([]),
      places: z.array(z.string()).default([]),
    })
    .default({ people: [], projects: [], goals: [], places: [] }),
  topics: z.array(z.string()).default([]),
  emotions: z.array(z.string()).default([]),
  insights: z.array(z.string()).default([]),
  relations: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        type: z
          .enum(["family", "friend", "colleague", "mentor", "partner", "custom"])
          .default("custom"),
        label: z.string().optional(),
        confidence: z.number().min(0).max(1).default(0.6),
      })
    )
    .default([]),
  importance: z.number().min(0).max(1).default(0.3),
});

export interface MemoryExtraction {
  type: MemoryType;
  summary: string;
  entities: {
    people: string[];
    projects: string[];
    goals: string[];
    places: string[];
  };
  topics: string[];
  emotions: string[];
  insights: string[];
  /** AI-extracted relation candidates (Knowledge Graph edges). */
  relations: {
    from: string;
    to: string;
    type: "family" | "friend" | "colleague" | "mentor" | "partner" | "custom";
    label?: string;
    confidence: number;
  }[];
  /** AI-estimated importance 0..1 (feeds importance.ts). */
  aiImportance: number;
}

export interface ExtractInput {
  text: string;
  images?: AIImageInput[];
  language: Language;
  /** Known object names, so the model reuses canonical names for linking. */
  knownEntities: {
    people: string[];
    projects: string[];
    goals: string[];
  };
}

/**
 * Extract structured knowledge from raw input.
 * Falls back to local rules when AI is disabled / privacy mode / failure.
 */
export async function extractMemoryKnowledge(
  input: ExtractInput
): Promise<MemoryExtraction> {
  const selected = selectProviderForTask("MEMORY_EXTRACT");

  if (!selected.isMock && input.text.trim().length > 0) {
    try {
      const prompt = buildMemoryExtractPrompt({
        text: input.text,
        imageCount: input.images?.length ?? 0,
        knownPeople: input.knownEntities.people,
        knownProjects: input.knownEntities.projects,
        knownGoals: input.knownEntities.goals,
        language: input.language,
      });

      const { content } = await postAI({
        task: "MEMORY_EXTRACT",
        prompt,
        images: input.images,
        options: {
          schemaHint:
            '{"type":"string","summary":"string","entities":{"people":[],"projects":[],"goals":[],"places":[]},"topics":[],"emotions":[],"insights":[],"importance":0.5}',
        },
      });

      const parsed = extractionSchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        return {
          type: parsed.data.type,
          summary: parsed.data.summary,
          entities: parsed.data.entities,
          topics: parsed.data.topics,
          emotions: parsed.data.emotions,
          insights: parsed.data.insights,
          relations: parsed.data.relations.map((r) => ({
            from: r.from,
            to: r.to,
            type: r.type,
            label: r.label,
            confidence: r.confidence,
          })),
          aiImportance: parsed.data.importance,
        };
      }
      console.warn("[memory] Extraction schema mismatch, using fallback:", parsed.error);
    } catch (err) {
      // Vision NotSupported and transient failures land here — degrade
      // gracefully to local extraction (never break note saving).
      console.warn("[memory] AI extraction failed, using local fallback:", err);
    }
  }

  return localExtraction(input);
}

/**
 * Local rule-based extraction — used in mock/privacy mode and as failure
 * fallback. Matches known object names in the text; no network.
 */
function localExtraction(input: ExtractInput): MemoryExtraction {
  const text = input.text;
  const matchKnown = (names: string[]) =>
    names.filter((name) => name.length >= 2 && text.includes(name));

  const people = matchKnown(input.knownEntities.people);
  const projects = matchKnown(input.knownEntities.projects);
  const goals = matchKnown(input.knownEntities.goals);

  return {
    type: "note",
    summary: text.slice(0, 40),
    entities: { people, projects, goals, places: [] },
    topics: [],
    emotions: [],
    insights: [],
    relations: [],
    aiImportance: people.length + projects.length + goals.length > 0 ? 0.5 : 0.3,
  };
}
