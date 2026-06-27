import { z } from "zod";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import {
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
  SelfAIProfile,
} from "@/lib/types";
import { AIAnalysisInput, AIProfileDefinition } from "../types";

const SelfAIProfileSchema: z.ZodType<SelfAIProfile> = z.object({
  type: z.literal("self"),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  growthAreas: z.array(z.string()).default([]),
  currentFocus: z.string().default(""),
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

  return `你是一位自我认知智能分析引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取名称（如用户昵称）、当前关注焦点，无法确认时留空，禁止编造。
2. Self AI Profile：优势、短板、成长方向、当前关注焦点。
3. AI Insights：关于自我状态、情绪模式、习惯、价值观、目标一致性等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的成长/调整建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的关键事件/观察记录，作为初始记忆。
6. confidence_score：整体置信度（0-1）。
7. analysis_summary：整体分析摘要。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 保持客观，不做医疗或心理诊断。
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
    key: "strengths" | "weaknesses" | "growthAreas",
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
          rows={3}
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
