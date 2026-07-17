import { z } from "zod";
import { useTranslation } from "@/lib/useTranslation";
import {
  IdeaAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { AIProfileDefinition } from "../types";
import { LabelValueCard } from "@/components/ui/LabelValueCard";
import { Badge } from "@/components/ui/Badge";
import { buildIdeaPrompt } from "@/lib/ai/prompts/objectAnalysis/idea";

const IdeaAIProfileSchema: z.ZodType<IdeaAIProfile> = z.object({
  type: z.literal("idea"),
  novelty: z.number().min(0).max(100).default(50),
  feasibility: z.number().min(0).max(100).default(50),
  marketPotential: z.number().min(0).max(100).default(50),
  relatedDomains: z.array(z.string()).default([]),
});

const IdeaAIOutputSchema = z.object({
  basic_profile: z
    .object({
      name: z.string().default(""),
      domain: z.string().default(""),
    })
    .default(() => ({ name: "", domain: "" })),
  profile: IdeaAIProfileSchema.default({
    type: "idea",
    novelty: 50,
    feasibility: 50,
    marketPotential: 50,
    relatedDomains: [],
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

function mapIdeaProfile(raw: unknown): IdeaAIProfile | null {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapIdeaProperties(raw: unknown): ObjectProperties {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.domain) props.domain = basic.domain;
  return props;
}

function mapIdeaInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
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

function mapIdeaSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
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

function mapIdeaMemories(raw: unknown): ObjectMemory[] {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai" as const,
    createdAt: now,
  }));
}

function IdeaAIProfileEditor({
  profile,
  onChange,
}: {
  profile: IdeaAIProfile;
  onChange: (profile: IdeaAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateDomains = (value: string) => {
    onChange({
      ...profile,
      relatedDomains: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t("aiIdeaNovelty")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.novelty}
            onChange={(e) => onChange({ ...profile, novelty: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("aiIdeaFeasibility")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.feasibility}
            onChange={(e) => onChange({ ...profile, feasibility: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("aiIdeaMarketPotential")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.marketPotential}
            onChange={(e) => onChange({ ...profile, marketPotential: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>
      <Field label={t("aiIdeaRelatedDomains")}>
        <input
          type="text"
          value={profile.relatedDomains.join(", ")}
          onChange={(e) => updateDomains(e.target.value)}
          placeholder={t("aiIdeaRelatedDomainsPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
    </div>
  );
}

function IdeaAIProfileReader({ profile }: { profile: IdeaAIProfile }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LabelValueCard label={t("aiIdeaNovelty")}>{profile.novelty}%</LabelValueCard>
        <LabelValueCard label={t("aiIdeaFeasibility")}>{profile.feasibility}%</LabelValueCard>
        <LabelValueCard label={t("aiIdeaMarketPotential")}>{profile.marketPotential}%</LabelValueCard>
      </div>

      <LabelValueCard label={t("aiIdeaRelatedDomains")}>
        {profile.relatedDomains.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {profile.relatedDomains.map((domain, i) => (
              <li key={i}>
                <Badge variant="accent">{domain}</Badge>
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

export const ideaProfileDefinition: AIProfileDefinition<IdeaAIProfile> = {
  type: "idea",
  name: "Idea",
  description: "AI profile, insights, suggestions and memories for an idea.",
  profileSchema: IdeaAIProfileSchema,
  buildPrompt: buildIdeaPrompt,
  mapProfile: mapIdeaProfile,
  mapProperties: mapIdeaProperties,
  mapInsights: mapIdeaInsights,
  mapSuggestions: mapIdeaSuggestions,
  mapMemories: mapIdeaMemories,
  ProfileRenderer: IdeaAIProfileEditor,
  ProfileReader: IdeaAIProfileReader,
};
