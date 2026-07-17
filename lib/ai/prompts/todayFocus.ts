import { CompanionContext, FocusCandidate } from "@/lib/companion/types";
import { FocusOutput } from "@/lib/companion/schemas";

function serializeNotes(notes: { id: string; created_at: string; content: string }[]): string {
  if (notes.length === 0) return "（没有相关 Memory）";
  return notes
    .map((n) => `[note:${n.id}] ${n.created_at}\n${n.content}`)
    .join("\n\n---\n\n");
}

function evidenceShape(): string {
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

export function buildFocusPrompt(
  context: CompanionContext,
  candidate: FocusCandidate
): string {
  const langHint = context.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

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

  const relatedNotesText = serializeNotes(candidate.relatedNotes.slice(0, 10));
  const recentNotesText = serializeNotes(recentNotes.slice(0, 10));

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
2. explanation 不超过 50 个字，回答“Why Me”：这个主题为什么对当下的用户重要。
3. whyNow 不超过 80 个字，回答“Why Today / Why Now”：为什么今天是自然的时机。
4. 必须引用至少一条真实 Memory 作为证据，source 格式为 note:<id> 或 memory:<id>。
5. 只基于提供的素材，禁止编造。
6. 语气温暖、平静、谦逊、支持性。不要出现“你应该”“必须”“赶快”等祈使或催促语言。使用“也许……”“我注意到……”“如果你愿意……”。
7. 如果没有足够素材，title/explanation/whyNow 可以为空字符串。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${evidenceShape()}

规则：
- ${langHint}
- 不出现 KPI、完成率、优先级、待办列表。
- 不与其他人比较。
`;
}

export function buildMockFocusOutput(candidate: FocusCandidate): FocusOutput {
  return {
    title: candidate.title.slice(0, 15),
    explanation: "今天也许可以多留意这个主题。",
    whyNow: "我注意到它最近出现在你的记录里。",
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
