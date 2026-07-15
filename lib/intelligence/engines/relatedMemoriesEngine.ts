import { RelatedMemory } from "../core/types";
import { relatedMemoriesOutputSchema } from "../schemas";

export function buildRelatedMemoriesPrompt(params: {
  targetNoteId: string;
  targetContent: string;
  otherNotesText: string;
  language: "zh" | "en";
}): string {
  const langHint = params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const shape = JSON.stringify(
    {
      relatedMemories: [
        {
          noteId: "note-id",
          reason: "三个月前，你也因为类似原因感到焦虑。",
          evidence: [{ quote: "原文引用", source: "note:<id>" }],
        },
      ],
    },
    null,
    2
  );

  return `你是一位温暖的 LifeOS Intelligence 助手。
请基于用户当前打开的 Memory 和其他 Memory，找到真正有关联的经历。
这不是关键词搜索，而是基于意义、情境、情绪的关联。

要求：
1. 最多返回 3 条最相关的 Memory。
2. 每条必须说明为什么相关。
3. 必须引用真实原文作为证据。
4. 如果没有找到有意义的关联，返回空数组 relatedMemories: []。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
- ${langHint}
- 用户未上传图片，仅分析文本内容。

当前 Memory：
${params.targetContent}

其他 Memory：
${params.otherNotesText}`;
}

export function mapRelatedMemoriesOutput(rawOutput: unknown): RelatedMemory[] {
  const parsed = relatedMemoriesOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.error("[Intelligence] Related memories parse error:", parsed.error);
    return [];
  }
  return parsed.data.relatedMemories;
}
