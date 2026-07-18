import { Language } from "@/lib/i18n";

/**
 * MEMORY_EXTRACT task prompt — turn one raw input into structured knowledge:
 * type, entities, topics, emotions, insights, importance.
 */
export function buildMemoryExtractPrompt(params: {
  text: string;
  imageCount: number;
  knownPeople: string[];
  knownProjects: string[];
  knownGoals: string[];
  language: Language;
}): string {
  const langHint =
    params.language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";
  const imageHint =
    params.imageCount > 0
      ? `用户同时上传了 ${params.imageCount} 张图片（当前仅分析文本）。`
      : "用户未上传图片。";

  const knownList = [
    params.knownPeople.length > 0 ? `已知人物：${params.knownPeople.join("、")}` : "",
    params.knownProjects.length > 0 ? `已知项目：${params.knownProjects.join("、")}` : "",
    params.knownGoals.length > 0 ? `已知目标：${params.knownGoals.join("、")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const shape = JSON.stringify(
    {
      type: "event | note | conversation | reflection | decision | experience",
      summary: "string: 一句话总结，不超过40字",
      entities: {
        people: ["提到的人物名字，优先使用已知人物中的原词"],
        projects: ["提到的项目，优先使用已知项目中的原词"],
        goals: ["提到的目标，优先使用已知目标中的原词"],
        places: ["提到的地点"],
      },
      topics: ["主题标签，如 成本控制"],
      emotions: ["情绪标签，如 压力、开心；没有则为空数组"],
      insights: ["从内容中提炼的长期有效的认知，如 老板偏好风险控制；没有则为空数组"],
      relations: [
        {
          from: "关系起点：人物/对象名，用户本人写 我",
          to: "关系终点：人物/对象名",
          type: "family | friend | colleague | mentor | partner | custom",
          label: "关系语义，如 合作项目、准备；无法确定则省略",
          confidence: "0.0-1.0",
        },
      ],
      importance: "0.0-1.0，这条记录对用户人生的重要程度",
    },
    null,
    2
  );

  return `你是一位个人记忆理解引擎。请分析用户的一条记录，提取结构化知识。

输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
1. 只基于原文，禁止编造原文没有的信息。
2. people/projects/goals 必须是原文中真实提到的名称；如果与已知列表中的条目指同一对象，必须使用已知列表中的原词。
3. insights 只提炼对未来有长期价值的认知（偏好、习惯、规律）；当原文明确表达某人的态度倾向时，应提炼为 insight，例如"他觉得方案风险太高"→"老板偏好风险控制"。不要把事实复述当作 insight。
4. relations 只抽取原文明确体现的 人↔人 或 人↔对象 关系（如 我和小李是朋友、张伟参与 LifeOS 项目）；用户本人一律用"我"表示；没有明确关系时返回空数组。
5. importance 评估维度：是否涉及重要人物/目标/决策/强烈情绪/长期价值。
6. ${langHint}
7. ${imageHint}

${knownList ? `用户的已知对象：\n${knownList}\n\n` : ""}用户记录：
${params.text}`;
}
