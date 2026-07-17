import { z } from "zod";
import { useTranslation } from "@/lib/useTranslation";
import {
  EventAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { AIProfileDefinition } from "../types";
import { LabelValueCard } from "@/components/ui/LabelValueCard";
import { Badge } from "@/components/ui/Badge";
import { buildEventPrompt } from "@/lib/ai/prompts/objectAnalysis/event";

const EventAIProfileSchema: z.ZodType<EventAIProfile> = z.object({
  type: z.literal("event"),
  impactLevel: z.enum(["low", "medium", "high"]).default("medium"),
  importance: z.number().min(0).max(100).default(50),
  stakeholders: z.array(z.string()).default([]),
});

const EventAIOutputSchema = z.object({
  basic_profile: z
    .object({
      name: z.string().default(""),
      date: z.string().default(""),
      location: z.string().default(""),
    })
    .default(() => ({ name: "", date: "", location: "" })),
  profile: EventAIProfileSchema.default({
    type: "event",
    impactLevel: "medium",
    importance: 50,
    stakeholders: [],
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

function mapEventProfile(raw: unknown): EventAIProfile | null {
  const parsed = EventAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapEventProperties(raw: unknown): ObjectProperties {
  const parsed = EventAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.date) props.date = basic.date;
  if (basic.location) props.location = basic.location;
  return props;
}

function mapEventInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = EventAIOutputSchema.safeParse(raw);
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

function mapEventSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = EventAIOutputSchema.safeParse(raw);
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

function mapEventMemories(raw: unknown): ObjectMemory[] {
  const parsed = EventAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai" as const,
    createdAt: now,
  }));
}

function EventAIProfileEditor({
  profile,
  onChange,
}: {
  profile: EventAIProfile;
  onChange: (profile: EventAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateStakeholders = (value: string) => {
    onChange({
      ...profile,
      stakeholders: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("aiEventImpactLevel")}>
          <select
            value={profile.impactLevel}
            onChange={(e) =>
              onChange({
                ...profile,
                impactLevel: e.target.value as EventAIProfile["impactLevel"],
              })
            }
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          >
            <option value="low">{t("aiImpactLevelLow")}</option>
            <option value="medium">{t("aiImpactLevelMedium")}</option>
            <option value="high">{t("aiImpactLevelHigh")}</option>
          </select>
        </Field>
        <Field label={t("aiEventImportance")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.importance}
            onChange={(e) => onChange({ ...profile, importance: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>
      <Field label={t("aiEventStakeholders")}>
        <input
          type="text"
          value={profile.stakeholders.join(", ")}
          onChange={(e) => updateStakeholders(e.target.value)}
          placeholder={t("aiEventStakeholdersPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
    </div>
  );
}

function EventAIProfileReader({ profile }: { profile: EventAIProfile }) {
  const { t } = useTranslation();

  const impactClass =
    profile.impactLevel === "high"
      ? "bg-destructive/10 text-destructive"
      : profile.impactLevel === "medium"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabelValueCard label={t("aiEventImpactLevel")}>
          <Badge className={impactClass}>
            {t(`aiImpactLevel${profile.impactLevel.charAt(0).toUpperCase() + profile.impactLevel.slice(1)}`)}
          </Badge>
        </LabelValueCard>
        <LabelValueCard label={t("aiEventImportance")}>{profile.importance}% </LabelValueCard>
      </div>

      <LabelValueCard label={t("aiEventStakeholders")}>
        {profile.stakeholders.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {profile.stakeholders.map((s, i) => (
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

export const eventProfileDefinition: AIProfileDefinition<EventAIProfile> = {
  type: "event",
  name: "Event",
  description: "AI profile, insights, suggestions and memories for an event.",
  profileSchema: EventAIProfileSchema,
  buildPrompt: buildEventPrompt,
  mapProfile: mapEventProfile,
  mapProperties: mapEventProperties,
  mapInsights: mapEventInsights,
  mapSuggestions: mapEventSuggestions,
  mapMemories: mapEventMemories,
  ProfileRenderer: EventAIProfileEditor,
  ProfileReader: EventAIProfileReader,
};
