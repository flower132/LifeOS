import { Language } from "@/lib/i18n";
import { propertiesToPromptContext } from "@/lib/objectProperties";
import { AdvisorContext, AdvisorObjectType } from "./types";

const ADVISOR_ROLES: Record<AdvisorObjectType, string> = {
  person: "关系经营顾问",
  goal: "目标规划顾问",
  project: "项目管理顾问",
  self: "自我成长顾问",
};

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function serializeObject(object: AdvisorContext["object"]): string {
  const parts = [
    `对象名称：${object.name}`,
    `对象类型：${object.type}`,
  ];

  if (object.description) {
    parts.push(`对象描述：${object.description}`);
  }

  const propertiesContext = propertiesToPromptContext(
    object.type,
    object.properties
  );
  if (propertiesContext) {
    parts.push(`对象属性：\n${propertiesContext}`);
  }

  if (object.aiProfile) {
    parts.push(`AI 画像：\n${JSON.stringify(object.aiProfile, null, 2)}`);
  }

  return parts.join("\n");
}

function serializeMemories(object: AdvisorContext["object"]): string {
  const memories = object.memories ?? [];
  if (memories.length === 0) return "（无记忆）";
  return memories
    .map(
      (m) =>
        `[memory:${m.id}] ${formatDate(m.createdAt)}\n${m.content}`
    )
    .join("\n---\n");
}

function serializeNotes(notes: AdvisorContext["notes"]): string {
  if (notes.length === 0) return "（无笔记）";
  return notes
    .map(
      (n) =>
        `[note:${n.id}] ${formatDate(n.created_at)}\n${n.content}`
    )
    .join("\n---\n");
}

function serializeRelations(
  relations: AdvisorContext["relations"],
  relatedObjects: AdvisorContext["relatedObjects"]
): string {
  if (relations.length === 0) return "（无关系）";
  return relations
    .map((r) => {
      const otherId =
        r.source_object_id === r.target_object_id
          ? r.source_object_id
          : r.source_object_id;
      const other = relatedObjects.find((o) => o.id === otherId);
      const otherName = other?.name ?? "未知对象";
      const lines = [
        `[relation:${r.id}] ${r.type} with ${otherName}`,
      ];
      if (r.strength !== undefined) {
        lines.push(`强度：${Math.round(r.strength * 100)}%`);
      }
      if (r.note) {
        lines.push(`备注：${r.note}`);
      }
      return lines.join("\n");
    })
    .join("\n---\n");
}

function buildBaseContext(context: AdvisorContext): string {
  return `${serializeObject(context.object)}

相关记忆：
${serializeMemories(context.object)}

历史笔记：
${serializeNotes(context.notes)}

关系网络：
${serializeRelations(context.relations, context.relatedObjects)}`;
}

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

${buildBaseContext(context)}

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

${buildBaseContext(context)}

请输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
1. narrative 控制在 120 字以内或 3-5 行。
2. maybeToday 是一句轻柔的今日建议。
3. evidence 数组中的 source 必须是引用格式：note:<id>、memory:<id>、relation:<id> 或 object:<id>。
4. 如果数据不足，返回空 narrative 和空 evidence，不要编造。
${langHint}`;
}
