import { ObjectIntelligenceStrategy } from "./types";

/**
 * Project Intelligence: 风险 / 卡点 / 进度 / 相关人物 / 下一步。
 */
export const projectStrategy: ObjectIntelligenceStrategy = {
  promptInstructions: () => `这是一个【项目】对象。请重点分析：
1. summary：项目当前进度与整体状态，2-4 句。
2. recentChanges：最近的进展与变化。
3. risk：项目风险与卡点（什么可能让项目失败或延期）。
4. opportunities：下一步建议与可以借力的机会。
5. insights：从项目历史中提炼的经验。
6. traits：项目的推进模式（如 冲刺-停滞循环）。
7. preferences：相关人员的协作偏好（如材料中可见）。`,
};
