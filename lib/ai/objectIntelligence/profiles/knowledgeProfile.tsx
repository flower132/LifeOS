import { z } from "zod";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import {
  KnowledgeAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
} from "@/lib/types";
import { AIAnalysisInput, AIProfileDefinition } from "../types";

const KnowledgeAIProfileSchema: z.ZodType<KnowledgeAIProfile> = z.object({
  type: z.literal("knowledge"),
  difficulty: z.number().min(0).max(100).default(50),
  relatedTopics: z.array(z.string()).default([]),
  knowledgeGraph: z
    .array(
      z.object({
        node: z.string(),
        relation: z.string(),
        target: z.string(),
      })
    )
    .default([]),
});

const KnowledgeAIOutputSchema = z.object({
  basic_profile: z
    .object({
      name: z.string().default(""),
      topic: z.string().default(""),
    })
    .default(() => ({ name: "", topic: "" })),
  profile: KnowledgeAIProfileSchema.default({
    type: "knowledge",
    difficulty: 50,
    relatedTopics: [],
    knowledgeGraph: [],
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

function buildKnowledgePrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        topic: "string or empty",
      },
      profile: {
        type: "knowledge",
        difficulty: 0,
        relatedTopics: ["string"],
        knowledgeGraph: [{ node: "string", relation: "string", target: "string" }],
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

  return `你是一位知识结构化智能引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取知识主题名称、细分话题，无法确认时留空，禁止编造。
2. Knowledge AI Profile：难度（0-100）、相关话题、知识图谱节点关系（node/relation/target）。
3. AI Insights：关于知识核心概念、关联性、理解难点、应用场景等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的深度学习/整理建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的关键知识点/背景，作为初始记忆。
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

function mapKnowledgeProfile(raw: unknown): KnowledgeAIProfile | null {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapKnowledgeProperties(raw: unknown): ObjectProperties {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.topic) props.topic = basic.topic;
  return props;
}

function mapKnowledgeInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
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

function mapKnowledgeSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
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

function mapKnowledgeMemories(raw: unknown): ObjectMemory[] {
  const parsed = KnowledgeAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai" as const,
    createdAt: now,
  }));
}

function KnowledgeAIProfileEditor({
  profile,
  onChange,
}: {
  profile: KnowledgeAIProfile;
  onChange: (profile: KnowledgeAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateTopics = (value: string) => {
    onChange({
      ...profile,
      relatedTopics: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  const updateGraph = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        onChange({ ...profile, knowledgeGraph: parsed });
      }
    } catch {
      // Ignore invalid JSON while user is typing.
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <Field label={t("aiKnowledgeDifficulty")}>
        <input
          type="number"
          min={0}
          max={100}
          value={profile.difficulty}
          onChange={(e) => onChange({ ...profile, difficulty: Number(e.target.value) })}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("aiKnowledgeRelatedTopics")}>
        <input
          type="text"
          value={profile.relatedTopics.join(", ")}
          onChange={(e) => updateTopics(e.target.value)}
          placeholder={t("aiKnowledgeRelatedTopicsPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </Field>
      <Field label={t("aiKnowledgeGraph")}>
        <textarea
          value={JSON.stringify(profile.knowledgeGraph, null, 2)}
          onChange={(e) => updateGraph(e.target.value)}
          rows={5}
          placeholder={t("aiKnowledgeGraphPlaceholder")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
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

export const knowledgeProfileDefinition: AIProfileDefinition<KnowledgeAIProfile> = {
  type: "knowledge",
  name: "Knowledge",
  description: "AI profile, insights, suggestions and memories for knowledge.",
  profileSchema: KnowledgeAIProfileSchema,
  buildPrompt: buildKnowledgePrompt,
  mapProfile: mapKnowledgeProfile,
  mapProperties: mapKnowledgeProperties,
  mapInsights: mapKnowledgeInsights,
  mapSuggestions: mapKnowledgeSuggestions,
  mapMemories: mapKnowledgeMemories,
  ProfileRenderer: KnowledgeAIProfileEditor,
};
