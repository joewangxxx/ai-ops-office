# Task 22：Office 到 Operations 入口与双标签实时联动设计 Spec

## 1. 文档状态

- 状态：Approved for implementation after Task 21
- 前置任务：Task 21 Office Inspector 上一级返回导航
- 用户确认：Office Summary 的 Operations Console 入口使用新标签页打开

## 2. 问题定义

当前 Operations Console 顶栏有 `/ops -> /office` 的 `Open Office View`，但 Office Summary 没有 `/office -> /ops` 的可发现入口。用户回到 Office Summary 后无法继续进入 Operations Console。

同时，用户要求两页保持分离，并要求 Operations 中的真实操作能够在 Office 页面实时体现。例如，产品经理提交一个新的 PRD 后，Office Summary 的 Today PRD 数量应增加 1，并继续驱动交付、Hub、通知、Accept 和 Active Work。

## 3. 设计决定与 Task 20 边界修订

Task 20 曾规定 Office 不反向放置后台入口。本 Spec 以用户最新确认覆盖该条限制，但只做最小修订：

- Office 仍是 Inspect-only，不嵌入 Operations 表单、Events、Diagnostics 或 Reset。
- Office Summary 仅提供一个受 internal mode 控制的导航入口。
- `/office` 与 `/ops` 继续是两个独立页面和两个独立浏览器标签。
- public mode 仍不暴露 Operations 入口、路由或 internal endpoints。

## 4. Office Summary 入口

- 在 Office Summary 中增加清晰的 `Open Operations Console` 链接或按钮式链接。
- 使用原生链接指向 `/ops`。
- 使用 `target="_blank"`，并设置 `rel="noopener noreferrer"` 或安全等价配置。
- 不使用 `window.open` 模拟链接，不依赖脚本弹窗。
- 入口只在 `operationsConsoleEnabled === true` 时渲染。
- internal mode 下入口可通过键盘访问，并具有可理解的可访问名称。
- public mode 下 DOM 中不得存在入口、隐藏链接或 `/ops` 提示文案。
- 入口位于 Office Summary 的稳定操作区，不放进具体 Workspace、Avatar 或 Artifact 详情。

## 5. 配置传递

`App` 已解析 `operationsConsoleEnabled`。实现应通过明确、严格类型的 prop 或小型只读配置接口把该值传给 `OfficeApp` 和 Office Summary。

约束：

- 不重新引入 `eventConsoleEnabled` 或 `diagnosticsEnabled`。
- 不在多个组件中重复读取全局 window config。
- 不创建新的可写 runtime config store。
- standalone 默认 false、Vite internal development 默认 true 的现有规则保持不变。

## 6. 双标签架构

```text
Tab A: /office
   \                         /-> Office projection UI
    -> shared gateway -> ledger -> projection
   /                         \-> Operations read models
Tab B: /ops
```

- 每个标签可以各自建立一个 SSE 连接，这是正常的独立客户端行为。
- 单个页面内部仍只能有一个 `useOfficeBackend`/SSE 所有者。
- 两个标签使用同一 Event Ledger、Projection、epoch、revision 和 sequence。
- 不使用 BroadcastChannel、localStorage、postMessage 或前端共享变量伪造同步。
- SSE 断开时使用现有 polling fallback；SSE 恢复后停止 polling。
- stale revision 或旧 epoch 不能覆盖新状态。

## 7. Operations 写入规则

Operations 中所有业务变化继续通过标准 Business Event：

- Dispatch 提交 PRD、Feature、Test Report 时只产生 `artifact.submitted`。
- People/Artifacts 的 Accept 只产生 `artifact.accepted`。
- System Reset 只产生 `projection.reset`。
- UI 不得直接修改 Today 数量、Hub count、notification、Artifact location、Active Work 或 motion。

## 8. PRD +1 的明确语义

当 Operations Dispatch 成功提交产品经理到开发人员的合法 PRD：

1. Gateway 接受标准 `artifact.submitted`。
2. Ledger 只追加一次该 eventId。
3. Projection 注册 Artifact，并把其 ID 只追加一次到生产者所在 PM workspace 的 PRD Today Output。
4. Office Summary 的 `Today -> PRDs Submitted` 在收到新 projection 后增加 1。
5. Operations Overview 的 `PRDs Submitted Today` 使用同一 projection 事实并显示相同数量。
6. Producer-to-Hub 动效、Hub count、待接受通知和后续 Accept/Active Work 继续按现有生命周期运行。

Today +1 的确认点是 `artifact.submitted` 已被 projection 接受，不需要等待交付动画完成。Hub count 则继续服从实际 Artifact location，不得和 Today count 混为一谈。

## 9. 幂等、冲突和并发

- 相同 eventId 和相同内容的重复提交返回 duplicate，Today、Artifact、通知和动效均不重复 +1。
- 相同 eventId 但内容不同返回 conflict/409，不产生任何 projection 变化。
- 两名产品经理连续提交两个不同 PRD 时 Today 正确 +2，并保持 motion FIFO。
- 多个浏览器标签收到同一 revision 时只应用一次。
- Operations 离线或请求失败时不得提前乐观修改 Office 数字。
- Retry 只有在事件最终 accepted 时才出现一次真实增量。

## 10. Reset 与恢复

- Reset 产生新 epoch，不删除旧 ledger。
- 两个已打开标签都切换到新 epoch，Today 恢复到新 epoch 的 projection 基线。
- standalone restart 后由 ledger/snapshot 恢复，不重播已完成动效。
- 未完成交接继续使用现有 reconciliation 规则。
- SSE fallback/recovery 不得重复 Today 计数或 Artifact。

## 11. public/internal 边界

### Internal mode

- Office Summary 显示 `Open Operations Console`。
- 新标签 `/ops` 正常打开完整 Operations Console。
- internal APIs 正常受既有边界保护。

### Public mode

- Office Summary 不显示 Operations 入口。
- `/office` 正常。
- `/ops`、所有 `/ops/*` 和 `/api/internal/*` 返回 404。
- 不能通过页面源码、隐藏控件或导航文案发现内部后台入口。

## 12. 自动化测试

至少覆盖：

1. internal mode 的 Office Summary 显示新标签 `/ops` 入口及安全 rel。
2. public mode 不渲染入口。
3. `/office` 与 `/ops` 路由仍是独立应用，单页只有一个 backend hook。
4. Dispatch Alice -> Jack PRD 后 Office Today PRD 与 Ops Overview 同时 +1。
5. 同一 eventId duplicate 不重复 +1。
6. eventId conflict 返回 409 且两个页面数字不变。
7. 两个不同 PRD 正确 +2，motion FIFO 不回归。
8. SSE -> polling -> SSE recovery 期间计数一致且无双重同步。
9. Reset 后两个客户端进入相同新 epoch。
10. standalone restart 恢复相同 Today 数量且不重播完成历史。
11. public `/ops/*` 和 `/api/internal/*` 继续 404。

不得用 mock-only 的第二套计数模型代替真实 Office API store、ledger 和 projection 集成测试。

## 13. 浏览器验收

### 双标签主流程

1. 在 internal mode 打开 `/office`。
2. 在 Office Summary 点击 `Open Operations Console`。
3. 确认 `/ops` 在新标签打开，原 Office 标签保持原状态。
4. 记录两页初始 `PRDs Submitted Today`。
5. 在 Operations Dispatch 提交 Alice -> Jack PRD。
6. 回到已打开的 Office 标签，确认 Today PRD 自动 +1，无刷新。
7. 确认 Ops Overview 显示相同数量。
8. 等待交付进入 Hub，确认 Hub count 与 Artifact location 一致。
9. 重复提交同一 eventId，确认两页不再次 +1。
10. 在 People 中由 Jack Accept，确认 Office 与 Operations 同步进入后续生命周期。

### public mode

- `/office` 不显示入口。
- 直接访问 `/ops` 和 internal endpoint 均为 404。

### Desktop/Mobile

- 1440 × 900 和 390 × 844 下入口无溢出、可聚焦、文案完整。
- 新标签行为在桌面验证；移动端验证原生链接可用，不要求强制浏览器 UI 展现形式。

检查所有标签的 `console.error`、`pageerror`、`unhandledrejection`，并保存：

```text
output/playwright/task22-office-operations-entry.png
output/playwright/task22-two-tab-prd-sync.png
output/playwright/task22-ops-overview-prd-sync.png
output/playwright/task22-mobile-office-entry.png
```

## 14. 验收标准

- internal Office Summary 可发现 Operations Console，并在新标签打开。
- public Office 不暴露入口，后台路由和 internal APIs 仍为 404。
- 两个页面保持分离，不在 Office 内嵌后台功能。
- Operations 的 PRD +1 通过标准事件和共享 projection 实时反映到 Office Today。
- Office 与 Operations 的同类计数来自同一事实且保持一致。
- duplicate、conflict、SSE fallback/recovery、restart 和 reset epoch 不产生重复或陈旧状态。
- 不新增第二套 store，不直接修改 projection，不修改 PNG。
- 所有自动化、构建、浏览器和资产检查通过。

