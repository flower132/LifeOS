import { z } from "zod";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import {
  IdeaAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { AIAnalysisInput, AIProfileDefinition } from "../types";

const IdeaAIProfileSchema: z.ZodType<IdeaAIProfile> = z.object({
  type: z.literal("idea"),
  novelty: z.number().min(0).max(100).default(50),
  feasibility: z.number().min(0).max(100).default(50),
  marketPotential: z.number().min(0).max(100).default(50),
  relatedDomains: z.array(z.string()).default([]),
});

const IdeaAIOutputSchema = z.object({
  basic_profile: z
    .object({
      name: z.string().default(""),
      domain: z.string().default(""),
    })
    .default(() => ({ name: "", domain: "" })),
  profile: IdeaAIProfileSchema.default({
    type: "idea",
    novelty: 50,
    feasibility: 50,
    marketPotential: 50,
    relatedDomains: [],
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

function buildIdeaPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        domain: "string or empty",
      },
      profile: {
        type: "idea",
        novelty: 0,
        feasibility: 0,
        marketPotential: 0,
        relatedDomains: ["string"],
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

  return `你是一位创意评估智能引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取想法名称、所属领域，无法确认时留空，禁止编造。
2. Idea AI Profile：新颖度（0-100）、可执行性（0-100）、市场潜力（0-100）、相关领域。
3. AI Insights：关于想法价值、可行性、风险、验证路径、应用场景等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的下一步验证/行动建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的关键背景/灵感来源，作为初始记忆。
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

function mapIdeaProfile(raw: unknown): IdeaAIProfile | null {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapIdeaProperties(raw: unknown): ObjectProperties {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.domain) props.domain = basic.domain;
  return props;
}

function mapIdeaInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
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

function mapIdeaSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
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

function mapIdeaMemories(raw: unknown): ObjectMemory[] {
  const parsed = IdeaAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai" as const,
    createdAt: now,
  }));
}

function IdeaAIProfileEditor({
  profile,
  onChange,
}: {
  profile: IdeaAIProfile;
  onChange: (profile: IdeaAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateDomains = (value: string) => {
    onChange({
      ...profile,
      relatedDomains: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t("aiIdeaNovelty")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.novelty}
            onChange={(e) => onChange({ ...profile, novelty: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("aiIdeaFeasibility")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.feasibility}
            onChange={(e) => onChange({ ...profile, feasibility: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("aiIdeaMarketPotential")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.marketPotential}
            onChange={(e) => onChange({ ...profile, marketPotential: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>
      <Field label={t("aiIdeaRelatedDomains")}>
        <input
          type="text"
          value={profile.relatedDomains.join(", ")}
          onChange={(e) => updateDomains(e.target.value)}
          placeholder={t("aiIdeaRelatedDomainsPlaceholder")}
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

export const ideaProfileDefinition: AIProfileDefinition<IdeaAIProfile> = {
  type: "idea",
  name: "Idea",
  description: "AI profile, insights, suggestions and memories for an idea.",
  profileSchema: IdeaAIProfileSchema,
  buildPrompt: buildIdeaPrompt,
  mapProfile: mapIdeaProfile,
  mapProperties: mapIdeaProperties,
  mapInsights: mapIdeaInsights,
  mapSuggestions: mapIdeaSuggestions,
  mapMemories: mapIdeaMemories,
  ProfileRenderer: IdeaAIProfileEditor,
};
