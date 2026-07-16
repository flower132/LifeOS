import { CompanionContext } from "../types";
import {
  TimelineOutput,
  WeeklyReviewOutput,
  MonthlyStoryOutput,
} from "../schemas";
import { getISOWeekBounds, getMonthBounds } from "../utils/date";
import { Note } from "@/lib/types";

function serializeNotes(notes: Note[]): string {
  if (notes.length === 0) return "（该周期没有 Memory）";
  return notes
    .map((n) => `[note:${n.id}] ${n.created_at}\n${n.content}`)
    .join("\n\n---\n\n");
}

function langHint(language: "zh" | "en"): string {
  return language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
}

// ── Daily Timeline ───────────────────────────────────────────────────────────

export function buildDailyTimelinePrompt(
  context: CompanionContext,
  date: string
): string {
  const notes = context.notes.filter((n) => n.created_at.startsWith(date));
  const notesText = serializeNotes(notes);

  const shape = JSON.stringify(
    {
      summary: "今天和妈妈通了电话，聊了近况，也提到她最近睡眠不太好。",
      evidence: [{ quote: "原文引用", source: "note:<id>" }],
    },
    null,
    2
  );

  return `你是一位温暖、安静、谦逊的 LifeOS 陪伴助手。
请基于用户 ${date} 的真实 Memory，生成一段简短的 Daily Timeline。
Daily Timeline 不是待办清单，而是用一句话温柔地概括这一天的主要主题或感受。

该日 Memory：
${notesText}

要求：
1. summary 不超过 150 个字。
2. 只基于真实提供的素材，禁止编造。
3. 必须引用至少一条真实 Memory 作为证据，source 格式为 note:<id>。
4. 语气温暖、平静、不带评判。
5. 如果没有该日 Memory，返回空字符串 summary: ""。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
- ${langHint(context.language)}
- 不出现 KPI、完成率、待办列表。
- 不使用“应该”“必须”等催促语言。`;
}

export function buildMockDailyTimelineOutput(
  notes: Note[]
): TimelineOutput {
  const note = notes[0];
  return {
    summary: note
      ? `这一天记录了：${note.content.slice(0, 60)}${note.content.length > 60 ? "……" : ""}`
      : "这一天没有记录。",
    evidence: note
      ? [
          {
            quote: note.content.slice(0, 120),
            source: `note:${note.id}`,
          },
        ]
      : [],
  };
}

// ── Weekly Review ────────────────────────────────────────────────────────────

export function buildWeeklyReviewPrompt(
  context: CompanionContext,
  weekKey: string
): string {
  const bounds = getISOWeekBounds(weekKey);
  const notes = bounds
    ? context.notes.filter(
        (n) => n.created_at >= bounds.from && n.created_at <= bounds.to
      )
    : [];
  const notesText = serializeNotes(notes);

  const shape = JSON.stringify(
    {
      mostImportantPerson: {
        name: "妈妈",
        objectId: "可选",
        reason: "这周和妈妈通了两次电话，她提到最近睡眠不太好。",
        evidence: [{ quote: "原文引用", source: "note:<id>" }],
      },
      mostImportantGoal: {
        name: "保持健康作息",
        objectId: "可选",
        reason: "这周多次记录到熬夜和疲惫，作息成了反复出现的主题。",
        evidence: [{ quote: "原文引用", source: "note:<id>" }],
      },
      growth: {
        statement: "这周开始主动记录情绪了，这比之前更细腻。",
        evidence: [{ quote: "原文引用", source: "note:<id>" }],
      },
      emotion: {
        statement: "整体有些疲惫，但也有被朋友关心的温暖时刻。",
        evidence: [{ quote: "原文引用", source: "note:<id>" }],
      },
      gratitude: {
        statement: "感谢朋友在我低落时发来的消息。",
        evidence: [{ quote: "原文引用", source: "note:<id>" }],
      },
    },
    null,
    2
  );

  return `你是一位温暖、安静、谦逊的 LifeOS 陪伴助手。
请基于用户 ${weekKey} 这一周的真实 Memory，生成一份温柔的 Weekly Review。
这不是绩效复盘，而是帮助用户看见这一周里重要的人、目标、成长、情绪与感激。

本周 Memory（${notes.length} 条）：
${notesText}

要求：
1. 每个字段都是可选的；如果素材不足，请返回空对象或不包含该字段。
2. mostImportantPerson / mostImportantGoal 的 reason 不超过 80 字。
3. growth / emotion / gratitude 的 statement 不超过 80 字。
4. 只基于真实提供的素材，禁止编造。
5. 每个非空字段必须引用至少一条真实 Memory 作为证据，source 格式为 note:<id>。
6. 语气温暖、谦逊、不带评判。
7. 如果没有本周 Memory，返回空对象 {}。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
- ${langHint(context.language)}
- 不出现 KPI、完成率、优先级、待办列表。
- 不与其他人比较。
- 不使用“应该”“必须”等催促语言。`;
}

export function buildMockWeeklyReviewOutput(
  notes: Note[]
): WeeklyReviewOutput {
  if (notes.length === 0) return {};
  const anchor = notes[0];
  return {
    emotion: {
      statement: "这一周有一些记录，整体情绪还需要更多素材才能看清。",
      evidence: [
        {
          quote: anchor.content.slice(0, 80),
          source: `note:${anchor.id}`,
        },
      ],
    },
    gratitude: {
      statement: "感谢你愿意持续记录自己的生活。",
      evidence: [
        {
          quote: anchor.content.slice(0, 80),
          source: `note:${anchor.id}`,
        },
      ],
    },
  };
}

// ── Monthly Story ────────────────────────────────────────────────────────────

export function buildMonthlyStoryPrompt(
  context: CompanionContext,
  monthKey: string
): string {
  const bounds = getMonthBounds(monthKey);
  const notes = bounds
    ? context.notes.filter(
        (n) => n.created_at >= bounds.from && n.created_at <= bounds.to
      )
    : [];
  const notesText = serializeNotes(notes);

  const shape = JSON.stringify(
    {
      story:
        "这个月，你在忙碌中仍然留出了一些给自己的时刻。几次记录里都提到想调整作息，虽然还没完全做到，但能看见这份在意本身就已经是一种温柔的开始。",
      evidence: [{ quote: "原文引用", source: "note:<id>" }],
    },
    null,
    2
  );

  return `你是一位温暖、安静、谦逊的 LifeOS 陪伴助手。
请基于用户 ${monthKey} 这个月的真实 Memory，生成一段 Monthly Story。
这不是月度总结或绩效报告，而是一段有温度的叙述，帮助用户连接这个月的人事、情绪与变化。

本月 Memory（${notes.length} 条）：
${notesText}

要求：
1. story 100-1500 字。
2. 只基于真实提供的素材，禁止编造。
3. 必须引用至少一条真实 Memory 作为证据，source 格式为 note:<id>。
4. 语气温暖、谦逊、不带评判，像一位老朋友在月底轻声讲述。
5. 如果没有本月 Memory，返回空字符串 story: ""。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
- ${langHint(context.language)}
- 不出现 KPI、完成率、优先级、待办列表。
- 不与其他人比较。
- 不使用“应该”“必须”等催促语言。`;
}

export function buildMockMonthlyStoryOutput(
  notes: Note[]
): MonthlyStoryOutput {
  if (notes.length === 0) {
    return { story: "", evidence: [] };
  }
  const anchor = notes[0];
  const preview = anchor.content.slice(0, 120);
  return {
    story: `这个月你留下了 ${notes.length} 条记录。其中一条写道："${preview}${anchor.content.length > 120 ? "……" : ""}"这些片段连在一起，正在慢慢勾勒出你这个月的生活轮廓。`,
    evidence: [
      {
        quote: preview,
        source: `note:${anchor.id}`,
      },
    ],
  };
}
