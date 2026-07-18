import { ObjectIntelligenceStrategy } from "./types";

/**
 * Goal Intelligence: 进展 / 阻碍 / 下一步建议。
 */
export const goalStrategy: ObjectIntelligenceStrategy = {
  promptInstructions: () => `这是一个【目标】对象。请重点分析：
1. summary：目标的当前状态（进展、势头），2-4 句。
2. recentChanges：最近的进展或停滞信号。
3. insights：为什么推进顺利/停滞的原因分析（如 最近两周没有推进，主要原因是工作时间增加）。
4. risk：阻碍与风险（是什么在阻止目标完成）。
5. opportunities：下一步建议（具体、可执行，如 每天安排30分钟）。
6. traits：用户推进此目标的行为模式。
7. preferences：用户在此目标上的偏好（如有）。`,
};
