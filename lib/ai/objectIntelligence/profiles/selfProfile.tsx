import { z } from "zod";
import { useTranslation } from "@/lib/useTranslation";
import {
  LifePattern,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
  SelfAIProfile,
} from "@/lib/types";
import { AIProfileDefinition } from "../types";
import { Card } from "@/components/ui/Card";
import { LabelValueCard } from "@/components/ui/LabelValueCard";
import { Badge } from "@/components/ui/Badge";
import { buildSelfPrompt } from "@/lib/ai/prompts/objectAnalysis/self";

const LifePatternSchema: z.ZodType<LifePattern> = z.object({
  repeatedTopics: z.array(z.string()).default([]),
  goalChanges: z.array(z.string()).default([]),
  emotionalTrend: z.string().optional(),
  relationshipChanges: z.array(z.string()).default([]),
  learningDirections: z.array(z.string()).default([]),
  valueEvolution: z.array(z.string()).default([]),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

const SelfAIProfileSchema: z.ZodType<SelfAIProfile> = z.object({
  type: z.literal("self"),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  growthAreas: z.array(z.string()).default([]),
  currentFocus: z.string().default(""),
  understandingSummary: z.string().default(""),
  growthThemes: z.array(z.string()).default([]),
  reflectionSeeds: z.array(z.string()).default([]),
  lifePattern: LifePatternSchema.default({
    repeatedTopics: [],
    goalChanges: [],
    relationshipChanges: [],
    learningDirections: [],
    valueEvolution: [],
    updatedAt: new Date().toISOString(),
  }),
});

const SelfAIOutputSchema = z.object({
  basic_profile: z
    .object({
      name: z.string().default(""),
      current_focus: z.string().default(""),
    })
    .default(() => ({ name: "", current_focus: "" })),
  profile: SelfAIProfileSchema.default({
    type: "self",
    strengths: [],
    weaknesses: [],
    growthAreas: [],
    currentFocus: "",
    understandingSummary: "",
    growthThemes: [],
    reflectionSeeds: [],
    lifePattern: {
      repeatedTopics: [],
      goalChanges: [],
      relationshipChanges: [],
      learningDirections: [],
      valueEvolution: [],
      updatedAt: new Date().toISOString(),
    },
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

function mapSelfProfile(raw: unknown): SelfAIProfile | null {
  const parsed = SelfAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapSelfProperties(raw: unknown): ObjectProperties {
  const parsed = SelfAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.current_focus) props.currentFocus = basic.current_focus;
  return props;
}

function mapSelfInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = SelfAIOutputSchema.safeParse(raw);
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

function mapSelfSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = SelfAIOutputSchema.safeParse(raw);
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

function mapSelfMemories(raw: unknown): ObjectMemory[] {
  const parsed = SelfAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai" as const,
    createdAt: now,
  }));
}

function SelfAIProfileEditor({
  profile,
  onChange,
}: {
  profile: SelfAIProfile;
  onChange: (profile: SelfAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateList = (
    key: "strengths" | "weaknesses" | "growthAreas" | "growthThemes" | "reflectionSeeds",
    value: string
  ) => {
    onChange({
      ...profile,
      [key]: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  const updateLifePattern = (patch: Partial<LifePattern>) => {
    onChange({
      ...profile,
      lifePattern: { ...profile.lifePattern, ...patch, updatedAt: new Date().toISOString() },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <Field label={t("aiSelfStrengths")}>
        <input
          type="text"
          value={profile.strengths.join(", ")}
          onChange={(e) => updateList("strengths", e.target.value)}
          placeholder={t("aiSelfStrengthsPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("aiSelfWeaknesses")}>
        <input
          type="text"
          value={profile.weaknesses.join(", ")}
          onChange={(e) => updateList("weaknesses", e.target.value)}
          placeholder={t("aiSelfWeaknessesPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("aiSelfGrowthAreas")}>
        <input
          type="text"
          value={profile.growthAreas.join(", ")}
          onChange={(e) => updateList("growthAreas", e.target.value)}
          placeholder={t("aiSelfGrowthAreasPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("aiSelfCurrentFocus")}>
        <textarea
          value={profile.currentFocus}
          onChange={(e) => onChange({ ...profile, currentFocus: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("selfUnderstanding")}>
        <textarea
          value={profile.understandingSummary}
          onChange={(e) => onChange({ ...profile, understandingSummary: e.target.value })}
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("selfGrowthThemes")}>
        <input
          type="text"
          value={profile.growthThemes.join(", ")}
          onChange={(e) => updateList("growthThemes", e.target.value)}
          placeholder={t("selfGrowthThemesPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("selfReflectionSeeds")}>
        <input
          type="text"
          value={profile.reflectionSeeds.join(", ")}
          onChange={(e) => updateList("reflectionSeeds", e.target.value)}
          placeholder={t("selfReflectionSeedsPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <div className="space-y-3 rounded-lg bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground">{t("selfLifePattern")}</p>
        <Field label={t("lifePatternRepeatedTopics")}>
          <input
            type="text"
            value={profile.lifePattern.repeatedTopics.join(", ")}
            onChange={(e) => updateLifePattern({ repeatedTopics: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("lifePatternLearningDirections")}>
          <input
            type="text"
            value={profile.lifePattern.learningDirections.join(", ")}
            onChange={(e) => updateLifePattern({ learningDirections: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("lifePatternEmotionalTrend")}>
          <input
            type="text"
            value={profile.lifePattern.emotionalTrend ?? ""}
            onChange={(e) => updateLifePattern({ emotionalTrend: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>
    </div>
  );
}

function SelfAIProfileReader({ profile }: { profile: SelfAIProfile }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabelValueCard label={t("aiSelfStrengths")}>
          {profile.strengths.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {profile.strengths.map((item, i) => (
                <li key={i}>
                  <Badge variant="accent">{item}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            t("aiNotAvailable")
          )}
        </LabelValueCard>
        <LabelValueCard label={t("aiSelfWeaknesses")}>
          {profile.weaknesses.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {profile.weaknesses.map((item, i) => (
                <li key={i}>
                  <Badge variant="accent">{item}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            t("aiNotAvailable")
          )}
        </LabelValueCard>
        <LabelValueCard label={t("aiSelfGrowthAreas")}>
          {profile.growthAreas.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {profile.growthAreas.map((item, i) => (
                <li key={i}>
                  <Badge variant="accent">{item}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            t("aiNotAvailable")
          )}
        </LabelValueCard>
      </div>

      <LabelValueCard label={t("aiSelfCurrentFocus")}>
        {profile.currentFocus || t("aiNotAvailable")}
      </LabelValueCard>

      <LabelValueCard label={t("selfUnderstanding")}>
        {profile.understandingSummary || t("aiNotAvailable")}
      </LabelValueCard>

      <LabelValueCard label={t("selfGrowthThemes")}>
        {profile.growthThemes.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {profile.growthThemes.map((theme, i) => (
              <li
                key={i}
                className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent"
              >
                {theme}
              </li>
            ))}
          </ul>
        ) : (
          t("aiNotAvailable")
        )}
      </LabelValueCard>

      <LabelValueCard label={t("selfReflectionSeeds")}>
        {profile.reflectionSeeds.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
            {profile.reflectionSeeds.map((seed, i) => (
              <li key={i}>{seed}</li>
            ))}
          </ul>
        ) : (
          t("aiNotAvailable")
        )}
      </LabelValueCard>

      <Card>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("selfLifePattern")}
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LifePatternMiniCard label={t("lifePatternRepeatedTopics")}>
            {profile.lifePattern.repeatedTopics}
          </LifePatternMiniCard>
          <LifePatternMiniCard label={t("lifePatternGoalChanges")}>
            {profile.lifePattern.goalChanges}
          </LifePatternMiniCard>
          <LifePatternMiniCard label={t("lifePatternEmotionalTrend")}>
            {profile.lifePattern.emotionalTrend ? [profile.lifePattern.emotionalTrend] : []}
          </LifePatternMiniCard>
          <LifePatternMiniCard label={t("lifePatternRelationshipChanges")}>
            {profile.lifePattern.relationshipChanges}
          </LifePatternMiniCard>
          <LifePatternMiniCard label={t("lifePatternLearningDirections")}>
            {profile.lifePattern.learningDirections}
          </LifePatternMiniCard>
          <LifePatternMiniCard label={t("lifePatternValueEvolution")}>
            {profile.lifePattern.valueEvolution}
          </LifePatternMiniCard>
        </div>
      </Card>
    </div>
  );
}

function LifePatternMiniCard({
  label,
  children,
}: {
  label: string;
  children: string[];
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children.length > 0 ? (
        <ul className="list-disc space-y-0.5 pl-4 text-sm text-foreground">
          {children.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("aiNotAvailable")}</p>
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

export const selfProfileDefinition: AIProfileDefinition<SelfAIProfile> = {
  type: "self",
  name: "Self",
  description: "AI profile, insights, suggestions and memories for self.",
  profileSchema: SelfAIProfileSchema,
  buildPrompt: buildSelfPrompt,
  mapProfile: mapSelfProfile,
  mapProperties: mapSelfProperties,
  mapInsights: mapSelfInsights,
  mapSuggestions: mapSelfSuggestions,
  mapMemories: mapSelfMemories,
  ProfileRenderer: SelfAIProfileEditor,
  ProfileReader: SelfAIProfileReader,
};
