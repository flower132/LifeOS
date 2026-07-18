import { ObjectIntelligenceStrategy } from "./types";

/**
 * Person Intelligence: 人物画像 / 关系总结 / 沟通建议 / 最近变化。
 */
export const personStrategy: ObjectIntelligenceStrategy = {
  promptInstructions: () => `这是一个【人物】对象。请重点分析：
1. summary：一段人物画像（性格、做事风格、当前状态），3-5 句。
2. traits：稳定特质（如 理性、谨慎）。
3. preferences：偏好（如 偏好风险控制、喜欢直接沟通）。
4. relationshipSummary：此人与用户的关系状态（合作频率、沟通质量、近期分歧）。
5. communicationStyle：与此人沟通的建议（先讲什么、避免什么）。
6. recentChanges：最近的变化（新角色、新压力、新动向）。
7. insights：对长期相处有价值的认知。
8. risk：关系中需要注意的地方。
9. opportunities：可以加深关系/合作的方向。`,
};
