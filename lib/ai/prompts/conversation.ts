import { Language } from "@/lib/i18n";

/**
 * CONVERSATION task prompt — RESERVED for the future conversation feature.
 * Pure prompt-string builder; no business logic.
 */
export function buildConversationPrompt(params: {
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const transcript = params.history
    .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
    .join("\n");

  return `你是用户的 LifeOS 陪伴对话助手。请基于对话历史温柔、简洁地回复。${langHint}

对话历史：
${transcript || "（无历史对话）"}

用户：
${params.userMessage}`;
}
