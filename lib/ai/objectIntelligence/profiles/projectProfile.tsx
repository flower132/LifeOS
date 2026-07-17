import { z } from "zod";
import { useTranslation } from "@/lib/useTranslation";
import {
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
  ProjectAIProfile,
} from "@/lib/types";
import { AIProfileDefinition } from "../types";
import { LabelValueCard } from "@/components/ui/LabelValueCard";
import { Badge } from "@/components/ui/Badge";
import { buildProjectPrompt } from "@/lib/ai/prompts/objectAnalysis/project";

const ProjectAIProfileSchema: z.ZodType<ProjectAIProfile> = z.object({
  type: z.literal("project"),
  complexity: z.number().min(1).max(10).default(5),
  riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
  timelineEstimate: z.string().default(""),
  keyStakeholders: z.array(z.string()).default([]),
});

const ProjectAIOutputSchema = z.object({
  basic_profile: z
    .object({
      name: z.string().default(""),
      timeline: z.string().default(""),
      status: z.string().default(""),
    })
    .default(() => ({ name: "", timeline: "", status: "" })),
  profile: ProjectAIProfileSchema.default({
    type: "project",
    complexity: 5,
    riskLevel: "medium",
    timelineEstimate: "",
    keyStakeholders: [],
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

function mapProjectProfile(raw: unknown): ProjectAIProfile | null {
  const parsed = ProjectAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapProjectProperties(raw: unknown): ObjectProperties {
  const parsed = ProjectAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.timeline) props.timeline = basic.timeline;
  if (basic.status) props.status = basic.status;
  return props;
}

function mapProjectInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = ProjectAIOutputSchema.safeParse(raw);
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

function mapProjectSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = ProjectAIOutputSchema.safeParse(raw);
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

function mapProjectMemories(raw: unknown): ObjectMemory[] {
  const parsed = ProjectAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai" as const,
    createdAt: now,
  }));
}

function ProjectAIProfileEditor({
  profile,
  onChange,
}: {
  profile: ProjectAIProfile;
  onChange: (profile: ProjectAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateStakeholders = (value: string) => {
    onChange({
      ...profile,
      keyStakeholders: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("aiProjectComplexity")}>
          <input
            type="number"
            min={1}
            max={10}
            value={profile.complexity}
            onChange={(e) => onChange({ ...profile, complexity: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("aiProjectRiskLevel")}>
          <select
            value={profile.riskLevel}
            onChange={(e) =>
              onChange({
                ...profile,
                riskLevel: e.target.value as ProjectAIProfile["riskLevel"],
              })
            }
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          >
            <option value="low">{t("aiRiskLevelLow")}</option>
            <option value="medium">{t("aiRiskLevelMedium")}</option>
            <option value="high">{t("aiRiskLevelHigh")}</option>
          </select>
        </Field>
      </div>
      <Field label={t("aiProjectTimelineEstimate")}>
        <input
          type="text"
          value={profile.timelineEstimate}
          onChange={(e) => onChange({ ...profile, timelineEstimate: e.target.value })}
          placeholder={t("aiProjectTimelineEstimatePlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("aiProjectKeyStakeholders")}>
        <input
          type="text"
          value={profile.keyStakeholders.join(", ")}
          onChange={(e) => updateStakeholders(e.target.value)}
          placeholder={t("aiProjectKeyStakeholdersPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
    </div>
  );
}

function ProjectAIProfileReader({ profile }: { profile: ProjectAIProfile }) {
  const { t } = useTranslation();

  const riskClass =
    profile.riskLevel === "high"
      ? "bg-destructive/10 text-destructive"
      : profile.riskLevel === "medium"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabelValueCard label={t("aiProjectComplexity")}>
          {profile.complexity} / 10
        </LabelValueCard>
        <LabelValueCard label={t("aiProjectRiskLevel")}>
          <Badge className={riskClass}>
            {t(`aiRiskLevel${profile.riskLevel.charAt(0).toUpperCase() + profile.riskLevel.slice(1)}`)}
          </Badge>
        </LabelValueCard>
      </div>

      <LabelValueCard label={t("aiProjectTimelineEstimate")}>
        {profile.timelineEstimate || t("aiNotAvailable")}
      </LabelValueCard>

      <LabelValueCard label={t("aiProjectKeyStakeholders")}>
        {profile.keyStakeholders.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {profile.keyStakeholders.map((s, i) => (
              <li key={i}>
                <Badge variant="accent">{s}</Badge>
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

export const projectProfileDefinition: AIProfileDefinition<ProjectAIProfile> = {
  type: "project",
  name: "Project",
  description: "AI profile, insights, suggestions and memories for a project.",
  profileSchema: ProjectAIProfileSchema,
  buildPrompt: buildProjectPrompt,
  mapProfile: mapProjectProfile,
  mapProperties: mapProjectProperties,
  mapInsights: mapProjectInsights,
  mapSuggestions: mapProjectSuggestions,
  mapMemories: mapProjectMemories,
  ProfileRenderer: ProjectAIProfileEditor,
  ProfileReader: ProjectAIProfileReader,
};
