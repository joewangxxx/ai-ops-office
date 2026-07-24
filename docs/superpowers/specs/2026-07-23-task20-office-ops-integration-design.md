# Task 20：Office 清理与 Operations Console 全链路集成设计 Spec

## 1. 文档状态

- 状态：Ready for implementation after Operations Console Task 19
- 前置任务：Task 15 至 Task 19 Operations Console Specs
- 里程碑：Operations Console v1 完成

## 2. 目标

完成命令端与投影端的最终收口：

```text
Operations Console (/ops)
  -> submit standard business event
  -> Event Ledger / Projection
  -> Office (/office) renders live business state
```

Task 20 不再增加新的后台业务模块，而是迁移旧入口、删除重复职责、完成双页面联调、
恢复验证和最终回归。

## 3. 最终产品边界

### 3.1 `/office`

保留：

- Office Map。
- Workspace、Avatar、Artifact Hub 的可视化。
- Office Summary。
- 点击 Workspace、Avatar 和 Artifact 后的 Inspect 内容。
- 已有 Artifact Accept 交互。

移除：

- Event Console tab。
- Diagnostics tab。
- Reset Projection。
- 任意后台表单或技术诊断。

Office Inspector 最终只有 Inspect，不再需要一级 tab 切换。

### 3.2 `/ops`

包含：

- Overview。
- Dispatch。
- People。
- Artifacts。
- Events。
- System。

Operations Console 提供 `Open Office View`，在新标签页或明确路由中打开 `/office`。
Office 页面不需要反向放置后台管理入口，避免内部工具重新污染展示端。

## 4. 组件迁移

### 4.1 Event Console

- 将 `EventConsole` 的表单逻辑迁移/重构为 Dispatch 共享组件。
- 组件目录归属 Operations。
- Reset 从表单中移除，迁移到 System。
- 删除不再被引用的 Inspector Event Console 包装。
- 不保留两份结构相同的 Artifact 表单。

### 4.2 Diagnostics

- 将 `DiagnosticsPanel` 的请求与展示能力迁移/拆分到 Operations System 和 Events。
- Connection state 继续来自共享 backend hook。
- 删除 Inspector Diagnostics tab 和无用样式。
- 不重复创建 diagnostics timer 或 SSE。

### 4.3 Inspector

`InspectorShell` props 应收敛为 Inspect 所需内容：

- selection。
- scenario。
- hubCounts。
- notifications。
- accept action。
- pending Artifact IDs。
- selection change。
- mobile open/close。
- Office backend error。

删除：

- `eventConsoleEnabled`。
- `diagnosticsEnabled`。
- `onSubmitArtifact`。
- `onResetProjection`。
- Diagnostics connection props，如果 Inspect 不使用。
- `view` 状态和 tablist。

## 5. Runtime Config 收口

- `operationsConsoleEnabled` 是唯一后台产品开关。
- 删除已完成兼容期的 `eventConsoleEnabled` 和 `diagnosticsEnabled`。
- standalone 默认 false。
- Vite internal development 默认 true，除非测试显式覆盖。
- public mode 不暴露 Ops 路由、内部 endpoints 或 Ops 导航。

## 6. 共享数据和并发

- `/office` 与 `/ops` 是同一 Event Ledger 和 Projection 的两个客户端。
- 每个浏览器标签各自可以建立 SSE，这是正常客户端行为。
- 单个页面内部不得建立重复 SSE。
- 两个页面同时打开时，Ops 提交的事件必须实时出现在 Office。
- Office 的 Accept 必须实时反映到 Ops People、Artifacts 和 Events。
- epoch/revision 规则在两侧一致。
- polling fallback 和 SSE 恢复不能造成重复 Artifact、通知、Active Work 或 motion。

## 7. 全链路主场景

### 7.1 PM -> Dev

1. `/ops/dispatch` 创建 Alice -> Jack 的 PRD。
2. Events 记录 accepted。
3. `/office` 中 Alice 携带 PRD 到 Hub。
4. Artifact 状态变为 Awaiting Acceptance。
5. People 中 Jack Pending Assignments +1。
6. 在 Ops 或 Office 中由 Jack Accept。
7. Jack 去 Hub 领取并返回工位。
8. Artifact 变为 Active Work。
9. People 中 Jack 保留多个 Active Work。
10. Artifact timeline 完成 Submitted -> Delivered -> Accepted -> Received。

### 7.2 Dev -> QA

1. `/ops/dispatch` 创建 Jack -> Quinn 的 Feature。
2. Jack 完成交付。
3. Quinn 收到提示但不自动取件。
4. Quinn Accept 后取件。
5. Feature 进入 Quinn Active Work。

### 7.3 QA -> PM

1. `/ops/dispatch` 创建 Quinn -> 合法 PM assignee 的 Test Report。
2. Test Report 经过同一 Artifact Hub 交接机制。
3. Report Evidence 在 Ops Artifact Detail 中按测试报告结构展示。

## 8. 可靠性场景

必须验证：

- 同一 eventId 重复提交不会产生重复对象或动画。
- 内容冲突 eventId 返回 409。
- 同一员工多个 Pending Assignment。
- 同一员工多个 Active Work。
- 全局 motion FIFO。
- 接收者 Accept 时生产者尚在返回，取件动作排队而不穿插。
- standalone server 重启后 Projection 恢复。
- 已完成历史不重播。
- 未完成交接按现有 reconciliation 规则继续。
- Reset 创建新 epoch；两个页面都切换到新 epoch。
- SSE 断开后 polling 接管，恢复后只保留一个同步模式。
- Diagnostics/API 局部失败不阻断 Office。

## 9. 视觉与交互回归

Office 必须保持：

- office-shell 底图和现有坐标。
- Avatar/桌椅正确叠加。
- 名牌和光球现有校准。
- Artifact Hub 文案不重叠。
- 行走和携带使用对应方向资产，不镜像。
- 桌面不显示 Artifact 图标。
- Offline Avatar 隐藏、空桌可 Inspect。
- reduced motion 可用。

Operations 必须保持：

- 桌面密集、可扫描。
- 移动端无横向溢出。
- loading、empty、error、offline 状态完整。
- 页面跳转和 drawer 焦点正确。

Task 20 不重新设计或生成任何像素素材。

## 10. 清理范围

允许删除：

- 已完全被 Operations 组件替代且无引用的 Event Console/Diagnostics Inspector 包装。
- 对应旧 tab 状态、props、测试和样式。
- 已完成兼容期的 runtime flags。

不允许：

- 借机重写 Office Scene。
- 删除仍有价值的业务测试。
- 清理与本里程碑无关的代码。
- 改变现有 Business Event Contract v1。
- 修改或压缩 PNG。

## 11. 自动化测试

必须保留并扩展：

- 现有全部领域、Ledger、SSE、Gateway、Diagnostics 和资产测试。
- App route 和 internal mode 测试。
- Office Inspector 只保留 Inspect 的测试。
- Ops 六页面导航测试。
- Dispatch -> Office -> Accept -> Active Work 集成测试。
- 两客户端 revision/epoch 一致性。
- restart/recovery。
- SSE fallback/recovery。
- duplicate/conflict。
- public mode 404 和 endpoint 保护。
- 隐私与脱敏扫描。
- 无旧 Event Console/Diagnostics tab 文案或 props。

## 12. 浏览器验收矩阵

至少覆盖：

### Desktop

- `/office` 1440 × 900。
- `/ops` 1440 × 900。
- Overview、Dispatch、People Detail、Artifact Detail、Events、System。

### Mobile

- `/office` 390 × 844。
- `/ops` 390 × 844。
- Ops navigation drawer。
- Dispatch form。
- People/Artifact full-screen detail。

### Two-tab live scenario

- Tab A：`/ops/dispatch`。
- Tab B：`/office`。
- 完成 PM -> Dev 完整交接。
- 回到 Ops 检查 People、Artifacts、Events。

### Standalone

- 使用 production build 和 standalone server。
- 直接刷新所有深链。
- server restart recovery。
- internal disabled mode。

每个场景检查：

- `console.error` 为 0。
- `pageerror` 为 0。
- `unhandledrejection` 为 0。
- 无失败网络请求，预期 404/错误场景除外。

截图命名：

```text
output/playwright/task20-office-inspect-only.png
output/playwright/task20-ops-overview.png
output/playwright/task20-dispatch.png
output/playwright/task20-people-detail.png
output/playwright/task20-artifact-lifecycle.png
output/playwright/task20-events-system.png
output/playwright/task20-mobile.png
```

## 13. 工程验证

最终至少执行：

```text
npm test
npm run verify:assets
npm run build
git diff --check -- apps/office-demo docs
git diff --numstat -- images
```

还要进行静态扫描：

- 无 `artifact.completed` 等已移除 legacy event。
- 无 Story playback 控件。
- 无 Office Inspector Event Console/Diagnostics tabs。
- 无 `eventConsoleEnabled` / `diagnosticsEnabled` 长期残留。
- 无员工监控字段。
- 无新 PNG 变更。

## 14. 最终交付报告

创建：

```text
docs/task15-task20-ops-console-execution-report.md
```

内容：

1. Task 15 至 Task 20 完成状态。
2. 最终路由与信息架构。
3. Command/Projection 边界。
4. Overview 指标来源。
5. Dispatch 业务事件规则。
6. People 操作边界。
7. Artifact 生命周期与 Evidence。
8. Events/System 脱敏和内部访问边界。
9. Office Inspector 清理结果。
10. 修改文件清单。
11. 测试、构建和资产验证的实际结果。
12. 浏览器验收路径与截图。
13. standalone、restart、SSE fallback 验证。
14. PNG 未修改证明。
15. 剩余风险和明确未实现内容。
16. 明确说明是否创建 Git commit。

## 15. 验收标准

- `/ops` 是完整、清晰、内部可用的 Operations Console。
- `/office` 是 Inspect-only 的实时投影页面。
- 所有后台写操作都通过标准业务事件。
- Overview、People、Artifacts、Events 和 Office 对同一事实保持一致。
- public mode 无法访问后台和内部 API。
- 完整 PM -> Dev -> QA 业务链路可由后台自由驱动，不是固定动画片。
- 重启、幂等、FIFO、SSE 降级和 Reset 无回归。
- 无员工监控。
- 不修改 PNG。
- 全部自动化、构建和浏览器验收通过。

