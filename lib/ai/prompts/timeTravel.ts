import { Language } from "@/lib/i18n";
import { TimeSnapshot } from "@/lib/graph/timeline/types";

/**
 * TIME_TRAVEL task prompt — "如果回到那一天，你最应该做什么？"
 */
export function buildTimeTravelPrompt(params: {
  snapshot: TimeSnapshot;
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const { snapshot } = params;

  const goals = snapshot.activeGoals.map((g) => `${g.name}（${g.status}）`).join("、") || "（无）";
  const projects = snapshot.activeProjects.map((p) => `${p.name}（${p.status}）`).join("、") || "（无）";
  const people = snapshot.peopleContacted.map((p) => `${p.name}（${p.count}次）`).join("、") || "（无）";
  const memories = snapshot.memoriesThatWeek
    .slice(0, 8)
    .map((m) => `- ${m.date} ${m.text}`)
    .join("\n") || "（无）";

  return `你是用户的 LifeOS 时间旅行助手。用户正在回看 ${snapshot.date} 那一天的自己。请基于当天前后的真实记录，回答：如果回到那一天，你最应该做什么？

要求：
1. 只基于提供的当天数据，禁止编造。
2. 用第二人称、温柔的语气，3-5 句。
3. 给出一条具体、可执行的建议，并说明理由（引用当天记录）。
4. ${langHint}

${snapshot.date} 的快照：
- 进行中的目标：${goals}
- 进行中的项目：${projects}
- 当周联系的人：${people}
${snapshot.todayFocusTitle ? `- 当天今日焦点：${snapshot.todayFocusTitle}` : ""}
${snapshot.reflectionQuestion ? `- 当天反思问题：${snapshot.reflectionQuestion}` : ""}
- 当周记忆：
${memories}`;
}
