import { Language } from "@/lib/i18n";

/**
 * SEARCH task prompt — RESERVED for semantic search over memories.
 * Pure prompt-string builder; no business logic.
 */
export function buildSearchPrompt(params: {
  query: string;
  candidatesText: string;
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const shape = JSON.stringify(
    {
      results: [
        {
          id: "string: the candidate id",
          reason: "string: why this matches the query semantically",
        },
      ],
    },
    null,
    2
  );

  return `你是一位温暖的 LifeOS 语义搜索助手。请基于用户的搜索意图，从候选 Memory 中找出真正相关的内容。这不是关键词匹配，而是基于意义、情境、情绪的匹配。${langHint}

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

搜索意图：
${params.query}

候选 Memory：
${params.candidatesText}`;
}
