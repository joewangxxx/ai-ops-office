# Task 15：Operations Console 路由与壳层设计 Spec

## 1. 文档状态

- 状态：Ready for implementation
- 前置里程碑：Task 9 至 Task 14、已完成的 Baseline Closure and Legacy Cleanup
- 后续任务：Task 16 至 Task 20
- 里程碑：Operations Console v1

> 编号说明：工作区已有一个已完成的“Task 15：Baseline Closure and Legacy
> Cleanup”。本文件沿用用户确认的 Operations Console Task 15 编号，但实现时必须以
> 本文件完整路径为准，不得重复执行或覆盖旧基线任务。

## 2. 背景

当前应用把 Office Map、Event Console 和 Diagnostics 放在同一个右侧 Inspector 中。
这种结构适合早期验证，但把三种不同职责混在了一起：

- Office Map 是业务事实的实时 Projection。
- Event Console 是向系统提交标准业务事件的命令工具。
- Diagnostics 是检查 Gateway、Ledger、Projection 和连接状态的运维工具。

产品需要建立清晰的命令端与展示端边界：

```text
/ops     = command/write side
/office  = projection/read side
```

## 3. 目标

1. 建立独立、可深链访问的 `/ops` Operations Console。
2. 将 `/office` 明确定义为只读业务投影页面。
3. 提供稳定的应用级路由和 Operations Console 壳层。
4. 为 Task 16 至 Task 19 的 Overview、Dispatch、People、Artifacts、Events 和
   System 页面提供统一导航与布局。
5. 保证 `/ops` 与 `/office` 使用同一套后端事件、Ledger 和 Projection，不产生第二套
   业务状态。

## 4. 非目标

- 本 Task 不实现 Overview 的真实指标。
- 本 Task 不迁移 Event Console 或 Diagnostics 的具体内容。
- 本 Task 不实现人员、Artifact 或事件列表。
- 不引入权限管理、账号系统或多租户。
- 不增加员工在线状态修改能力。
- 不增加任何直接修改 Projection 的 API。
- 不修改办公室底图、Avatar、桌位、光球或 PNG。

## 5. 核心原则

### 5.1 Command 与 Projection 分离

- `/ops` 只能通过标准业务事件改变系统。
- `/office` 只展示 Projection，并保留 Artifact Accept 这一已有的业务交互。
- 两侧都不得直接修改 Hub 数量、Today 数量、Active Work 或人物动画状态。

### 5.2 单一事实源

- Event Ledger 是业务历史事实源。
- Office Projection 是当前状态读模型。
- Operations Console 的 Overview、People 和 Artifact 状态均从现有 Projection 或
  明确的内部读模型派生。
- 前端路由切换不得创建一套平行的内存 Scenario。

### 5.3 内部访问边界

- `/ops` 仅在 `operationsConsoleEnabled` 为 true 时可用。
- standalone server 默认关闭 Operations Console。
- 只有 loopback 或受信任私网 host 可以开启。
- public mode 访问 `/ops` 或其子路由时返回 404，不显示“后台已关闭”等泄露性提示。

## 6. 路由信息架构

```text
/                    -> /office
/office              -> Office Projection
/ops                 -> Operations Overview
/ops/dispatch        -> Dispatch Center
/ops/people          -> People
/ops/artifacts       -> Artifacts
/ops/events          -> Events
/ops/system          -> System
```

未知路由：

- 内部模式：显示最小 404 页面，并提供返回 `/office` 的链接。
- public mode：不得通过 404 内容暴露 `/ops` 的存在。

## 7. 路由实现约束

第一版优先使用轻量 pathname router：

- `window.location.pathname` 作为当前路由。
- 内部导航使用真实 `<a href>`，并由一个小型 navigation helper 处理
  `history.pushState`。
- 监听 `popstate` 支持浏览器前进和后退。
- 所有页面刷新和深链必须由 Vite dev server 与 standalone server 返回 SPA shell。
- API、静态资源和不存在文件不能被错误回退到 `index.html`。

除非现有实现无法满足上述要求，否则不新增 React Router 等运行时依赖。

建议应用拆分：

```text
src/app/AppRoot.tsx
src/app/OfficeApp.tsx
src/app/OperationsApp.tsx
src/app/appRoute.ts
```

`main.tsx` 只挂载 `AppRoot`。

## 8. Runtime Config

目标配置：

```ts
type OfficeRuntimeConfig = {
  operationsConsoleEnabled: boolean;
};
```

迁移规则：

- `operationsConsoleEnabled` 成为 Operations Console 的唯一产品级开关。
- 现有 `eventConsoleEnabled` 和 `diagnosticsEnabled` 可保留一个版本的兼容读取，
  但不得继续作为 UI 中两个独立 tab 的长期开关。
- 兼容逻辑必须有测试并写明删除条件。
- 客户端配置不得包含 API key、文件路径或其他 secret。

## 9. Operations Console 壳层

### 9.1 桌面布局

采用克制、密集、可扫描的 B 端后台布局：

- 左侧固定导航。
- 顶部环境栏。
- 主内容区域。
- 页面级标题、说明和主要动作区。

左侧导航顺序：

1. Overview
2. Dispatch
3. People
4. Artifacts
5. Events
6. System

顶部环境栏展示：

- `Operations Console`
- 环境：Local / Internal
- Projection 连接摘要：SSE / Polling / Offline
- `Open Office View` 链接

顶部连接摘要只表达系统连接状态，不显示员工状态。

### 9.2 移动端

- 左侧导航折叠为 drawer。
- 顶栏保持页面标题和菜单按钮。
- 主内容单列。
- 不要求在手机上同时展示大表格和详情抽屉。
- 所有触控目标至少 44 × 44 CSS px。

### 9.3 视觉规则

- Operations Console 使用企业后台视觉，不复制像素办公室风格。
- 可以复用现有状态色，但不能把像素素材作为后台装饰。
- 卡片圆角不超过 8px。
- 不使用渐变、装饰性光球或大面积营销式 Hero。
- 状态不只依赖颜色，必须有文字。

## 10. 页面占位状态

Task 15 只为尚未实现的子页面提供明确占位：

- 页面名称。
- `Coming in Task 16/17/18/19` 的内部开发说明。
- 不使用虚构数据模拟已完成页面。
- Overview 路由可以展示壳层说明，但不能展示伪造统计。

## 11. 后端和静态服务

Vite 与 standalone server 必须同时满足：

- `/office` 刷新可打开 Office。
- 已启用时，所有 `/ops/*` 深链返回同一前端 shell。
- 未启用时，所有 `/ops` 和 `/ops/*` 返回 404。
- `/api/*` 不参与 SPA fallback。
- 静态资源不存在时返回 404。
- 配置注入改为 `operationsConsoleEnabled`。

## 12. 状态与错误

- `/office` 与 `/ops` 分别挂载时只创建一个 `useOfficeBackend` 实例。
- 同一页面不得重复建立 SSE。
- 路由切换应卸载前一页面的订阅并正确清理。
- `/ops` 页面中的 Projection 连接失败只影响数据区，不让壳层白屏。
- Offline 状态必须给出文字，并保留导航。

## 13. 可访问性

- 主导航使用 `<nav aria-label="Operations">`。
- 当前项使用 `aria-current="page"`。
- 页面主区域使用唯一 `<main>`。
- 移动端 drawer 支持 Escape 关闭和焦点返回。
- 路由变化后更新 document title，并将焦点移动到页面一级标题。
- 连接状态使用 `role="status"`，非紧急变化不使用 `role="alert"`。

## 14. 测试

必须先写失败测试，再实现：

- `/` 正确进入 `/office`。
- `/office` 渲染 Office Projection。
- `/ops` 与五个子路由渲染对应壳层页面。
- 当前导航项正确。
- 浏览器前进、后退可用。
- 深链刷新在 Vite 和 standalone server 中可用。
- Operations Console 关闭时 `/ops/*` 返回 404。
- public mode 不注入后台开关和内部链接。
- `/api/*` 不被 SPA fallback 吞掉。
- 单个页面只建立一个 Projection 连接。
- 路由卸载会清理监听器和连接。
- 桌面与移动端导航无溢出。

## 15. 浏览器验收

1. 打开 `/office`，Office 正常更新。
2. 在内部模式打开 `/ops`，显示 Operations Console 壳层。
3. 依次访问六个 Ops 路由，导航高亮正确。
4. 使用浏览器前进和后退，页面正确切换。
5. 直接刷新 `/ops/people`，页面不返回服务器 404。
6. 新标签页同时打开 `/office` 和 `/ops`，二者连接同一 Projection。
7. 关闭 Operations Console 配置后，`/office` 正常，`/ops` 返回 404。
8. 检查 `console.error`、`pageerror` 和 `unhandledrejection` 为 0。

## 16. 验收标准

- 命令端与投影端有独立 URL 和清晰职责。
- Operations Console 壳层支持桌面、移动端和深链刷新。
- public mode 无法访问或发现后台。
- 未产生第二套业务状态或重复 SSE。
- Task 16 至 Task 19 可以在稳定壳层内继续实现。
- 不修改 PNG 和 Office Map 视觉布局。

