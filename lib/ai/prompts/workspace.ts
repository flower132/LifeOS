import { Language } from "@/lib/i18n";
import { AdvisorContext, AdvisorObjectType } from "@/lib/ai/advisor/types";
import { ADVISOR_ROLES, buildAdvisorBaseContext } from "./advisorContext";

/**
 * WORKSPACE task prompt — gentle home insight for the default focus object.
 */
export function buildHomeInsightPrompt(
  context: AdvisorContext,
  language: Language
): string {
  const role = ADVISOR_ROLES[context.object.type as AdvisorObjectType] ?? "人生顾问";
  const langHint =
    language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  const shape = JSON.stringify(
    {
      narrative:
        "string: a short, gentle insight about this object based on memories and notes. 120 characters or 3-5 lines.",
      maybeToday:
        "string: a soft, actionable suggestion for today, e.g. '也许今天可以……'",
      evidence: [{ quote: "string", source: "note:<id> or memory:<id>" }],
    },
    null,
    2
  );

  return `你是用户的 LifeOS ${role}。请基于以下用户数据，生成一段温和的 Insight。

语气要求：
- 保持谦逊、温暖、安静，不制造焦虑。
- 不要使用"你应该"。
- 多使用"也许……"、"我注意到……"、"可能……"、"看起来……"。
- Insight 和今日建议都必须引用下方带 [note:<id>] 或 [memory:<id>] 的真实记录。
- 不要显示完成百分比、KPI、Dashboard。

${buildAdvisorBaseContext(context)}

请输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
1. narrative 控制在 120 字以内或 3-5 行。
2. maybeToday 是一句轻柔的今日建议。
3. evidence 数组中的 source 必须是引用格式：note:<id>、memory:<id>、relation:<id> 或 object:<id>。
4. 如果数据不足，返回空 narrative 和空 evidence，不要编造。
${langHint}`;
}
