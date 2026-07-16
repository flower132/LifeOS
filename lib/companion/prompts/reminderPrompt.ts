import { CompanionContext } from "../types";
import { ReminderOutput } from "../schemas";
import { Note } from "@/lib/types";

export interface ReminderCandidate {
  sourceType: "person" | "goal" | "project" | "health" | "relationship" | "memory";
  objectId?: string;
  relationId?: string;
  memoryId?: string;
  title: string;
  anchorNote: Note | null;
  relatedNotes: Note[];
  isSpecialDate?: boolean;
}

export function buildReminderPrompt(
  context: CompanionContext,
  candidate: ReminderCandidate
): string {
  const langHint = context.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const sourceText = candidate.objectId
    ? `[object:${candidate.objectId}] ${candidate.title}`
    : candidate.memoryId
    ? `[memory/note:${candidate.memoryId}] ${candidate.title}`
    : candidate.relationId
    ? `[relation:${candidate.relationId}] ${candidate.title}`
    : candidate.title;

  const relatedNotesText = candidate.relatedNotes
    .slice(0, 8)
    .map((n) => `[note:${n.id}] ${n.created_at}\n${n.content}`)
    .join("\n\n---\n\n") || "（没有相关 Memory）";

  return `你是一位温暖、安静、谦逊的 LifeOS 陪伴助手。
请基于真实素材，为用户生成一条意义驱动的每日提醒。

提醒来源：
${sourceText}

相关 Memory：
${relatedNotesText}

要求：
1. title 不超过 15 个字，温柔、非催促。
2. whyNow 不超过 80 个字，说明“为什么现在”——基于上面的真实 Memory。
3. actionLabel 不超过 10 个字，例如“记录一句”。
4. 必须引用至少一条真实 Memory 作为证据，source 格式为 note:<id>。
5. 只基于提供的素材，禁止编造。
6. 不要使用祈使句，不要出现“应该”“必须”“赶快”。使用“也许……”“我注意到……”。
7. 如果素材不足，返回空字符串。

输出 ONLY 一个合法的 JSON 对象，严格匹配：
{
  "title": "给妈妈发消息",
  "whyNow": "你三天前担心她身体，也许今天可以问候一下。",
  "actionLabel": "记录一句",
  "evidence": [{ "quote": "原文引用", "source": "note:<id>" }]
}

规则：
- ${langHint}
- 不使用 deadline、due date、日历事件。
- 不展示 KPI、完成率。
`;
}

export function buildMockReminderOutput(candidate: ReminderCandidate): ReminderOutput {
  return {
    title: candidate.title.slice(0, 15),
    whyNow: "我注意到这个主题最近出现在你的记录里。",
    actionLabel: "记录一句",
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
