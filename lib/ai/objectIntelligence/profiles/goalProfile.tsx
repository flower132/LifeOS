import { z } from "zod";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import {
  GoalAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { AIAnalysisInput, AIProfileDefinition } from "../types";

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

function buildGoalPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        target_date: "string or empty",
        priority: "string or empty",
        status: "string or empty",
      },
      profile: {
        type: "goal",
        difficulty: 5,
        successProbability: 0,
        requiredResources: ["string"],
        estimatedDuration: "string",
        motivationType: "intrinsic | extrinsic | mixed",
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

  return `你是一位目标规划智能分析引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取目标名称、目标日期、优先级、当前状态，无法确认时留空，禁止编造。
2. Goal AI Profile：
   - difficulty：目标难度，1-10，10 为极难。
   - successProbability：当前状态下达成概率 0-100。
   - requiredResources：达成目标所需的资源列表（时间、金钱、人脉、技能等）。
   - estimatedDuration：预计完成周期，如 "3 个月"、"1 年"。
   - motivationType：动机类型，intrinsic（内在）/ extrinsic（外在）/ mixed（混合）。
3. AI Insights：关于目标可行性、范围、风险、拆分建议、动机、障碍等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的行动建议，包含 title、description、priority（low/medium/high）。
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
};
