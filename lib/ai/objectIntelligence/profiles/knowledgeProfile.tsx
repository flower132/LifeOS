import { z } from "zod";
import { useTranslation } from "@/lib/useTranslation";
import {
  KnowledgeAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { AIProfileDefinition } from "../types";
import { LabelValueCard } from "@/components/ui/LabelValueCard";
import { Badge } from "@/components/ui/Badge";
import { buildKnowledgePrompt } from "@/lib/ai/prompts/objectAnalysis/knowledge";

const KnowledgeAIProfileSchema: z.ZodType<KnowledgeAIProfile> = z.object({
  type: z.literal("knowledge"),
  difficulty: z.number().min(0).max(100).default(50),
  relatedTopics: z.array(z.string()).default([]),
  knowledgeGraph: z
    .array(
      z.object({
        node: z.string(),
        relation: z.string(),
        target: z.string(),
      })
    )
    .default([]),
});

const KnowledgeAIOutputSchema = z.object({
  basic_profile: z
    .object({
      name: z.string().default(""),
      topic: z.string().default(""),
    })
    .default(() => ({ name: "", topic: "" })),
  profile: KnowledgeAIProfileSchema.default({
    type: "knowledge",
    difficulty: 50,
    relatedTopics: [],
    knowledgeGraph: [],
  }),
  insights: z
    .array(
      z.object({
        category: z.string(),
        title: z.string(),
        description: z.string(),
        confidence: z.number().min(0).max(100),
        evidence: z.array(z.object({ quote: z.string(), source: z.string() })).default([]),
      })
    )
    .default([]),
  suggestions: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      })
    )
    .default([]),
  memories: z.array(z.object({ content: z.string() })).default([]),
  confidence_score: z.number().min(0).max(1).default(0),
  analysis_summary: z.string().default(""),
});

function mapKnowledgeProfile(raw: unknown): KnowledgeAIProfile | null {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapKnowledgeProperties(raw: unknown): ObjectProperties {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.topic) props.topic = basic.topic;
  return props;
}

function mapKnowledgeInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.insights.map((item, index) => ({
    id: `insight-${now}-${index}`,
    category: item.category,
    title: item.title,
    description: item.description,
    confidence: item.confidence,
    evidence: item.evidence,
    createdAt: now,
  }));
}

function mapKnowledgeSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.suggestions.map((item, index) => ({
    id: `suggestion-${now}-${index}`,
    title: item.title,
    description: item.description,
    priority: item.priority,
    status: "active" as const,
    generatedAt: now,
  }));
}

function mapKnowledgeMemories(raw: unknown): ObjectMemory[] {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai" as const,
    createdAt: now,
  }));
}

function KnowledgeAIProfileEditor({
  profile,
  onChange,
}: {
  profile: KnowledgeAIProfile;
  onChange: (profile: KnowledgeAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateTopics = (value: string) => {
    onChange({
      ...profile,
      relatedTopics: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  const updateGraph = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        onChange({ ...profile, knowledgeGraph: parsed });
      }
    } catch {
      // Ignore invalid JSON while user is typing.
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <Field label={t("aiKnowledgeDifficulty")}>
        <input
          type="number"
          min={0}
          max={100}
          value={profile.difficulty}
          onChange={(e) => onChange({ ...profile, difficulty: Number(e.target.value) })}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("aiKnowledgeRelatedTopics")}>
        <input
          type="text"
          value={profile.relatedTopics.join(", ")}
          onChange={(e) => updateTopics(e.target.value)}
          placeholder={t("aiKnowledgeRelatedTopicsPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("aiKnowledgeGraph")}>
        <textarea
          value={JSON.stringify(profile.knowledgeGraph, null, 2)}
          onChange={(e) => updateGraph(e.target.value)}
          rows={5}
          placeholder={t("aiKnowledgeGraphPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
    </div>
  );
}

function KnowledgeAIProfileReader({ profile }: { profile: KnowledgeAIProfile }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <LabelValueCard label={t("aiKnowledgeDifficulty")}>{profile.difficulty}%</LabelValueCard>

      <LabelValueCard label={t("aiKnowledgeRelatedTopics")}>
        {profile.relatedTopics.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {profile.relatedTopics.map((topic, i) => (
              <li key={i}>
                <Badge variant="accent">{topic}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          t("aiNotAvailable")
        )}
      </LabelValueCard>

      <LabelValueCard label={t("aiKnowledgeGraph")}>
        {profile.knowledgeGraph.length > 0 ? (
          <ul className="space-y-2">
            {profile.knowledgeGraph.map((edge, i) => (
              <li key={i} className="rounded-lg border border-border bg-card p-3 text-sm">
                <span className="font-medium text-foreground">{edge.node}</span>{" "}
                <span className="text-muted-foreground">— {edge.relation} →</span>{" "}
                <span className="font-medium text-foreground">{edge.target}</span>
              </li>
            ))}
          </ul>
        ) : (
          t("aiNotAvailable")
        )}
      </LabelValueCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export const knowledgeProfileDefinition: AIProfileDefinition<KnowledgeAIProfile> = {
  type: "knowledge",
  name: "Knowledge",
  description: "AI profile, insights, suggestions and memories for knowledge.",
  profileSchema: KnowledgeAIProfileSchema,
  buildPrompt: buildKnowledgePrompt,
  mapProfile: mapKnowledgeProfile,
  mapProperties: mapKnowledgeProperties,
  mapInsights: mapKnowledgeInsights,
  mapSuggestions: mapKnowledgeSuggestions,
  mapMemories: mapKnowledgeMemories,
  ProfileRenderer: KnowledgeAIProfileEditor,
  ProfileReader: KnowledgeAIProfileReader,
};
