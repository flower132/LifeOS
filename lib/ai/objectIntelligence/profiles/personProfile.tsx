import { z } from "zod";
import { useTranslation } from "@/lib/useTranslation";
import {
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
  PersonAIProfile,
} from "@/lib/types";
import { AIProfileDefinition } from "../types";
import { Card } from "@/components/ui/Card";
import { LabelValueCard } from "@/components/ui/LabelValueCard";
import { buildPersonPrompt } from "@/lib/ai/prompts/objectAnalysis/person";

const PersonAIProfileSchema: z.ZodType<PersonAIProfile> = z.object({
  type: z.literal("person"),
  relationshipContext: z.string().default(""),
  mbti: z.string().default(""),
  mbtiConfidence: z.number().min(0).max(100).default(0),
  bigFive: z.object({
    openness: z.number().min(0).max(100).default(0),
    conscientiousness: z.number().min(0).max(100).default(0),
    extraversion: z.number().min(0).max(100).default(0),
    agreeableness: z.number().min(0).max(100).default(0),
    emotionalStability: z.number().min(0).max(100).default(0),
  }),
  personalitySummary: z.string().default(""),
  rollingSummary: z.string().default(""),
});

const PersonAIOutputSchema = z.object({
  basic_profile: z.object({
    name: z.string().default(""),
    nickname: z.string().default(""),
    age: z.string().default(""),
    occupation: z.string().default(""),
    city: z.string().default(""),
  }).default(() => ({ name: "", nickname: "", age: "", occupation: "", city: "" })),
  profile: PersonAIProfileSchema.default({
    type: "person",
    relationshipContext: "",
    mbti: "",
    mbtiConfidence: 0,
    bigFive: {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      emotionalStability: 0,
    },
    personalitySummary: "",
    rollingSummary: "",
  }),
  insights: z.array(z.object({
    category: z.string(),
    title: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.object({ quote: z.string(), source: z.string() })).default([]),
  })).default([]),
  suggestions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  })).default([]),
  memories: z.array(z.object({
    content: z.string(),
  })).default([]),
  confidence_score: z.number().min(0).max(1).default(0),
  analysis_summary: z.string().default(""),
});

function mapPersonProfile(raw: unknown): PersonAIProfile | null {
  const parsed = PersonAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapPersonProperties(raw: unknown): ObjectProperties {
  const parsed = PersonAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.nickname) props.nickname = basic.nickname;
  if (basic.age) props.age = basic.age;
  if (basic.occupation) props.occupation = basic.occupation;
  if (basic.city) props.city = basic.city;
  return props;
}

function mapPersonInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = PersonAIOutputSchema.safeParse(raw);
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

function mapPersonSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = PersonAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.suggestions.map((item, index) => ({
    id: `suggestion-${now}-${index}`,
    title: item.title,
    description: item.description,
    priority: item.priority,
    status: "active",
    generatedAt: now,
  }));
}

function mapPersonMemories(raw: unknown): ObjectMemory[] {
  const parsed = PersonAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai",
    createdAt: now,
  }));
}

function PersonAIProfileEditor({
  profile,
  onChange,
}: {
  profile: PersonAIProfile;
  onChange: (profile: PersonAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateBigFive = (key: keyof PersonAIProfile["bigFive"], value: number) => {
    onChange({ ...profile, bigFive: { ...profile.bigFive, [key]: value } });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("aiProfileRelationshipContext")}>
          <input
            type="text"
            value={profile.relationshipContext || ""}
            onChange={(e) => onChange({ ...profile, relationshipContext: e.target.value })}
            placeholder={t("aiProfileRelationshipContextPlaceholder")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("aiProfileMbti")}>
          <input
            type="text"
            value={profile.mbti}
            onChange={(e) => onChange({ ...profile, mbti: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("aiProfileMbtiConfidence")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.mbtiConfidence}
            onChange={(e) => onChange({ ...profile, mbtiConfidence: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground">{t("aiProfileBigFive")}</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.keys(profile.bigFive) as Array<keyof PersonAIProfile["bigFive"]>).map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">{key}</span>
                <span className="text-foreground">{profile.bigFive[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={profile.bigFive[key]}
                onChange={(e) => updateBigFive(key, Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          ))}
        </div>
      </div>

      <Field label={t("aiProfileSummary")}>
        <textarea
          value={profile.personalitySummary}
          onChange={(e) => onChange({ ...profile, personalitySummary: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
    </div>
  );
}

function PersonAIProfileReader({ profile }: { profile: PersonAIProfile }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabelValueCard label={t("aiProfileRelationshipContext")}>
          {profile.relationshipContext || t("aiNotAvailable")}
        </LabelValueCard>
        <LabelValueCard label={t("aiProfileMbti")}>
          {profile.mbti || t("aiNotAvailable")}
        </LabelValueCard>
        <LabelValueCard label={t("aiProfileMbtiConfidence")}>
          {profile.mbtiConfidence}%
        </LabelValueCard>
      </div>

      <Card>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("aiProfileBigFive")}
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(Object.keys(profile.bigFive) as Array<keyof PersonAIProfile["bigFive"]>).map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{key}</span>
                <span className="font-medium text-foreground">{profile.bigFive[key]}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${profile.bigFive[key]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <LabelValueCard label={t("aiProfileSummary")}>
        {profile.personalitySummary || t("aiNotAvailable")}
      </LabelValueCard>

      {profile.rollingSummary && (
        <LabelValueCard label={t("aiProfileRollingSummary") ?? "Rolling Summary"}>
          {profile.rollingSummary}
        </LabelValueCard>
      )}
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

export const personProfileDefinition: AIProfileDefinition<PersonAIProfile> = {
  type: "person",
  name: "Person",
  description: "AI profile, insights, suggestions and memories for a person.",
  profileSchema: PersonAIProfileSchema,
  buildPrompt: buildPersonPrompt,
  mapProfile: mapPersonProfile,
  mapProperties: mapPersonProperties,
  mapInsights: mapPersonInsights,
  mapSuggestions: mapPersonSuggestions,
  mapMemories: mapPersonMemories,
  ProfileRenderer: PersonAIProfileEditor,
  ProfileReader: PersonAIProfileReader,
};
