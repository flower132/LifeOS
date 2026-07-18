import { ObjectIntelligenceStrategy } from "./types";

/**
 * Place Intelligence（预留）: 地点相关记忆的模式。
 */
export const placeStrategy: ObjectIntelligenceStrategy = {
  promptInstructions: () => `这是一个【地点】对象。请重点分析：
1. summary：这个地点对用户的意义，2-3 句。
2. importantEvents：在此发生的重要事件。
3. insights：与这个地点相关的模式（如 每次来这里都会见同一个人）。
4. recentChanges：最近与此地相关的变化。`,
};
