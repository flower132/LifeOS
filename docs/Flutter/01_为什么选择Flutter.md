# 01_为什么选择 Flutter

## 1. 为什么未来需要 Flutter

LifeOS 的长期目标是成为用户每天随身携带的 Relationship Guardian。PWA 虽然可以快速迭代、低成本验证产品方向，但在消费级 AI 产品中，原生移动端体验 eventually 是不可替代的。

未来选择 Flutter 的核心原因：

| 原因 | 说明 |
|------|------|
| **跨平台一致性** | 一套代码同时覆盖 iOS 与 Android，避免维护两套原生代码。 |
| **接近原生的体验** | 相比 PWA，Flutter 能提供更流畅的动画、手势、Haptic Feedback、原生组件感。 |
| **系统级能力** | 原生推送、后台任务、本地通知、Widget、Shortcuts、深度链接等，PWA 受限较多。 |
| **离线能力** | Flutter 可以更好地管理本地缓存与离线状态，适合 Memory Capture 场景。 |
| **长期可控性** | 不依赖 Apple/Google 对 PWA 策略的变化，拥有自己的发布渠道。 |
| **品牌体验** | 消费级产品最终需要在主屏幕上占有一席之地，原生 App 更符合用户心智。 |

## 2. Flutter 与当前 PWA 的关系

Flutter 不是 PWA 的替代，而是 PWA 验证成功后的自然延伸。

```
当前阶段：
PWA = 唯一开发产品
      ↓
      验证产品方向
      稳定数据模型
      定型 AI Prompt
      积累真实用户
      ↓
未来阶段：
Flutter = 原生移动端产品
          与 PWA 共享 Backend + Database
          提供更深度、更安静的系统级守护体验
```

关系要点：

- **共享 Backend API**：Flutter 不独立开发 AI 逻辑，统一调用 PWA 同源 Backend。
- **共享 Database Schema**：数据模型先由 PWA 验证，Flutter 复用同一套设计。
- **品牌与产品体验一致**：Flutter 是 PWA 的移动原生增强版，不是重新设计的产品。
- **用户数据迁移**：PWA 用户未来可无缝迁移到 Flutter App。

## 3. 为什么现在暂时不开发

当前阶段，Flutter 开发会分散产品验证所需的核心资源。

| 风险 | 说明 |
|------|------|
| **方向未验证** | 如果 PWA MVP 验证失败，Flutter 的开发投入将大量浪费。 |
| **数据模型不稳定** | 在 AI、Memory、Reminder 等核心模型未定型的阶段，原生开发会反复重构。 |
| **维护两套代码** | 同时维护 PWA 与 Flutter，会严重拖慢迭代速度。 |
| **分发成本高** | App Store / Google Play 审核、更新、反馈周期远高于 PWA。 |
| **AI Prompt 未定** | Flutter 的 AI 体验依赖后端 Prompt 与模型策略，现在开发前端为时过早。 |
| **资源聚焦** | 小团队应把所有精力集中在验证核心假设上。 |

## 4. 什么时候正式启动 Flutter

必须同时满足以下条件：

1. **PWA MVP 完成**
   - Today One Thing
   - Why Now Engine
   - One-Tap Action
   - Memory Capture（语音/文字）
   - Relationship Memory（后台）
   - AI Chat（基于长期关系上下文）

2. **已有真实用户验证产品价值**
   - 7 日留存率达到可接受水平
   - Today One Thing 执行率达到目标
   - 有用户主动记录 Memory 并形成习惯

3. **核心数据模型稳定**
   - Person / Memory / Reminder / Timeline / AI Conversation / Settings 模型不再大幅变动
   - 数据库 Schema 经历至少一轮真实使用验证

4. **AI Prompt 基本定型**
   - Why Now Engine 的 Prompt 策略稳定
   - AI Chat 的上下文管理方案稳定
   - 模型调用成本与效果达到可接受平衡

5. **产品进入正式移动端发布阶段**
   - 团队决定 LifeOS 需要以原生 App 形态进入市场
   - 拥有足够的开发资源维护 Flutter 代码
   - 准备承担 App Store / Google Play 的发布与运营成本

## 5. 当前阶段 Flutter 的任务

在正式启动之前，Flutter 只进行文档沉淀：

- 架构设计
- 数据库设计
- AI 架构设计
- UI 设计规范
- 推送方案
- 上线准备清单
- 开发路线图

这些文档确保当 Flutter 正式启动时，团队可以基于已经验证过的 PWA 产品快速、正确地构建原生 App。

## 6. 总结

Flutter 是 LifeOS 的远期移动形态，不是当前开发重点。现在把所有资源投入 PWA，用最低成本验证产品方向。当 PWA 证明用户真正需要 LifeOS 时，再用 Flutter 把体验提升到原生级别。

> **PWA 验证方向，Flutter 放大体验。**
