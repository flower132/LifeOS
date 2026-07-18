import { LifeObject, Note } from "@/lib/types";
import { AIContext, SerializedContext } from "./types";
import { dedupeSources, noteSource, objectSource } from "./sources";

// ---------------------------------------------------------------------------
// Context Builder — serializes AIContext into a compact prompt block with a
// hard token budget. Sections are emitted by priority and trimmed when the
// budget runs out; [note:<id>] / [memory:<id>] tags stay intact so the model
// can cite sources.
// ---------------------------------------------------------------------------

/** Rough token estimate: ~1.5 chars/token for mixed zh/en text. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 1.5);
}

const NOTE_PREVIEW = 200;

function formatNote(note: Note): string {
  const date = note.created_at.slice(0, 10);
  const content =
    note.content.length > NOTE_PREVIEW
      ? `${note.content.slice(0, NOTE_PREVIEW)}…`
      : note.content;
  return `[note:${note.id}] ${date} ${content}`;
}

function formatObject(object: LifeObject): string {
  const lines = [`${object.name}（${object.type}）`];
  if (object.description) lines.push(`描述：${object.description}`);
  const props = Object.entries(object.properties ?? {})
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .slice(0, 8)
    .map(([k, v]) => `${k}: ${String(v)}`);
  if (props.length > 0) lines.push(`属性：${props.join("；")}`);
  const memories = (object.memories ?? []).slice(0, 5);
  if (memories.length > 0) {
    lines.push(
      `记忆：\n${memories.map((m) => `[memory:${m.id}] ${m.createdAt.slice(0, 10)} ${m.content}`).join("\n")}`
    );
  }
  return lines.join("\n");
}

/** Ordered section builders — earlier sections survive truncation. */
function buildSections(ctx: AIContext): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];

  if (ctx.objects.focus) {
    sections.push({
      title: "当前讨论对象",
      body: formatObject(ctx.objects.focus),
    });
  }

  if (ctx.memories.relevant.length > 0) {
    sections.push({
      title: "相关记忆（按相关度排序）",
      body: ctx.memories.relevant
        .map((m) => `${formatNote(m.note)} (相关度 ${m.score.toFixed(2)})`)
        .join("\n"),
    });
  }

  if (ctx.knowledge.lines.length > 0 || ctx.knowledge.longTermMemories.length > 0) {
    const parts: string[] = [];
    if (ctx.knowledge.lines.length > 0) {
      parts.push(`知识：\n${ctx.knowledge.lines.join("\n")}`);
    }
    if (ctx.knowledge.longTermMemories.length > 0) {
      parts.push(
        `长期记忆：\n${ctx.knowledge.longTermMemories
          .map((m) => `[memory:${m.id}] ${m.date} ${m.text}`)
          .join("\n")}`
      );
    }
    sections.push({ title: "长期记忆与知识", body: parts.join("\n") });
  }

  if (ctx.relationships.history.length > 0 && ctx.objects.focus) {
    sections.push({
      title: "历史互动",
      body: ctx.relationships.history.map(formatNote).join("\n"),
    });
  }

  if (ctx.relationships.relations.length > 0) {
    const names = new Map(
      [ctx.objects.focus, ...ctx.objects.relatedObjects, ...ctx.relationships.relatedPeople]
        .filter(Boolean)
        .map((o) => [o!.id, o!.name])
    );
    sections.push({
      title: "关系网络",
      body: ctx.relationships.relations
        .map((r) => {
          const other =
            names.get(r.target_object_id) ?? names.get(r.source_object_id) ?? "未知";
          const strength =
            r.strength !== undefined ? `（强度 ${Math.round(r.strength * 100)}%）` : "";
          return `${r.type} · ${other}${strength}`;
        })
        .join("\n"),
    });
  }

  if (ctx.goals.activeGoals.length > 0) {
    sections.push({
      title: "进行中的目标/项目",
      body: ctx.goals.activeGoals
        .map((g) => `${g.name}（${String(g.properties?.status ?? "进行中")}）`)
        .join("\n"),
    });
  }

  if (ctx.memories.recent.length > 0) {
    sections.push({
      title: "最近记录",
      body: ctx.memories.recent.map(formatNote).join("\n"),
    });
  }

  if (ctx.insights.previousInsights.length > 0) {
    sections.push({
      title: "历史洞察",
      body: ctx.insights.previousInsights.join("\n"),
    });
  }

  if (ctx.user.profile) {
    sections.push({
      title: "用户画像",
      body: JSON.stringify(ctx.user.profile).slice(0, 600),
    });
  }

  return sections;
}

/**
 * Serialize with a token budget. Sections are included whole until the
 * budget is exhausted; the final section is hard-truncated if needed.
 */
export function serializeContext(
  ctx: AIContext,
  budgetTokens: number
): SerializedContext {
  const header = `用户：${ctx.user.name ?? "当前用户"}`;
  const sections = buildSections(ctx);

  let block = header;
  let truncated = false;

  for (const section of sections) {
    const candidate = `${block}\n\n【${section.title}】\n${section.body}`;
    if (estimateTokens(candidate) <= budgetTokens) {
      block = candidate;
      continue;
    }
    // Try fitting a truncated version of this section.
    const headerPart = `${block}\n\n【${section.title}】\n`;
    const remainingChars = Math.floor((budgetTokens - estimateTokens(headerPart)) * 1.5);
    if (remainingChars > 200) {
      block = `${headerPart}${section.body.slice(0, remainingChars)}…（已截断）`;
    }
    truncated = true;
    break;
  }

  const sources = dedupeSources([
    ...(ctx.objects.focus ? [objectSource(ctx.objects.focus)] : []),
    ...ctx.memories.relevant.map((m) => noteSource(m.note)),
    ...ctx.memories.recent.map(noteSource),
    ...ctx.knowledge.longTermMemories.map((m) => ({
      kind: "memory" as const,
      id: m.id,
      label: m.text.slice(0, 60),
      date: m.date,
    })),
    ...ctx.goals.activeGoals.map(objectSource),
  ]);

  return {
    block,
    sources,
    truncated,
    estimatedTokens: estimateTokens(block),
  };
}
