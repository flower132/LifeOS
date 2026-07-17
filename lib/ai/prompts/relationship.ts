import { Language } from "@/lib/i18n";
import { AdvisorContext, AdvisorObjectType } from "@/lib/ai/advisor/types";
import { ADVISOR_ROLES, buildAdvisorBaseContext } from "./advisorContext";

/**
 * RELATIONSHIP task prompt — Advisor Q&A over an object's memories/notes.
 */
export function buildAdvisorPrompt(
  context: AdvisorContext,
  question: string,
  language: Language
): string {
  const role = ADVISOR_ROLES[context.object.type as AdvisorObjectType] ?? "人生顾问";
  const langHint =
    language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const shape = JSON.stringify(
    {
      context: {
        content: "string: summary of the current background",
        evidence: [{ quote: "string", source: "note:<id> or memory:<id>" }],
      },
      whatINotice: {
        content: "string: patterns you noticed from the user's history",
        evidence: [{ quote: "string", source: "note:<id> or memory:<id>" }],
      },
      suggestion: {
        content:
          "string: gentle advice. If replying to a message, include a suggested reply after explaining why.",
        evidence: [{ quote: "string", source: "note:<id> or memory:<id>" }],
      },
      why: {
        content: "string: why this suggestion, citing memory / relationship / goal / project / time",
        evidence: [{ quote: "string", source: "note:<id> or memory:<id>" }],
      },
    },
    null,
    2
  );

  return `你是用户的 LifeOS ${role}。请基于以下用户数据回答问题。不要编造事实，不要给出脱离上下文的通用建议。

语气要求：
- 保持谦逊、温暖、安静，不制造焦虑。
- 不要使用"你应该"。
- 多使用"也许……"、"我注意到……"、"可能……"、"看起来……"。
- 每条建议、每个发现、每次推理都必须引用下方带 [note:<id>] 或 [memory:<id>] 的真实记录。

${buildAdvisorBaseContext(context)}

用户问题：
${question}

请输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
1. 每个 section 的 content 必须简洁、具体、基于用户数据。
2. evidence 数组中的 source 必须是引用格式：note:<id>、memory:<id>、relation:<id> 或 object:<id>。
3. quote 应该是引用记录中的原文片段或简要概括。
4. 如果数据不足，诚实说明，不要编造。
${langHint}`;
}
