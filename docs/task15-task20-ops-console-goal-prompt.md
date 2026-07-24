# Task 15 至 Task 20 Operations Console Codex Goal Prompt

将以下内容直接作为 Codex Goal 的 objective 使用。除非用户另行指定，不设置 token budget。

---

你需要在以下工作区持续工作，直到 Operations Console Task 15 至 Task 20
全部实现、验证并完成验收：

```text
C:\Users\29929\Desktop\AI-Wrokspace
```

目标应用：

```text
C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo
```

## 1. 总目标

把当前应用升级为职责清晰的双前端形态：

```text
/ops     = 内部 Operations Console，负责提交标准业务事件和运维观察
/office  = 实时业务 Projection，只负责展示与 Inspect
```

Operations Console 必须支持：

1. Overview。
2. Dispatch Center。
3. People。
4. Artifacts Registry 与生命周期。
5. Events。
6. System。

最终必须能够在 `/ops` 中创建 Alice -> Jack 的 PRD 业务事件，并由同一
Event Ledger 和 Projection 实时驱动 `/office` 中的交付、通知、Accept、取件和
Active Work，而不是播放固定动画。

## 2. 编号说明

工作区已经完成过一个独立的：

```text
Task 15: Baseline Closure and Legacy Cleanup
```

它是本 Goal 的前置基线，不得重新执行、覆盖或回滚。

本 Goal 继续使用用户确认的 Operations Console Task 15 至 Task 20 编号。
为避免歧义，唯一设计依据是下一节列出的六个完整 Spec 文件路径；不要根据旧 planning
目录中的裸 `Task 15` 名称决定要执行什么。

## 3. 唯一设计依据

严格按顺序阅读并执行：

1. `docs/superpowers/specs/2026-07-23-task15-operations-console-routing-shell-design.md`
2. `docs/superpowers/specs/2026-07-23-task16-operations-overview-dispatch-design.md`
3. `docs/superpowers/specs/2026-07-23-task17-operations-people-design.md`
4. `docs/superpowers/specs/2026-07-23-task18-operations-artifacts-lifecycle-design.md`
5. `docs/superpowers/specs/2026-07-23-task19-operations-events-system-design.md`
6. `docs/superpowers/specs/2026-07-23-task20-office-ops-integration-design.md`

同时保留并遵守：

- `docs/office-layout.json`
- `docs/office-assets-and-layout.md`
- Task 9 至 Task 14 的 Event Contract、Evidence、Ledger、SSE、Gateway 和
  Diagnostics 设计及现有测试
- 已完成 baseline cleanup 后的 event-driven 产品模型

Spec 是已确认设计。只有发现内部矛盾或在现有架构中确实不可执行时才允许最小调整，
并必须在 planning findings、progress 和最终报告中记录：

- 冲突是什么。
- 为什么不能按原设计实现。
- 采用了什么最小替代方案。
- 对验收和后续工作的影响。

不要重新发起产品选项讨论，不要把实现停在方案建议。

## 4. 开始前

1. 读取六份 Spec 和相关现有代码。
2. 检查：

```text
git status --short
git diff --stat
git log -5 --oneline
git diff --numstat -- images
```

3. 当前工作区可能包含用户或前序任务修改，必须保留。
4. 不得使用 reset、checkout、restore 或删除不属于本 Goal 的修改。
5. 不创建或切换分支。
6. 不创建 commit、tag、PR，不 push。
7. 创建独立执行计划：

```text
.planning/2026-07-23-task15-task20-ops-execution/
  task_plan.md
  findings.md
  progress.md
```

8. 将 `.planning/.active_plan` 指向该目录。
9. task plan 必须分别建立 Task 15 至 Task 20 阶段和每项验收门禁。
10. 记录 Goal 开始时的 PNG diff 清单或哈希，用于结束时对比。

## 5. 基线验证

在 `apps/office-demo` 执行：

```text
npm run verify
```

并单独记录：

```text
npm test
npm run verify:assets
npm run build
```

如果基线失败：

- 先判断失败来自已存在修改还是本 Goal 的直接依赖。
- 记录实际错误。
- 只修复与本 Goal 直接相关的阻塞。
- 不删除有效测试、不弱化断言、不跳过构建。
- 不得在基线未澄清时宣称后续 Task 通过。

## 6. 必须按顺序执行

```text
Operations Task 15
-> Operations Task 16
-> Operations Task 17
-> Operations Task 18
-> Operations Task 19
-> Operations Task 20
```

不得并行实施有前后依赖的 Task，不得跳过未通过门禁的 Task。

## 7. 全局产品边界

### 7.1 Command / Projection

- `/ops` 是 command/write side。
- `/office` 是 projection/read side。
- 所有写操作必须提交标准 Business Event。
- UI 不得直接修改 Artifact location、Hub count、Today count、notification、
  Active Work、人物状态或 motion。
- Assignment 与 Acceptance 必须分离。
- assignee Accept 后才允许取件。
- 同一员工允许多个 Pending Assignment 和多个 Active Work。
- 全局 motion FIFO 必须保留。
- 已完成历史不得在重启后重播。

### 7.2 Office

- 保留当前 office-shell、桌位、Avatar、光球、名牌、Artifact Hub 和已校准图层。
- `/office` 最终只保留 Inspect。
- Event Console、Diagnostics 和 Reset 必须迁出 Office Inspector。
- 不恢复 Auto Demo、Story Progress、Play、Pause、Next 或 Replay。
- 不在员工桌面显示 Artifact 图标。
- 不新增无业务意义的持续动画。

### 7.3 Operations Console

- `/ops` 只在 internal mode 可用。
- public mode 的 `/ops/*` 和 internal endpoints 返回 404。
- Overview 数字必须派生，不能编辑。
- Dispatch 不允许发送任意 JSON。
- People 不允许任意编辑 presence、Agent 状态或 Active Work。
- Artifacts 不允许编辑、删除或手动改状态。
- Events 不回显未知完整 payload。
- System Reset 创建新 epoch，不清空 Ledger。

### 7.4 隐私

不得采集、推断或显示：

- 员工屏幕。
- 键盘鼠标操作。
- 软件窗口内容。
- 在线时长。
- 离线原因。
- Agent prompt、聊天或细粒度工具调用。
- AI Assisted 指标。
- 员工生产力评分。

### 7.5 图片保护

本 Goal 不生成、编辑、压缩、移动或删除任何：

```text
images/**/*.png
```

开始与结束时运行：

```text
git diff --numstat -- images
```

若 Goal 期间出现新的 PNG 变化：

- 立即停止相关修改。
- 只恢复到本 Goal 开始时记录的图片状态。
- 不得覆盖用户在 Goal 开始前已有的图片变化。

## 8. 工程规则

- 使用现有 React 19、TypeScript、Vite 和 Node 架构。
- 使用严格类型。
- 优先复用现有 `useOfficeBackend`、Business Event、Evidence、Ledger、
  Projection、EventResultStore 和 Runtime Diagnostics。
- 不创建第二套 Scenario 或可写统计 store。
- Event Console 和 Diagnostics 要迁移/重构，不复制。
- 除非 Spec 无法实现，否则不新增运行时依赖。
- 路由优先使用小型 pathname router。
- 新时间、ID、存储和网络依赖应可注入，保证测试确定性。
- 不使用 `dangerouslySetInnerHTML` 渲染 evidence、事件或错误。
- 不进行与当前 Task 无关的大规模重构。
- 手工代码修改使用 `apply_patch`。

## 9. 每个 Task 的执行循环

对 Task 15 至 Task 20 分别完整执行：

1. 重新阅读对应 Spec 和受影响代码。
2. 在 execution `task_plan.md` 写出该 Task 的实现步骤和文件范围。
3. 先新增会失败的领域、API、hook、路由或 UI 测试。
4. 运行目标测试并确认失败原因与 Spec 目标一致。
5. 实现满足测试的最小完整代码。
6. 运行该 Task 专项测试。
7. 运行：

```text
npm test
npm run verify:assets
npm run build
git diff --check -- apps/office-demo docs
```

8. 使用真实浏览器完成该 Spec 的验收场景。
9. 同时监听并检查：

- `console.error`
- `pageerror`
- `unhandledrejection`

10. 截图保存到 `output/playwright`，文件名以对应 task 编号开头。
11. 将命令、实际结果、截图路径、错误和修复写入 `progress.md`。
12. 只有所有门禁通过后才能把该 Task 标记 complete 并进入下一项。

如果测试或浏览器行为失败，先按系统化调试定位根因，不得用延长 timeout、删除测试或
隐藏错误绕过。

## 10. Task 15 完成条件：路由与壳层

- `/`、`/office`、`/ops` 和五个 Ops 子路由存在。
- Vite 与 standalone 支持深链刷新。
- `/api/*` 不被 SPA fallback 吞掉。
- Operations Console 有桌面侧边导航、移动端 drawer、顶栏和 Open Office View。
- 当前导航项、前进后退、document title 和焦点管理正确。
- `operationsConsoleEnabled` internal boundary 生效。
- public mode `/ops/*` 返回 404。
- 单页面无重复 SSE。
- 本 Task 不用虚构数据实现后续页面。

## 11. Task 16 完成条件：Overview 与 Dispatch

- Overview 展示从 Projection 派生的 People Online、三类 Today 数量和 Handoff 状态。
- Overview 有局部 loading、empty、offline 和 error 状态。
- Dispatch 复用 Task 10 Evidence model。
- PRD、Feature、Test Report 均可通过结构化表单提交。
- Producer/Assignee 路径验证正确。
- query 预填安全，不在 URL 放 evidence。
- Submit 只产生 `artifact.submitted`。
- Assignment 与 Acceptance 分离。
- duplicate、conflict、offline 和 Retry 语义正确。
- Reset 不在 Dispatch。
- Alice -> Jack PRD 可在 Office 中开始交付。

## 12. Task 17 完成条件：People

- People Table 显示 Name、Workspace、Presence、Pending 和 Active Work。
- 在线与离线员工都存在，但不显示离线原因和在线时长。
- 搜索、筛选、排序和 URL 恢复可用。
- Person Detail 展示 Pending、多个 Active Work、相关 Artifact 和脱敏事件。
- Create Artifact 只预填 Dispatch。
- `Simulate Accept as {Name}` 只在合法条件显示，并提交标准
  `artifact.accepted`。
- 不存在直接 presence/Agent/Active Work 编辑。
- 人员详情实时更新且不重置滚动。

## 13. Task 18 完成条件：Artifacts

- Artifact Registry 支持搜索、筛选、排序、分页和深链详情。
- PRD、Feature、Test Report 使用差异化 Evidence。
- 生命周期统一映射为 Delivering、Awaiting Acceptance、Accepted、
  Collecting、Active Work。
- 同一 Artifact 只有一个当前 Operations 状态。
- Baseline Artifact 不伪造历史时间。
- Timeline 通过 artifactId/correlationId/causationId 构建。
- Accept 只在合法状态出现并提交标准事件。
- 列表不返回完整 evidence。
- reset epoch、SSE/polling 和分页一致性通过。

## 14. Task 19 完成条件：Events 与 System

- Events 支持 accepted、duplicate、rejected 的统一分页查看。
- 事件搜索、筛选、详情和 corrected-event 跳转可用。
- 不泄露完整未知 payload、Authorization、API key、secret 或绝对路径。
- System 展示 Gateway、Ledger、Projection、epoch、revision、sequence、
  connection 和 runtime aggregates。
- Diagnostics 与 Events 失败局部隔离。
- Diagnostic Bundle 保持脱敏。
- Reset 只在 System，必须二次确认。
- Reset 创建新 epoch，不删除 Ledger，不直接清空前端状态。
- internal endpoints 在 public mode 返回 404。

## 15. Task 20 完成条件：清理与全链路

- Office Inspector 只保留 Inspect。
- Event Console 和 Diagnostics 已迁移到 Operations，不存在重复实现。
- `eventConsoleEnabled`、`diagnosticsEnabled` 和旧 Inspector tab 代码完成清理。
- `/ops` 与 `/office` 使用同一业务事实源。
- 完成 PM -> Dev、Dev -> QA、QA -> PM 的事件驱动交接。
- 两标签实时同步。
- duplicate、conflict、多 Pending、多 Active Work、FIFO、restart recovery、
  Reset epoch、SSE fallback/recovery 全部通过。
- public mode 无后台功能。
- 桌面和移动端视觉验收通过。
- Office 图层校准和所有现有动画资产无回归。

## 16. 浏览器最终主验收

至少完成：

1. Tab A 打开 `/ops/dispatch`。
2. Tab B 打开 `/office`。
3. Dispatch 提交 Alice -> Jack PRD。
4. Office 中 Alice 将 PRD 送到 Artifact Hub。
5. Ops People 中 Jack Pending +1。
6. Jack 在 Ops 或 Office Accept。
7. Office 中 Jack 去 Hub 取件并返回工位。
8. Ops People 中 Jack Active Work 出现该 PRD，同时保留已有 Active Work。
9. Ops Artifact Detail 的 timeline 完整。
10. Ops Events 出现 accepted 结果。
11. 使用 Gateway fixture 完成 Dev -> QA 和 QA -> PM。
12. 重复 eventId 不产生重复对象或动画。
13. 重启 standalone server，Projection 恢复且不重播历史。
14. 断开 SSE 后 polling 接管，恢复后停止 polling。
15. Reset 后两个页面进入相同新 epoch。
16. public mode `/office` 正常，`/ops` 与 internal endpoints 返回 404。

## 17. 最终验证

所有 Task 完成后执行：

```text
npm test
npm run verify:assets
npm run build
git diff --check -- apps/office-demo docs
git diff --numstat -- images
```

同时完成：

- production build + standalone server 验收。
- 所有 `/ops/*` 深链刷新。
- 两标签实时场景。
- server restart recovery。
- SSE fallback/recovery。
- external fixtures。
- duplicate/conflict。
- Reset epoch。
- public/internal boundary。
- Event 与 Diagnostic Bundle 脱敏检查。
- desktop/mobile 截图。
- console、pageerror 和 unhandledrejection 检查。

## 18. 最终交付

创建：

```text
docs/task15-task20-ops-console-execution-report.md
```

报告必须包含：

1. Task 15 至 Task 20 每项完成状态。
2. 路由与最终信息架构。
3. Command/Projection 数据流。
4. Overview 指标来源。
5. Dispatch 和 Business Event 规则。
6. People 操作边界。
7. Artifact 生命周期与三类 Evidence。
8. Events/System 内部访问和脱敏。
9. Office Inspector 清理结果。
10. 修改文件列表。
11. 自动化命令和实际结果。
12. 浏览器验收步骤和截图绝对路径。
13. standalone、restart、SSE 和 Reset 验证。
14. PNG 开始/结束对比。
15. 剩余风险和明确未实现内容。
16. 明确说明未创建 Git commit、branch、tag、PR 或 push。

## 19. 不得宣称完成的情况

出现任一情况，不得将 Goal 标记 complete：

- 任一 Task 未满足其 Spec。
- 任一测试、资产验证或 build 失败。
- 浏览器存在未处理错误。
- `/ops` 可以直接修改 Projection 数字或人物状态。
- Assignment 与 Acceptance 被合并。
- Event Console 或 Diagnostics 仍留在 Office Inspector。
- public mode 可访问后台或 internal API。
- duplicate 导致重复 Artifact、通知、Active Work 或动画。
- restart 重播已完成历史。
- SSE 与 polling 同时造成旧状态覆盖。
- Event/Diagnostics 泄露敏感信息。
- 引入员工行为监控。
- Goal 期间产生新的 PNG 修改。
- 为通过验收删除测试、弱化断言或隐藏错误。
- 最终执行报告未完成。

只有 Task 15 至 Task 20 全部实现、所有门禁通过、最终报告完成且没有遗留必需工作时，
才将 Goal 标记为 complete。

