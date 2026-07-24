# Task 21–Task 22 Office Navigation and Live Sync Codex Goal Prompt

将以下内容直接作为 Codex Goal 的 objective 使用。除非用户另行指定，不设置 token budget。

---

你需要在以下工作区持续工作，直到 Task 21 与 Task 22 按顺序全部实现、验证并完成验收：

```text
C:\Users\29929\Desktop\AI-Wrokspace
```

目标应用：

```text
C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo
```

## 1. 唯一设计依据

严格按顺序阅读并执行：

1. `docs/superpowers/specs/2026-07-24-task21-office-inspector-parent-navigation-design.md`
2. `docs/superpowers/specs/2026-07-24-task22-office-operations-entry-live-sync-design.md`

同时保留 Task 15–Task 20 已完成的路由、Operations Console、Event Contract、Ledger、Projection、SSE、Gateway、Diagnostics、Office Inspect-only 边界和现有测试。

如果新 Spec 与 Task 20 的“Office 不提供 Operations 反向入口”冲突，以 Task 22 的最新用户确认作为唯一例外：Office Summary 可以在 internal mode 提供一个新标签 `/ops` 入口，但不得把任何后台功能嵌入 Office。

不要重新发起产品方案讨论，不要把实现停在建议阶段。只有发现 Spec 内部矛盾或现有架构确实无法执行时，才允许做最小调整，并记录原因、替代方案和验收影响。

## 2. 开始前

读取两份 Spec 和受影响代码，然后执行并记录：

```text
git status --short
git diff --stat
git log -5 --oneline
git diff --numstat -- images
```

当前工作区包含此前 Task 15–Task 20 和用户的未提交修改，必须全部保留。

- 不得 reset、checkout、restore 或删除不属于本 Goal 的修改。
- 不创建或切换分支。
- 不创建 commit、tag、PR，不 push。
- 不修改、移动、压缩、生成或删除 `images/**/*.png`。
- 手工代码和文档修改使用 `apply_patch`。

创建独立执行计划：

```text
.planning/2026-07-24-task21-task22-office-navigation-sync/
  task_plan.md
  findings.md
  progress.md
```

并让 `.planning/.active_plan` 指向该目录。计划必须分别列出 Task 21、Task 22 的测试先行步骤、浏览器验收和最终门禁。

## 3. 基线验证

在 `apps/office-demo` 执行：

```text
npm run verify
```

单独记录：

```text
npm test
npm run verify:assets
npm run build
git diff --check -- apps/office-demo docs
git diff --numstat -- images
```

如果基线失败，先区分已有修改和本 Goal 依赖；只修复与 Task 21–Task 22 直接相关的阻塞，不删除有效测试、不弱化断言、不跳过构建。

## 4. 执行顺序

```text
Task 21 Inspector parent navigation
-> Task 21 全部门禁通过
-> Task 22 Office/Operations entry and live sync
-> Task 22 全部门禁通过
```

不得并行实现有前后依赖的两个 Task，不得在 Task 21 未完成时开始 Task 22。

每个 Task 都要：

1. 重读对应 Spec 和受影响代码。
2. 在 task plan 写明文件范围和验收门禁。
3. 先增加会因缺失功能而失败的测试，并确认失败原因正确。
4. 实现满足测试的最小完整代码。
5. 运行专项测试。
6. 运行完整测试、资产验证、生产/standalone 构建和 diff check。
7. 使用真实浏览器完成 desktop/mobile 验收并检查 console、pageerror、unhandledrejection。
8. 把命令、实际结果、截图、错误及修复写入 `progress.md`。

## 5. Task 21 必须完成

- Inspector 使用轻量 frame/history 模型保存真实父级。
- `Office Summary -> Today -> Test Reports -> Report` 返回到仍展开的 Test Reports。
- Workspace、Hub、Avatar 进入 Artifact 后都返回正确父级。
- Back 只逐级返回；Close 和 Show Office Summary 清空历史并回到 Summary。
- 地图顶层选择开启新浏览起点，不累积无意义历史。
- Back 文案带目标上下文，键盘可用，返回后恢复合理焦点。
- disclosure 状态可恢复，不能只把 `selection` 改回 `office`。
- projection 更新、Artifact 消失和 reset epoch 不造成空白、异常历史或 console error。
- 不改变浏览器 URL/history，不恢复任何 Office 后台 tab。

专项测试至少包含 Task 21 Spec 第 9 节的全部场景。

浏览器截图：

```text
output/playwright/task21-report-back-to-parent.png
output/playwright/task21-hub-back-to-parent.png
output/playwright/task21-mobile-back-navigation.png
```

## 6. Task 22 必须完成

- internal Office Summary 显示 `Open Operations Console`。
- 使用安全的原生新标签链接打开 `/ops`。
- public mode 不渲染入口，`/ops/*` 和 `/api/internal/*` 继续 404。
- `/office` 与 `/ops` 保持两个独立应用页面，不在 Office 嵌入后台功能。
- `operationsConsoleEnabled` 通过单一、严格类型的只读路径传递，不重复读取全局 config。
- Operations 的所有写入继续提交标准 Business Event，UI 不直接改 Today、Hub、通知、Active Work 或动效。
- Alice -> Jack PRD accepted 后，Office Summary Today PRD 与 Ops Overview 使用同一 projection 并同时 +1。
- Today +1 在 `artifact.submitted` 被 projection 接受后发生；Hub count 继续由实际 location 派生。
- duplicate 不重复 +1；conflict/409 不修改状态。
- 两个不同 PRD 正确 +2，motion FIFO 保留。
- 双标签 epoch/revision 一致，SSE fallback/recovery、restart 和 reset 不产生重复或陈旧状态。
- 不使用 BroadcastChannel、localStorage、postMessage 或第二套 store 伪造同步。

专项测试至少包含 Task 22 Spec 第 12 节的全部场景。

浏览器截图：

```text
output/playwright/task22-office-operations-entry.png
output/playwright/task22-two-tab-prd-sync.png
output/playwright/task22-ops-overview-prd-sync.png
output/playwright/task22-mobile-office-entry.png
```

## 7. 浏览器最终主验收

使用 production build + standalone server：

1. internal mode 打开 `/office`。
2. 在 Office Summary 点击入口，确认 `/ops` 在新标签打开且 Office 标签保留。
3. 在 Office 展开 Today -> Test Reports -> 具体 Report；Back 返回仍展开的 Test Reports。
4. 从 Workspace、Hub、Avatar 入口验证 Artifact 的真实父级返回。
5. 在 `/ops/dispatch` 提交 Alice -> Jack PRD。
6. 不刷新 Office 标签，确认 Today PRD +1。
7. 确认 Ops Overview 同类计数与 Office 一致。
8. 等待交付，确认 Hub、通知和 People pending 正确。
9. 由 Jack Accept，确认 Office 与 Ops Artifacts/People 同步更新。
10. 提交 duplicate，确认不重复 +1。
11. 触发 conflict fixture，确认 409 且状态不变。
12. 验证 SSE 断开后的 polling 接管和 SSE 恢复。
13. 重启 standalone，确认恢复且不重播完成历史。
14. Reset 后两个标签进入相同新 epoch。
15. public mode `/office` 无入口，`/ops` 和 internal endpoints 返回 404。

同时验证 1440 × 900 和 390 × 844，无横向溢出；所有标签 `console.error`、`pageerror`、`unhandledrejection` 为 0。

## 8. 全局工程边界

- 保持 React 19、TypeScript、Vite、Node 和严格类型。
- 复用现有 `useOfficeBackend`、Business Event、Ledger、Projection、SSE/polling、motion FIFO 和 runtime config。
- Assignment 与 Acceptance 必须分离。
- 不直接修改 projection 派生数字。
- 不新增员工屏幕、键鼠、窗口内容、在线时长、离线原因、prompt、聊天、工具调用或生产力评分监控。
- 不使用 `dangerouslySetInnerHTML`。
- 不做与两个 Task 无关的大规模重构。
- 不修改任何 `images/**/*.png`。

## 9. 最终验证

所有实现完成后执行：

```text
npm test
npm run verify:assets
npm run build
git diff --check -- apps/office-demo docs
git diff --numstat -- images
```

同时进行静态扫描：

- 无 Office Event Console、Diagnostics、Reset tab 回归。
- 无 `eventConsoleEnabled`、`diagnosticsEnabled`。
- 无第二套 Today/Hub 可写 store。
- 无前端伪同步通道。
- 无新 PNG 变化。

## 10. 最终报告

创建：

```text
docs/task21-task22-office-navigation-sync-execution-report.md
```

报告包含：

1. Task 21、Task 22 完成状态。
2. Inspector frame/history 与 disclosure 恢复规则。
3. Back、Close、Show Office Summary 的区别。
4. Office -> Operations internal-only 新标签入口。
5. Business Event -> Ledger -> Projection -> 双标签数据流。
6. Today +1 与 Hub count 的不同语义。
7. duplicate/conflict、SSE、restart、reset 验证。
8. 修改文件列表。
9. 自动化命令和实际结果。
10. 浏览器步骤、日志检查和截图绝对路径。
11. PNG 开始/结束对比。
12. 剩余风险和明确未实现内容。
13. 明确说明没有创建 branch、commit、tag、PR 或 push。

只有两份 Spec 全部满足、所有门禁通过、浏览器无未处理错误、报告完成且没有新增 PNG 变化时，才能宣称 Goal complete。

