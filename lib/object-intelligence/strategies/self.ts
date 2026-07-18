import { ObjectIntelligenceStrategy } from "./types";

/**
 * Self Intelligence: 用户自己的状态 / 模式 / 成长建议。
 */
export const selfStrategy: ObjectIntelligenceStrategy = {
  promptInstructions: () => `这是用户的【自我】对象。请重点分析：
1. summary：用户最近的整体状态（情绪、精力、关注点），3-5 句。
2. recentChanges：最近的变化（如 压力明显增加、睡眠下降、效率提升）。
3. insights：关于用户的长期模式认知。
4. risk：需要警惕的状态（如 持续过劳信号）。
5. opportunities：给用户的建议（如 增加休息）。
6. traits：用户的行为特质。
7. preferences：用户的偏好与价值观（如材料中可见）。`,
};
