import { z } from "zod";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import {
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
  ObjectProperties,
  PersonAIProfile,
} from "@/lib/types";
import { AIAnalysisInput, AIProfileDefinition } from "../types";

const PersonAIProfileSchema: z.ZodType<PersonAIProfile> = z.object({
  type: z.literal("person"),
  relationshipContext: z.string().default(""),
  mbti: z.string().default(""),
  mbtiConfidence: z.number().min(0).max(100).default(0),
  bigFive: z.object({
    openness: z.number().min(0).max(100).default(0),
    conscientiousness: z.number().min(0).max(100).default(0),
    extraversion: z.number().min(0).max(100).default(0),
    agreeableness: z.number().min(0).max(100).default(0),
    emotionalStability: z.number().min(0).max(100).default(0),
  }),
  personalitySummary: z.string().default(""),
  rollingSummary: z.string().default(""),
});

const PersonAIOutputSchema = z.object({
  basic_profile: z.object({
    name: z.string().default(""),
    nickname: z.string().default(""),
    age: z.string().default(""),
    occupation: z.string().default(""),
    city: z.string().default(""),
  }).default(() => ({ name: "", nickname: "", age: "", occupation: "", city: "" })),
  profile: PersonAIProfileSchema.default({
    type: "person",
    relationshipContext: "",
    mbti: "",
    mbtiConfidence: 0,
    bigFive: {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      emotionalStability: 0,
    },
    personalitySummary: "",
    rollingSummary: "",
  }),
  insights: z.array(z.object({
    category: z.string(),
    title: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.object({ quote: z.string(), source: z.string() })).default([]),
  })).default([]),
  suggestions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  })).default([]),
  memories: z.array(z.object({
    content: z.string(),
  })).default([]),
  confidence_score: z.number().min(0).max(1).default(0),
  analysis_summary: z.string().default(""),
});

function buildPersonPrompt(input: AIAnalysisInput, language: Language): string {
  const langHint = language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    input.images.length > 0
      ? `用户上传了 ${input.images.length} 张图片。请结合图片与文本一起分析。`
      : "用户未上传图片，仅分析文本内容。";

  const shape = JSON.stringify(
    {
      basic_profile: {
        name: "string or empty",
        nickname: "string or empty",
        age: "string or empty",
        occupation: "string or empty",
        city: "string or empty",
      },
      profile: {
        type: "person",
        relationshipContext: "string or empty (e.g. leader, customer, friend, lover, family, mentor, colleague, subordinate)",
        mbti: "string or empty",
        mbtiConfidence: 0,
        bigFive: {
          openness: 0,
          conscientiousness: 0,
          extraversion: 0,
          agreeableness: 0,
          emotionalStability: 0,
        },
        personalitySummary: "string",
        rollingSummary: "string: a concise, evolving summary of how to relate to this person",
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

  return `你是一位专注于关系经营的 AI 助手。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取姓名、昵称、年龄、职业、城市，无法确认时留空，禁止编造。
2. Relationship Context：根据素材推断你与这个人的关系角色（例如 leader, customer, friend, lover, family, mentor, colleague, subordinate）。如果不确定，留空。
3. Person AI Profile：MBTI 及置信度、Big Five 五维分数（0-100）、人格总结、Rolling Summary。
4. Rolling Summary：一段简洁的、不断更新的关系经营摘要。用 2-4 句话总结：这个人是谁、你们的关系状态、当前最重要的相处原则。不要罗列事实，要提炼成可指导行动的摘要。
5. AI Insights：只输出与“如何与这个人相处”相关的洞察。聚焦：沟通风格、合作偏好、决策方式、信任信号、相处风险、边界感。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。禁止输出纯粹的标签式描述，例如“他很外向”。
6. AI Suggestions：必须是面向用户的行动建议，回答“我应该做什么？”。
7. Memories：从素材中提取的重要事件/观察记录，作为初始记忆。
8. confidence_score：整体置信度（0-1）。
9. analysis_summary：整体分析摘要，重点说明对关系经营的意义。

规则：
- 不要编造证据，数据不足时 confidence 设为 0。
- 保持客观，不做医疗或心理诊断。
- 所有洞察和建议必须服务于“我该如何与这个人建立和维护更好的关系”。
- ${langHint}
- ${imageHint}

原始素材：
${input.textInput || "（未提供文本素材）"}`;
}

function mapPersonProfile(raw: unknown): PersonAIProfile | null {
  const parsed = PersonAIOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.profile;
}

function mapPersonProperties(raw: unknown): ObjectProperties {
  const parsed = PersonAIOutputSchema.safeParse(raw);
  if (!parsed.success) return {};
  const basic = parsed.data.basic_profile;
  const props: ObjectProperties = {};
  if (basic.name) props.name = basic.name;
  if (basic.nickname) props.nickname = basic.nickname;
  if (basic.age) props.age = basic.age;
  if (basic.occupation) props.occupation = basic.occupation;
  if (basic.city) props.city = basic.city;
  return props;
}

function mapPersonInsights(raw: unknown): ObjectAIInsight[] {
  const parsed = PersonAIOutputSchema.safeParse(raw);
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

function mapPersonSuggestions(raw: unknown): ObjectAISuggestion[] {
  const parsed = PersonAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.suggestions.map((item, index) => ({
    id: `suggestion-${now}-${index}`,
    title: item.title,
    description: item.description,
    priority: item.priority,
    status: "active",
    generatedAt: now,
  }));
}

function mapPersonMemories(raw: unknown): ObjectMemory[] {
  const parsed = PersonAIOutputSchema.safeParse(raw);
  if (!parsed.success) return [];
  const now = new Date().toISOString();
  return parsed.data.memories.map((item, index) => ({
    id: `memory-${now}-${index}`,
    content: item.content,
    source: "ai",
    createdAt: now,
  }));
}

function PersonAIProfileEditor({
  profile,
  onChange,
}: {
  profile: PersonAIProfile;
  onChange: (profile: PersonAIProfile) => void;
}) {
  const { t } = useTranslation();

  const updateBigFive = (key: keyof PersonAIProfile["bigFive"], value: number) => {
    onChange({ ...profile, bigFive: { ...profile.bigFive, [key]: value } });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("aiProfileRelationshipContext")}>
          <input
            type="text"
            value={profile.relationshipContext || ""}
            onChange={(e) => onChange({ ...profile, relationshipContext: e.target.value })}
            placeholder={t("aiProfileRelationshipContextPlaceholder")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("aiProfileMbti")}>
          <input
            type="text"
            value={profile.mbti}
            onChange={(e) => onChange({ ...profile, mbti: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
        <Field label={t("aiProfileMbtiConfidence")}>
          <input
            type="number"
            min={0}
            max={100}
            value={profile.mbtiConfidence}
            onChange={(e) => onChange({ ...profile, mbtiConfidence: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </Field>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground">{t("aiProfileBigFive")}</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.keys(profile.bigFive) as Array<keyof PersonAIProfile["bigFive"]>).map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">{key}</span>
                <span className="text-foreground">{profile.bigFive[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={profile.bigFive[key]}
                onChange={(e) => updateBigFive(key, Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          ))}
        </div>
      </div>

      <Field label={t("aiProfileSummary")}>
        <textarea
          value={profile.personalitySummary}
          onChange={(e) => onChange({ ...profile, personalitySummary: e.target.value })}
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

export const personProfileDefinition: AIProfileDefinition<PersonAIProfile> = {
  type: "person",
  name: "Person",
  description: "AI profile, insights, suggestions and memories for a person.",
  profileSchema: PersonAIProfileSchema,
  buildPrompt: buildPersonPrompt,
  mapProfile: mapPersonProfile,
  mapProperties: mapPersonProperties,
  mapInsights: mapPersonInsights,
  mapSuggestions: mapPersonSuggestions,
  mapMemories: mapPersonMemories,
  ProfileRenderer: PersonAIProfileEditor,
};
