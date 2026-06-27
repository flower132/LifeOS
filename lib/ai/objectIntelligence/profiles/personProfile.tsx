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

  return `你是一位结构化关系智能分析引擎。请基于用户提供的原始素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 基础画像：提取姓名、昵称、年龄、职业、城市，无法确认时留空，禁止编造。
2. Person AI Profile：MBTI 及置信度、Big Five 五维分数（0-100）、人格总结。
3. AI Insights：性格、行为、沟通、关系、情绪、价值观、动机、风险等方面的洞察。每个洞察必须包含 category、title、description、confidence（0-100）、evidence（直接引用素材来源）。
4. AI Suggestions：基于洞察给出可执行的相处/沟通建议，包含 title、description、priority（low/medium/high）。
5. Memories：从素材中提取的重要事件/观察记录，作为初始记忆。
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
