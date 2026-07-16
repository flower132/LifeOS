import { CompanionContext } from "../types";
import { ReflectionOutput } from "../schemas";
import { Note } from "@/lib/types";
import { applyPenalty } from "../learning";

export interface ReflectionSeed {
  source: "memory" | "goal" | "project" | "relationship" | "self";
  id: string;
  note: Note;
}

export function buildReflectionPrompt(
  context: CompanionContext,
  seed: ReflectionSeed
): string {
  const langHint = context.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  return `你是一位温暖、安静、谦逊的 LifeOS 陪伴助手。
请基于下面这条真实记忆，为用户生成一个晚间反思问题。

[note:${seed.note.id}] ${seed.note.created_at}
${seed.note.content}

要求：
1. 问题不超过 40 个字。
2. 温暖、开放、不带评判。
3. 不要使用“应该”“必须”。
4. 把这条记忆与用户的价值、目标、关系或感受联系起来。
5. 必须引用上面的真实记忆作为证据，source 格式为 note:<id>。
6. 只基于提供的素材，禁止编造。

输出 ONLY 一个合法的 JSON 对象，严格匹配：
{
  "question": "...",
  "seedSource": "memory|goal|project|relationship|self",
  "seedId": "${seed.id}",
  "evidence": [{ "quote": "原文引用", "source": "note:<id>" }]
}

规则：
- ${langHint}
- 不出现 KPI、完成率、待办。
`;
}

export function buildMockReflectionOutput(seed: ReflectionSeed): ReflectionOutput {
  return {
    question: "今天这条记录，让你想到了什么？",
    seedSource: seed.source,
    seedId: seed.id,
    evidence: [
      {
        quote: seed.note.content.slice(0, 80),
        source: `note:${seed.note.id}`,
      },
    ],
  };
}

export function selectReflectionSeed(
  context: CompanionContext,
  existing: { seedId: string; status: string }[]
): ReflectionSeed | null {
  const now = Date.now();
  const recent = context.notes
    .slice()
    .filter((n) => {
      const days = (now - new Date(n.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (recent.length === 0) return null;

  // Prefer a note that hasn't already generated a pending reflection.
  const pendingIds = new Set(
    existing.filter((r) => r.status !== "dismissed").map((r) => r.seedId)
  );

  const buildSeed = (note: Note): ReflectionSeed => {
    if (note.object_id) {
      const obj = context.objects.find((o) => o.id === note.object_id);
      if (obj) {
        if (obj.type === "goal") return { source: "goal", id: obj.id, note };
        if (obj.type === "project") return { source: "project", id: obj.id, note };
        if (obj.type === "self") return { source: "self", id: obj.id, note };
        if (obj.type === "person") return { source: "relationship", id: obj.id, note };
      }
    }
    return { source: "memory", id: note.id, note };
  };

  const scored = recent.map((note) => {
    const seed = buildSeed(note);
    const days = (now - new Date(note.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = days <= 1 ? 30 : days <= 3 ? 20 : 10;
    const pendingPenalty = pendingIds.has(seed.id) ? -50 : 0;
    const score = applyPenalty(recencyScore + pendingPenalty, seed.id);
    return { seed, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.seed ?? null;
}
