import { CompanionContext, FocusCandidate } from "@/lib/companion/types";
import { FocusOutput } from "@/lib/companion/schemas";
import { resolveTranslation, interpolate, localeFromLanguage } from "@/translations";

/** Translate a focus key in the given language (falls back to key). */
function tt(
  key: string,
  language: "zh" | "en",
  vars: Record<string, string | number> = {}
): string {
  const locale = localeFromLanguage(language);
  const text = resolveTranslation(key, locale, vars);
  return interpolate(text ?? key, vars);
}

function serializeNotes(
  notes: { id: string; created_at: string; content: string }[],
  language: "zh" | "en"
): string {
  if (notes.length === 0) return tt("focus.noNotes", language);
  return notes
    .map((n) => `[note:${n.id}] ${n.created_at}\n${n.content}`)
    .join("\n\n---\n\n");
}

function evidenceShape(language: "zh" | "en"): string {
  if (language === "zh") {
    return JSON.stringify(
      {
        title: "给妈妈发消息",
        explanation: "她最近身体不太舒服，值得你关心。",
        whyNow: "你已经两周没有联系妈妈，上一次记录中你提到她最近身体不太舒服。",
        evidence: [{ quote: "原文引用", source: "note:<id>" }],
      },
      null,
      2
    );
  }
  return JSON.stringify(
    {
      title: "Message Mom",
      explanation: "She hasn't been feeling well lately — worth checking in.",
      whyNow: "You haven't reached out to Mom in two weeks, and your last note mentioned she was under the weather.",
      evidence: [{ quote: "quoted text", source: "note:<id>" }],
    },
    null,
    2
  );
}

export function buildFocusPrompt(
  context: CompanionContext,
  candidate: FocusCandidate
): string {
  const lang = context.language;
  const langHint = lang === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const candidateText = candidate.objectId
    ? `[object:${candidate.objectId}] ${candidate.title}`
    : candidate.memoryId
    ? `[memory/note:${candidate.memoryId}] ${candidate.title}`
    : candidate.relationId
    ? `[relation:${candidate.relationId}] ${candidate.title}`
    : candidate.title;

  const recentNotes = context.notes
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  const relatedNotesText = serializeNotes(candidate.relatedNotes.slice(0, 10), lang);
  const recentNotesText = serializeNotes(recentNotes.slice(0, 10), lang);

  if (lang === "zh") {
    return `你是一位温暖、安静、谦逊的 LifeOS 陪伴助手。
请基于以下真实素材，为用户生成今天的 Today Focus。

候选主题：
${candidateText}

与该主题相关的 Memory：
${relatedNotesText}

最近 30 条 Memory：
${recentNotesText}

要求：
1. title 不超过 15 个字。
2. explanation 不超过 50 个字，回答"Why Me"：这个主题为什么对当下的用户重要。
3. whyNow 不超过 80 个字，回答"Why Today / Why Now"：为什么今天是自然的时机。
4. 必须引用至少一条真实 Memory 作为证据，source 格式为 note:<id> 或 memory:<id>。
5. 只基于提供的素材，禁止编造。
6. 语气温暖、平静、谦逊、支持性。不要出现"你应该""必须""赶快"等祈使或催促语言。使用"也许……""我注意到……""如果你愿意……"。
7. 如果没有足够素材，title/explanation/whyNow 可以为空字符串。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${evidenceShape(lang)}

规则：
- ${langHint}
- 不出现 KPI、完成率、优先级、待办列表。
- 不与其他人比较。
`;
  }

  return `You are a warm, quiet, humble LifeOS companion.
Based on the following real material, generate today's Today Focus for the user.

Candidate topic:
${candidateText}

Memories related to this topic:
${relatedNotesText}

Recent 30 Memories:
${recentNotesText}

Requirements:
1. title: max 15 characters.
2. explanation: max 50 characters. Answer "Why Me" — why this topic matters to the user right now.
3. whyNow: max 80 characters. Answer "Why Today / Why Now" — why today is a natural moment.
4. You must cite at least one real Memory as evidence, with source in the format note:<id> or memory:<id>.
5. Use only the provided material. Do not fabricate.
6. Tone: warm, calm, humble, supportive. Avoid imperative or pushy language like "you should" or "must" or "hurry." Use phrasing like "perhaps...", "I noticed...", "if you'd like...".
7. If there isn't enough material, title/explanation/whyNow can be empty strings.

Output ONLY a valid JSON object matching this structure exactly:
${evidenceShape(lang)}

Rules:
- ${langHint}
- No KPIs, completion rates, priorities, or to-do lists.
- No comparisons with others.
`;
}

export function buildMockFocusOutput(
  candidate: FocusCandidate,
  language: "zh" | "en" = "zh"
): FocusOutput {
  return {
    title: candidate.title.slice(0, 15),
    explanation: tt("focus.defaultExplanation", language),
    whyNow: tt("focus.mockWhyNow", language),
    evidence: candidate.anchorNote
      ? [
          {
            quote: candidate.anchorNote.content.slice(0, 80),
            source: `note:${candidate.anchorNote.id}`,
          },
        ]
      : [],
  };
}
