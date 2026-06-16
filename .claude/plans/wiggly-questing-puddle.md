# LifeOS v1.1 稳定版 — 稳定性审计与修复计划

## 上下文

LifeOS 是一个基于 Next.js 16 App Router + TypeScript + Zustand + localStorage + Tailwind v4 的 PWA 应用。当前版本已具备 Object、Note、Relation、Tag、AI Insight 等核心能力，但在**数据持久化安全、Hydration 一致性、Settings 完整性、PWA 缓存策略、错误保护、数据校验、性能优化**等方面存在隐患。

本计划目标：在不推翻现有架构、不删除功能、不大规模重构的前提下，将 LifeOS 升级到 **v1.1 稳定版**，为后续 AI 世界模型、人生时间轴、关系图谱等功能提供可靠基础。

---

## 第一阶段：项目全局体检（输出《LifeOS项目健康报告》）

### 1. 项目目录结构

```
app/
  layout.tsx              # Root layout (server), html lang 硬编码 zh-CN
  page.tsx                # 服务端重定向 /home
  home/page.tsx           # 首页（真实功能）
  objects/page.tsx        # Object 列表（真实功能）
  objects/[id]/page.tsx   # Object 详情（真实功能）
  create-object/page.tsx  # 创建 Object（真实功能）
  create-note/page.tsx    # 创建 Note（真实功能）
  settings/page.tsx       # 设置页（仅语言/主题可用，其余为静态占位）
components/
  layout/AppShell.tsx     # Sidebar + BottomNav
  ClientProviders.tsx     # Store hydration + theme + SW 注册
  object/*                # ObjectCard/ObjectForm/ObjectList/ObjectTypeBadge
  note/*                  # NoteCard/NoteForm/NoteTimeline
  relation/*              # RelationForm/RelationList
  tag/*                   # TagBadge/TagSelect
  capture/QuickCapture.tsx
  ai/*                    # AI Insight cards
lib/
  storage/                # localStorageAdapter + supabaseAdapter(占位) + types
  ai/                     # AI provider selector + mock/openai/anthropic
  i18n.ts, useTranslation.ts
  types.ts, utils.ts
stores/                   # 5 个 Zustand stores
public/
  manifest.json, sw.js, icons/
```

### 2. 已实现模块

- Object CRUD、列表、详情
- Note 创建、关联 Object、时间线
- Relation 创建、列表
- Tag 创建、选择、模糊搜索、多选、Chip 展示
- 语言切换（zh/en）
- 主题切换（light/dark）
- AI Insight 卡片（person/self/event/goal/idea）
- PWA manifest + service worker（基础版）

### 3. 未实现/不完整模块

- Settings：数据导出、清空缓存、存储占用、AI 设置、主题色
- System 主题偏好
- 数据版本迁移机制
- 数据完整性校验层
- React Error Boundary
- 开发调试面板
- PWA 缓存版本化策略

### 4. 假页面/假按钮/假数据

- `app/settings/page.tsx` 中 Storage、About 区块为纯静态文本，无交互
- AI Insight cards 在 API 失败时返回硬编码 mock 文案，且无用户提示
- `QuickCapture.tsx` 使用硬编码英文文案，未接入 i18n

### 5. 未接通的 Store/路由

- 各 store 均有 `load()`，但无统一 `hydrate()/persist()` 命名
- `settingsStore` 直接读写 `window.localStorage`，未走 storage adapter 抽象
- SupabaseAdapter 为占位实现：若用户设置 env var，所有操作会抛错崩溃

### 6. 数据丢失风险

- `localStorageAdapter.getItem` 在 JSON 损坏时静默返回默认值，用户数据无声丢失
- 写操作前无备份
- 无 storage_version，未来 schema 变更无法迁移
- 无 localStorage 容量超限处理

### 7. Hydration 风险

- `app/layout.tsx` 硬编码 `lang="zh-CN"`，与 settingsStore 实际语言可能不一致
- 各 store 初始状态为空，`loaded: false`，首屏必现 skeleton flash
- `settingsStore.load()` 在 `useLayoutEffect` 中完成，但其它 store 为 fire-and-forget

---

## 第二阶段：状态管理修复

目标：Zustand 为唯一数据源，所有 CRUD 通过 Store 完成。

当前状态：Object/Note/Tag/Relation 已通过各自 store 管理，未发现组件用 `useState` 重复维护同类数据。需要做的是：

1. **统一 hydrate/persist 语义**
   - 每个 store 保留 `load()` 作为 hydrate，但增加显式 `persist()` / `rehydrate()` 别名或统一调用入口。
   - 在 `stores/index.ts` 导出 `hydrateStores()` / `persistStores()` 辅助函数。
2. **settingsStore 接入统一 storage 抽象**
   - 在 `StorageAdapter` 接口中新增 `getSettings()` / `setSettings()`。
   - `settingsStore` 通过 `storage` 读写，而不是直接访问 `window.localStorage`。
3. **移除冗余加载调用**
   - `TagSelect.tsx` 中的 `useEffect(load)` 保留安全版本，但增加 `loaded` / `_loading` 互斥，避免 ClientProviders 与组件双重触发。

---

## 第三阶段：数据持久化修复

目标：Object/Note/Tag/Relation/Settings 刷新、关闭浏览器后均不丢失。

### 具体改动

1. **Supabase 陷阱修复** (`lib/storage/index.ts`)
   - 当前若 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 同时存在，会返回未实现的 `SupabaseAdapter`，导致应用完全不可用。
   - **修复**：暂时无条件返回 `LocalStorageAdapter`；若检测到 Supabase env var，打印 warning 说明未实现并 fallback。

2. **Storage Version 与 Migration** (`lib/storage/localStorageAdapter.ts`)
   - 增加 `STORAGE_VERSION = 1` 常量。
   - localStorage key 增加版本前缀或独立 `__lifeos_version__` key。
   - `load()` 时检查版本，若旧版本则执行迁移函数（目前 v0→v1 为空迁移，占位未来扩展）。

3. **数据备份机制** (`lib/storage/localStorageAdapter.ts`)
   - 每次写操作（create/update/delete）前对旧数据做快照，key 为 `${key}_backup_${timestamp}`。
   - 每类数据最多保留 3 份备份，防止无限增长。

4. **损坏数据不静默丢失**
   - `getItem` 解析失败时不再静默返回 default，而是 `console.error` 并返回 default；后续 ErrorBoundary/Settings 可给出用户提示。

5. **容量保护**
   - `setItem` 捕获 `QuotaExceededError`，抛出可识别错误，store catch 后设置 `error` 状态。

---

## 第四阶段：Hydration 修复

目标：控制台无任何 Hydration Warning，首屏不闪错误内容。

### 具体改动

1. **html lang 动态同步**
   - `app/layout.tsx` 默认 `lang="en"`（与 settingsStore 默认值一致）。
   - `ClientProviders.tsx` 在 `useSettingsStore.load()` 完成后设置 `document.documentElement.lang` 为 `zh-CN` 或 `en`。
   - 在 `<html>` 标签添加 `suppressHydrationWarning`。

2. **Theme 应用时机**
   - `ClientProviders.tsx` 中 settings 加载完成前，先应用默认 light 主题；加载完成后应用持久化主题。
   - 支持 System 主题：首次加载时检测 `window.matchMedia('(prefers-color-scheme: dark)')`。

3. **Store 加载状态收敛**
   - 所有 store 增加 `_loading` 标志，防止 StrictMode 或组件副作用重复触发 `load()`。
   - `ClientProviders.tsx` 统一 await 或顺序触发所有 store load，错误统一 catch。

---

## 第五阶段：路由系统审计

目标：所有导航真实可用。

### 具体改动

1. **确认页面存在**
   - `/home`、`/objects`、`/objects/[id]`、`/create-object`、`/create-note`、`/settings` 均存在且功能正常。
2. **修复移动端 Settings 入口**
   - `AppShell.tsx` 的 bottom nav 目前只有 create-note/objects/home/create-object，缺少 Settings。
   - 在 desktop sidebar 已存在 Settings 链接；为 mobile bottom nav 增加 Settings 入口（或改为 5 项：Home、Objects、New Note、New Object、Settings）。
3. **检查所有 Link/router.push**
   - 确认无 404 目标。
   - `ObjectForm` 创建成功后 `router.push(/objects/${created.id})` 正常。

---

## 第六阶段：Object 系统修复

目标：创建/编辑/删除/查看均稳定。

### 具体改动

1. **ObjectForm 提交修复**
   - 移除 submit button 上冗余的 `onClick={() => void handleSubmit()}`，仅保留 form `onSubmit`。
2. **Object 详情空状态/错误状态**
   - `objects/[id]/page.tsx` 已处理 `object` 不存在的情况，显示友好提示。
   - 为 AI Insight 卡片包裹 ErrorBoundary，避免 Insight 异常导致整个详情页崩溃。
3. **删除级联完整性**
   - `LocalStorageAdapter.deleteObject` 已级联删除 notes/relations 并重新计算 tag usage，保持不变。

---

## 第七阶段：Tag 系统重建

当前 TagSelect 实际上已具备模糊搜索、创建、多选、删除 Chip 等功能。需要修复的是：

1. **移除冗余加载**
   - `TagSelect` 中的 `useEffect` 加载增加 `_loading` 互斥，避免重复。
2. **保证全局 Tag 库持久化**
   - 创建新 tag 时通过 `tagStore.addTag` 写入 localStorage；object.tag_ids 通过 `objectStore.updateObject` 写入。
   - 当前实现已满足，只需确保 object 更新时 tag usage 重新计算（adapter 已做）。
3. **不存在灰色不可点击状态**
   - 检查 TagSelect 所有交互元素均有 `type="button"`、无 `disabled` 导致不可点击的问题。
4. **Tag 验证**
   - 在 adapter 写入前校验 `name` 非空。

---

## 第八阶段：Settings 系统修复

目标：完整、可用、持久化。

### 具体改动

1. **语言 Language**
   - 保持 zh/en 切换，同步 html lang。
2. **主题 Theme**
   - Light / Dark / System 三选一。
   - System 时监听 `prefers-color-scheme` 变化。
3. **主题色 Accent Color**
   - Blue / Green / Purple / Orange 四选一。
   - 通过 CSS 变量 `--accent` / `--accent-foreground` 控制主要按钮、焦点环、品牌色。
   - Tailwind v4 中使用 `bg-[var(--accent)]` 等工具类或自定义 utility。
4. **数据管理 Data**
   - 导出数据：打包 objects/notes/relations/tags/settings 为 JSON 文件下载。
   - 清空缓存：confirm 确认后清除所有 localStorage lifeos keys，刷新页面。
   - 查看存储占用：遍历 localStorage 中 lifeos_ 前缀 key，计算总字节数并显示 KB。
5. **AI 设置**
   - AI 开关：控制是否调用 AI provider；关闭时 Insight cards 不请求。
   - 隐私模式：开启后禁用所有外部 AI API，强制使用 mock provider。
   - 模型选择：OpenAI / Anthropic / Mock（仅展示，实际 API key 仍由 env 决定，避免在浏览器存储敏感 key）。
6. **所有设置写入 settingsStore，持久化到 localStorage。**

---

## 第九阶段：错误保护机制

### 具体改动

1. **新增 `components/ErrorBoundary.tsx`**
   - React class component，捕获 render 错误。
   - fallback UI 包含错误信息、重试按钮、返回首页链接。
2. **在 `app/layout.tsx` 包裹 `<ErrorBoundary>`**
   - 任何子树崩溃不会导致整个应用白屏。
3. **Store 错误状态**
   - 各 store 增加 `error?: string`。
   - adapter 抛错时 store catch 并设置 error，UI 可展示。
4. **localStorage 损坏保护**
   - adapter 解析失败时记录错误，ErrorBoundary 不触发（因为返回空数组是安全值），但可在 Settings/Data 中提示用户。

---

## 第十阶段：PWA 稳定性修复

### 具体改动

1. **Service Worker 版本化**
   - `public/sw.js` 中 `CACHE_NAME` 改为动态版本，例如从 `self.location.search` 读取 `?v=BUILD_ID`。
   - `ClientProviders.tsx` 注册 SW 时传递 `?v=${process.env.NEXT_PUBLIC_BUILD_ID}`。
   - 在 `next.config.ts` 中注入 `NEXT_PUBLIC_BUILD_ID: Date.now().toString()` 或 git hash。
2. **缓存策略优化**
   - 保持 cache-first + 网络回源；导航请求离线 fallback 到 `/home`。
3. **Manifest 图标修复**
   - `public/icons/icon-512x512.svg` 当前 viewBox 为 192×192，修正为 512×512。
   - 保持 SVG，确保不同平台渲染正确。

---

## 第十一阶段：性能优化

目标：1000+ Object 仍流畅。

### 具体改动

1. **Zustand selector**
   - `ObjectCard` 已通过 selector `(state) => state.tags` 订阅，继续保持。
   - `ObjectList`、`NoteTimeline`、`RelationList` 等接收 props，不订阅整 store。
2. **useMemo / useCallback**
   - 在 Object 列表页、Home 页的排序/过滤使用 `useMemo`。
   - `ObjectCard` 的 `objectTags` 已用 `useMemo`。
3. **避免重复计算**
   - `tagStore.getSortedByUsage`、`objectStore.getByType` 等 getter 避免在 render 中多次排序；必要时使用 selector + memoization。
4. **TagSelect 搜索优化**
   - `availableTags` 用 `useMemo`，避免每次 render 重新过滤排序。

---

## 第十二阶段：数据完整性校验

### 具体改动

1. **新增 `lib/validation.ts`**
   - 手写运行时校验函数 `isValidLifeObject`、`isValidNote`、`isValidRelation`、`isValidTag`。
   - 校验必填字段：id、name、type、source/target objectId 等。
2. **Adapter 读取时过滤**
   - `getObjects/getNotes/getRelations/getTags` 返回前过滤无效记录，并 `console.warn` 提示丢弃数量。
3. **Adapter 写入时校验**
   - `createObject/createNote/createRelation/createTag` 在写入前校验输入，拒绝损坏数据。
4. **Schema version**
   - 与 Phase 3 的 `STORAGE_VERSION` 结合，未来可执行迁移。

---

## 第十三阶段：开发调试工具

### 具体改动

1. **新增 `components/DevTools.tsx`**
   - 仅在 `process.env.NODE_ENV !== "production"` 显示。
   - 浮层展示：Object/Note/Tag/Relation 数量、localStorage 占用、Hydration 状态、当前 storage version。
   - 提供一键导出、清空按钮（调试用）。
2. **在 `ClientProviders.tsx` 中渲染 `<DevTools />`**
   - 生产构建自动返回 null，不影响 bundle/性能。

---

## 第十四阶段：最终验收

最终输出：

1. **修改的文件列表**
2. **修复的问题列表**
3. **发现的隐藏问题列表**
4. **剩余风险列表**
5. **下一步建议**

### 验证清单

- [ ] Create Object 可用
- [ ] Create Note 可用
- [ ] Tag 系统可用（创建、搜索、多选、删除、持久化）
- [ ] Settings 可用（语言、主题、主题色、数据管理、AI 设置）
- [ ] 路由正常（home/objects/detail/create-object/create-note/settings）
- [ ] 刷新不丢数据
- [ ] localStorage 正常、损坏有提示
- [ ] PWA manifest + SW 正常、缓存版本化
- [ ] 无 Hydration warning
- [ ] 无 React 报错

---

## 计划执行说明

- **不新增重型依赖**：校验手写、CSS 变量实现主题色、class component 实现 ErrorBoundary。
- **不推翻架构**：保持 Zustand + storage adapter + localStorage 现有结构。
- **数据安全第一**：所有写操作前备份、损坏数据不静默丢失、清空操作需 confirm。
- **渐进式修复**：按 14 阶段顺序执行，每阶段结束后可独立验证。
