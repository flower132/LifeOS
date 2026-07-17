import { z } from "zod";
import { useTranslation } from "@/lib/useTranslation";
import {
  GoalAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { AIProfileDefinition } from "../types";
import { LabelValueCard } from "@/components/ui/LabelValueCard";
import { buildGoalPrompt } from "@/lib/ai/prompts/objectAnalysis/goal";

const GoalAIProfileSchema: z.ZodType<GoalAIProfile> = z.object({
  type: z.literal("goal"),
  difficulty: z.number().min(1).max(10).default(5),
  successProbability: z.number().min(0).max(100).default(0),
  requiredResources: z.array(z.string()).default([]),
  estimatedDuration: z.string().default(""),
  motivationType: z.enum(["intrinsic", "extrinsic", "mixed"]).default("mixed"),
});

const GoalAIOutputSchema = z.object({
  basic_profile: z
    .object({
      name: z.string().default(""),
      target_date: z.string().default(""),
      priority: z.string().default(""),
      status: z.string().default(""),
    })
    .default(() => ({
      name: "",
      target_date: "",
      priority: "",
      status: "",
    })),
  profile: GoalAIProfileSchema.default({
    type: "goal",
    difficulty: 5,
    successProbability: 0,
    requiredResources: [],
    estimatedDuration: "",
    motivationType: "mixed",
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

function mapGoalProfile(raw: unknown): GoalAIProfile | null {
  const parsed = GoalAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapGoalProperties(raw: unknown): ObjectProperties {
  const parsed = GoalAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.goalName = basic.name;
  if (basic.target_date) props.targetDate = basic.target_date;
  if (basic.priority) props.priority = basic.priority;
  if (basic.status) props.status = basic.status;
  return props;
}

function mapGoalInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = GoalAIOutputSchema.safeParse(raw);
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

function mapGoalSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = GoalAIOutputSchema.safeParse(raw);
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

function mapGoalMemories(raw: unknown): ObjectMemory[] {
  const parsed = GoalAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai" as const,
    createdAt: now,
  }));
}

function GoalAIProfileEditor({
  profile,
  onChange,
}: {
  profile: GoalAIProfile;
  onChange: (profile: GoalAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateResources = (value: string) => {
    onChange({
      ...profile,
      requiredResources: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("aiGoalDifficulty")}>
          <input
            type="number"
            min={1}
            max={10}
            value={profile.difficulty}
            onChange={(e) => onChange({ ...profile, difficulty: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("aiGoalSuccessProbability")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.successProbability}
            onChange={(e) => onChange({ ...profile, successProbability: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>

      <Field label={t("aiGoalMotivationType")}>
        <select
          value={profile.motivationType}
          onChange={(e) =>
            onChange({ ...profile, motivationType: e.target.value as GoalAIProfile["motivationType"] })
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        >
          <option value="intrinsic">{t("aiGoalMotivationIntrinsic")}</option>
          <option value="extrinsic">{t("aiGoalMotivationExtrinsic")}</option>
          <option value="mixed">{t("aiGoalMotivationMixed")}</option>
        </select>
      </Field>

      <Field label={t("aiGoalEstimatedDuration")}>
        <input
          type="text"
          value={profile.estimatedDuration}
          onChange={(e) => onChange({ ...profile, estimatedDuration: e.target.value })}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>

      <Field label={t("aiGoalRequiredResources")}>
        <input
          type="text"
          value={profile.requiredResources.join(", ")}
          onChange={(e) => updateResources(e.target.value)}
          placeholder={t("aiGoalRequiredResourcesPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
    </div>
  );
}

function GoalAIProfileReader({ profile }: { profile: GoalAIProfile }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabelValueCard label={t("aiGoalDifficulty")}>{profile.difficulty} / 10</LabelValueCard>
        <LabelValueCard label={t("aiGoalSuccessProbability")}>{profile.successProbability}%</LabelValueCard>
        <LabelValueCard label={t("aiGoalMotivationType")}>
          {t(`aiGoalMotivation${profile.motivationType.charAt(0).toUpperCase() + profile.motivationType.slice(1)}`)}
        </LabelValueCard>
        <LabelValueCard label={t("aiGoalEstimatedDuration")}>
          {profile.estimatedDuration || t("aiNotAvailable")}
        </LabelValueCard>
      </div>

      <LabelValueCard label={t("aiGoalRequiredResources")}>
        {profile.requiredResources.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4">
            {profile.requiredResources.map((resource, i) => (
              <li key={i}>{resource}</li>
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

export const goalProfileDefinition: AIProfileDefinition<GoalAIProfile> = {
  type: "goal",
  name: "Goal",
  description: "AI profile, insights, suggestions and memories for a goal.",
  profileSchema: GoalAIProfileSchema,
  buildPrompt: buildGoalPrompt,
  mapProfile: mapGoalProfile,
  mapProperties: mapGoalProperties,
  mapInsights: mapGoalInsights,
  mapSuggestions: mapGoalSuggestions,
  mapMemories: mapGoalMemories,
  ProfileRenderer: GoalAIProfileEditor,
  ProfileReader: GoalAIProfileReader,
};
