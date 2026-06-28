import { z } from "zod";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import {
  EventAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { AIAnalysisInput, AIProfileDefinition } from "../types";

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

function buildEventPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        date: "string or empty",
        location: "string or empty",
      },
      profile: {
        type: "event",
        impactLevel: "low | medium | high",
        importance: 0,
        stakeholders: ["string"],
      },
      insights: [
        {
          category: "string",
          title: "string",
          description: "string",
          confidence: 0,
          evidence: [{ quote: "", source: "" }],
        },
      ],
      suggestions: [
        { title: "string", description: "string", priority: "medium" },
      ],
      memories: [{ content: "string" }],
      confidence_score: 0.0,
      analysis_summary: "string",
    },
    null,
    2
  );

  return `你是一位事件分析智能引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取事件名称、发生时间、地点，无法确认时留空，禁止编造。
2. Event AI Profile：影响程度（low/medium/high）、重要度（0-100）、相关利益方。
3. AI Insights：关于事件原因、影响、后续行动、情绪反应、关系变化等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的后续建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的关键事件/观察记录，作为初始记忆。
6. confidence_score：整体置信度（0-1）。
7. analysis_summary：整体分析摘要。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 保持客观。
- ${langHint}
- ${imageHint}

原始素材：
${input.textInput || "（未提供文本素材）"}`;
}

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
};
