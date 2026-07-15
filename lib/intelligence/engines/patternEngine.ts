import { v4 as uuidv4 } from "uuid";
import { IntelligencePattern, Note } from "@/lib/types";
import { PatternEngineInput } from "../core/types";
import { PatternOutput, patternOutputSchema } from "../schemas";

function buildPrompt(input: PatternEngineInput): string {
  const langHint = input.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const notesText = input.notes
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((n) => `[note:${n.id}] ${new Date(n.created_at).toISOString()}\n${n.content}`)
    .join("\n\n---\n\n");

  const selfMemories = input.self.memories
    ?.map((m) => `[memory:${m.id}] ${m.createdAt}\n${m.content}`)
    .join("\n\n---\n\n") ?? "";

  const recentHint = input.recentNoteIds?.length
    ? `最近新增的 Memory IDs: ${input.recentNoteIds.join(", ")}。请特别关注这些新 Memory 是否揭示了新 Pattern 或更新了已有 Pattern。`
    : "";

  const shape = JSON.stringify(
    {
      patterns: [
        {
          title: "示例：每次面试前都会大量记录学习",
          description: "自然语言说明这个模式在什么情境下出现、持续多久、如何体现",
          category: "behavior",
          firstSeenAt: "2024-01-01T00:00:00.000Z",
          lastSeenAt: "2024-06-01T00:00:00.000Z",
          frequency: "recurring",
          confidence: 0.85,
          evidence: [{ quote: "一段原文引用", source: "note:<id>" }],
          noteIds: ["note-id-1", "note-id-2"],
        },
      ],
    },
    null,
    2
  );

  return `你是一位温暖的 LifeOS Intelligence 助手，专门发现用户生活中的重复模式。
请基于用户提供的真实 Memory 素材，输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

分析要求：
1. 只从真实提供的素材中发现模式，禁止编造。
2. 数据不足时返回空数组 patterns: []。
3. 模式必须有时间跨度（firstSeenAt / lastSeenAt）。
4. 每条 pattern 必须包含 evidence，引用 note:<id> 或 memory:<id>。
5. 不要输出评分、等级、排行榜或 KPI。
6. 关注情绪、行为、关系、决策、目标、健康、工作等方面的重复出现。
7. 如果某个模式最近被强化或减弱，请在 frequency 中体现。

规则：
- ${langHint}
- 用户未上传图片，仅分析文本内容。
- confidence 为 0-1 之间的小数。
- category 必须是 emotion, behavior, relationship, decision, goal, health, work 之一。
- frequency 必须是 recurring, spike, declining, stable 之一。
${recentHint}

素材：
${notesText ? `Notes:\n${notesText}` : "（未提供 Notes）"}

${selfMemories ? `Self Memories:\n${selfMemories}` : ""}`;
}

function mapPatternOutput(output: PatternOutput, existingPatterns: IntelligencePattern[]): IntelligencePattern[] {
  const now = new Date().toISOString();
  return output.patterns.map((p) => {
    const existing = existingPatterns.find(
      (ep) => ep.title === p.title && ep.category === p.category
    );
    return {
      id: existing?.id ?? uuidv4(),
      title: p.title,
      description: p.description,
      category: p.category,
      firstSeenAt: existing ? minDate(existing.firstSeenAt, p.firstSeenAt) : p.firstSeenAt,
      lastSeenAt: existing ? maxDate(existing.lastSeenAt, p.lastSeenAt) : p.lastSeenAt,
      frequency: p.frequency,
      confidence: p.confidence,
      evidence: mergeEvidence(existing?.evidence ?? [], p.evidence),
      noteIds: mergeNoteIds(existing?.noteIds ?? [], p.noteIds),
      status: existing?.status ?? "active",
      userFeedback: existing?.userFeedback,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  });
}

function minDate(a: string, b: string): string {
  return new Date(a) < new Date(b) ? a : b;
}

function maxDate(a: string, b: string): string {
  return new Date(a) > new Date(b) ? a : b;
}

function mergeEvidence(existing: { quote: string; source: string }[], incoming: { quote: string; source: string }[]): { quote: string; source: string }[] {
  const seen = new Set(existing.map((e) => `${e.source}:${e.quote}`));
  const merged = [...existing];
  for (const e of incoming) {
    const key = `${e.source}:${e.quote}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(e);
    }
  }
  return merged;
}

function mergeNoteIds(existing: string[], incoming: string[]): string[] {
  const set = new Set([...existing, ...incoming]);
  return Array.from(set);
}

export async function discoverPatterns(
  rawOutput: unknown,
  input: PatternEngineInput,
  existingPatterns: IntelligencePattern[]
): Promise<IntelligencePattern[]> {
  const parsed = patternOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.error("[Intelligence] Pattern output parse error:", parsed.error);
    return [];
  }
  return mapPatternOutput(parsed.data, existingPatterns);
}

export function buildPatternPrompt(input: PatternEngineInput): string {
  return buildPrompt(input);
}

export function serializeNotesForPattern(notes: Note[]): string {
  return notes
    .map((n) => `[note:${n.id}] ${n.created_at}\n${n.content}`)
    .join("\n\n---\n\n");
}
