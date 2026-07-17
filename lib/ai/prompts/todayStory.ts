import { TodayStoryEngineInput } from "@/lib/intelligence/core/types";

/**
 * TODAY_STORY task prompt — connect today's memories with the past.
 */
export function buildTodayStoryPrompt(input: TodayStoryEngineInput): string {
  const langHint = input.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const today = input.date;
  const name = input.self?.name?.trim();
  const nameRule = name
    ? input.language === "zh"
      ? `用户名字是“${name}”，如果合适，请在问候语中自然地称呼用户，例如“早上好，${name}”。`
      : `The user's name is "${name}". If appropriate, address them naturally in the greeting, e.g. "Good morning, ${name}".`
    : "";

  const todayNotes = input.notes.filter((n) => n.created_at.startsWith(today));
  const pastNotes = input.notes.filter((n) => !n.created_at.startsWith(today));

  const todayText = todayNotes
    .map((n) => `[note:${n.id}] ${n.content}`)
    .join("\n\n---\n\n");

  const pastText = pastNotes
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30)
    .map((n) => `[note:${n.id}] ${n.created_at}\n${n.content}`)
    .join("\n\n---\n\n");

  const shape = JSON.stringify(
    {
      story: "今天准备联系妈妈，与你三天前提到担心她身体有关。",
      greeting: "早上好，今天可能会想起妈妈。",
      evidence: [{ quote: "原文引用", source: "note:<id>" }],
    },
    null,
    2
  );

  return `你是一位温暖的 LifeOS Intelligence 助手。
请基于用户今天的 Memory 和过去真实 Memory，生成一句 Today's Story 和一句 Morning Greeting。
Today's Story 不是 Summary，而是帮助用户连接过去和今天的一句话。
Morning Greeting 是一个温暖、简短的开场，可以引用今天可能想起的人或事。

要求：
1. 只基于真实提供的素材，禁止编造。
2. 必须引用至少一条真实 Memory 作为证据。
3. 句子要温暖、自然、简短。
4. 如果没有今天的 Memory，或无法找到关联，返回空字符串 story: ""。
5. 如果无法生成合适的问候语，返回空字符串 greeting: ""。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
- ${langHint}
${nameRule ? `- ${nameRule}\n` : ""}- 用户未上传图片，仅分析文本内容。
- 不要使用祈使句，不要出现“应该”。

今天的 Memory（${today}）：
${todayText || "（今天没有 Memory）"}

过去的 Memory（按时间倒序）：
${pastText || "（没有过去的 Memory）"}`;
}
