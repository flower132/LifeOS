import { z } from "zod";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import {
  LifePattern,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
  SelfAIProfile,
} from "@/lib/types";
import { AIAnalysisInput, AIProfileDefinition } from "../types";

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

function buildSelfPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        current_focus: "string or empty",
      },
      profile: {
        type: "self",
        strengths: ["string"],
        weaknesses: ["string"],
        growthAreas: ["string"],
        currentFocus: "string",
        understandingSummary: "string: a warm, synthesized understanding of who this person is and what they are going through",
        growthThemes: ["string: 3-5 long-term growth themes"],
        reflectionSeeds: ["string: future reflection prompts"],
        lifePattern: {
          repeatedTopics: ["string"],
          goalChanges: ["string"],
          emotionalTrend: "string or empty",
          relationshipChanges: ["string"],
          learningDirections: ["string"],
          valueEvolution: ["string"],
          updatedAt: "ISO date string",
        },
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

  return `你是一位自我认知与成长分析引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取名称（如用户昵称）、当前关注焦点，无法确认时留空，禁止编造。
2. Self AI Profile：
   - strengths / weaknesses / growthAreas / currentFocus
   - understandingSummary：用温暖、安静的语气，综合素材写出对“这个人当下是谁、正经历什么”的理解，禁止简单复述模板字段。
   - growthThemes：识别 3-5 个长期成长主题（如成长、创造、关系、学习、健康）。
   - reflectionSeeds：生成 3-5 个未来可以不断发展的 Reflection 主题。
   - lifePattern：从素材中提取重复关注的话题、目标变化、情绪趋势、关系变化、学习方向、价值观演变。
3. AI Insights：关于自我状态、情绪模式、习惯、价值观、目标一致性等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的成长/调整建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的关键事件/观察记录，作为初始记忆。
6. confidence_score：整体置信度（0-1）。
7. analysis_summary：整体分析摘要。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 如果某个推断只是你的理解，请明确说明“这可能只是我的一种理解”。
- 保持客观、谦逊、温暖，不做医疗或心理诊断。
- 禁止使用“你应该”。
- ${langHint}
- ${imageHint}

原始素材：
${input.textInput || "（未提供文本素材）"}`;
}

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
};
