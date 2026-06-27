import { z } from "zod";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import {
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
  ProjectAIProfile,
} from "@/lib/types";
import { AIAnalysisInput, AIProfileDefinition } from "../types";

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

function buildProjectPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        timeline: "string or empty",
        status: "string or empty",
      },
      profile: {
        type: "project",
        complexity: 5,
        riskLevel: "low | medium | high",
        timelineEstimate: "string",
        keyStakeholders: ["string"],
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

  return `你是一位项目分析智能引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取项目名称、时间线、当前状态，无法确认时留空，禁止编造。
2. Project AI Profile：复杂度（1-10）、风险等级（low/medium/high）、预计周期、关键利益方。
3. AI Insights：关于项目范围、风险、资源、关键路径、依赖、决策等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的项目管理建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的关键事件/约束/背景，作为初始记忆。
6. confidence_score：整体置信度（0-1）。
7. analysis_summary：整体分析摘要。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 保持客观，不做过度承诺。
- ${langHint}
- ${imageHint}

原始素材：
${input.textInput || "（未提供文本素材）"}`;
}

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
};
