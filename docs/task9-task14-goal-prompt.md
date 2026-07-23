# Task 9 至 Task 14 Codex Goal Prompt

将以下内容作为 Codex Goal 的 objective 使用。不要设置 token budget，除非用户另行指定。

---

你需要在以下工作区持续工作，直到 Task 9 至 Task 14 全部实现、验证并完成验收：

```text
C:\Users\29929\Desktop\AI-Wrokspace
```

目标应用：

```text
C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo
```

## 总目标

将当前“可通过 Event Console 驱动的内存态办公室投影”升级为一套具备以下能力的本地事件驱动系统：

1. 稳定、版本化、幂等的 Business Event Contract v1。
2. PRD、Feature、Test Report 三类岗位差异化 Artifact Evidence。
3. 可持久化、可审计、可在重启后恢复的 Event Ledger。
4. 以 SSE 为主、轮询为降级的实时 Projection 同步。
5. 可独立运行并接受外部标准事件的 Event Gateway。
6. 不涉及员工监控的内部 Runtime Diagnostics。

## 必须按顺序执行

严格按以下顺序推进：

```text
Task 9
-> Task 10
-> Task 11
-> Task 12
-> Task 13
-> Task 14
```

不得并行实施具有前后依赖的 Task，不得跳过未通过验收的 Task。

## 唯一设计依据

依次阅读并遵守：

1. `docs/superpowers/specs/2026-07-22-task9-business-event-contract-v1-design.md`
2. `docs/superpowers/specs/2026-07-22-task10-artifact-evidence-model-design.md`
3. `docs/superpowers/specs/2026-07-22-task11-event-ledger-recovery-design.md`
4. `docs/superpowers/specs/2026-07-22-task12-sse-live-projection-design.md`
5. `docs/superpowers/specs/2026-07-22-task13-external-event-gateway-design.md`
6. `docs/superpowers/specs/2026-07-22-task14-runtime-diagnostics-design.md`

同时保留并遵守现有：

- `docs/office-layout.json`
- `docs/office-assets-and-layout.md`
- 当前通过的 Task 7、Task 7.2.1、Task 8 业务与视觉规则

Spec 是已确认设计。只有在实现中发现不可执行的内部矛盾时才允许调整，并必须在 progress 和最终报告中记录原因、替代方案及影响。

## 开始前

1. 检查 `git status --short` 和 `git diff --stat`。
2. 当前工作区可能有大量用户或前序任务留下的修改，必须保留。
3. 不得 reset、checkout、restore 或删除不属于当前 Goal 的修改。
4. 创建独立执行计划目录：

```text
.planning/2026-07-22-task9-task14-execution/
  task_plan.md
  findings.md
  progress.md
```

5. 在 task_plan 中分别建立 Task 9 至 Task 14 阶段及每项验收门禁。
6. 记录基线测试、构建、资产校验和图片文件状态。
7. 不创建 Git commit，不切换分支，不推送远端。

## 基线验证

开始实现前，在 `apps/office-demo` 执行：

```text
npm test
npm run verify:assets
npm run build
```

如果基线失败：

- 先判断是否由当前工作区已有修改造成。
- 记录失败。
- 修复与本 Goal 直接相关的阻塞问题。
- 不得为了让测试通过而删除有效测试。

## 通用实现规则

### 领域规则

- Office Map 是业务状态 Projection，不是动画播放器。
- Reducer/Application Service 是业务状态唯一写入口。
- UI 不得直接修改 Artifact location、Hub count、Active Work 或人物业务状态。
- 分配与接受保持分离。
- assignee 点击 Accept 后才允许领取。
- 同一员工允许多个 Active Work。
- FIFO 交接顺序必须保留。
- `motion.completed` 是内部运行时信号，不是外部业务事件。
- 历史恢复不得播放整段 PM -> Dev -> QA 动画。
- 只允许继续服务重启时尚未完成的交接。

### 隐私边界

不得采集、推断或展示：

- 员工屏幕。
- 键盘鼠标操作。
- 软件窗口内容。
- 离线原因。
- 在线时长。
- Agent prompt、聊天或细粒度工具调用。
- AI Assisted 指标。

### 前端边界

- 保留现有 Office Map 底图、人物、桌椅、名牌、光球和 Artifact Hub。
- 不恢复 Auto Demo、Story Progress、Play、Pause、Next 或 Replay。
- 不在员工桌面显示 Artifact 图标。
- 不增加不必要的持续动画。
- Inspector 默认仍为 Inspect。
- Event Console 是内部事件模拟工具。
- Diagnostics 只在内部模式出现。

### 图片保护

本 Goal 不生成、编辑、重新压缩、移动或删除任何 `images/**/*.png`。

开始和结束时检查：

```text
git diff --numstat -- images
```

如果 Goal 执行期间出现新的 PNG 变化，必须停止相关修改，恢复到 Goal 开始时的工作区图片状态，而不是恢复用户更早的修改。

### 工程规则

- 使用 TypeScript 严格类型。
- 使用现有 React、Vite 和 Node 模式。
- 除非 Spec 无法实现，否则不增加第三方运行时依赖。
- Task 11 使用 JSONL + Snapshot，不擅自替换为云数据库。
- Task 12 使用 SSE，不擅自改为 WebSocket。
- Task 13 第一版不实现 Jira、GitHub、GitLab 等专用连接器。
- 不进行与当前 Task 无关的大规模重构。
- 新的时间、ID、存储目录和网络对象必须可注入，保证测试确定性。
- 不使用 `dangerouslySetInnerHTML` 渲染 Artifact evidence。

## 每个 Task 的执行循环

对 Task 9、10、11、12、13、14 分别执行以下完整循环：

1. 阅读对应 Spec 和相关现有代码。
2. 在执行 task_plan 中列出该 Task 的实现步骤和受影响文件。
3. 先新增会失败的领域、API、Hook 或 UI 测试。
4. 运行目标测试，确认失败原因与设计目标一致。
5. 实现最小必要代码。
6. 运行该 Task 专项测试。
7. 运行全部 `npm test`。
8. 运行 `npm run verify:assets`。
9. 运行 `npm run build`。
10. 运行 `git diff --check -- apps/office-demo docs`。
11. 使用真实浏览器执行该 Spec 的验收场景。
12. 检查 `console.error`、`pageerror` 和 `unhandledrejection`。
13. 将截图保存到 `output/playwright`，文件名以对应 task 编号开头。
14. 将结果写入 progress.md。
15. 只有全部门禁通过后，才能把该 Task 标记 complete 并进入下一项。

## Task 9 完成条件

- 建立 v1 Business Event Envelope。
- 新代码使用 `artifact.submitted`，不再产生 `artifact.completed`。
- `artifact.submitted`、`artifact.delivered`、`artifact.accepted`、`artifact.received`、`projection.reset` 语义明确。
- correlationId、causationId 和 motion 因果引用完整。
- `/api/business-events` 与 `/api/runtime-events` 分离。
- Event Console 只产生业务事件。
- eventId 幂等和内容冲突验证通过。
- legacy 兼容适配器有明确边界。
- 完整提交、入库、接受、领取闭环通过。

## Task 10 完成条件

- PRD、Feature、Test Report 使用 discriminated evidence model。
- Event Console 可以结构化创建三类 Artifact。
- Artifact Detail 按岗位差异化展示。
- 不显示 Type、Source、Target 和独立 Version。
- 不显示完整聊天 Context、大段代码或测试日志。
- 所有 fixture 补齐合法 evidence。

## Task 11 完成条件

- 实现 InMemory 和 JSONL Event Ledger。
- 实现原子 Projection Snapshot。
- eventId 幂等跨重启生效。
- Reset 创建新 epoch，不物理删除历史。
- 服务重启后 Projection 正确恢复。
- 历史完成态不播放动画。
- 未完成交接可以继续。
- recovery reducer 不产生历史 presentation motion，只由 reconciliation 恢复必要的未完成 motion。
- 写入失败不提交内存状态。
- `.data` 不进入 Git。

## Task 12 完成条件

- `/api/office-stream` 成为默认同步方式。
- 页面静置时不再每 500ms polling。
- SSE 失败后自动降级 polling。
- SSE 恢复后停止 polling。
- epoch/revision 防旧消息覆盖。
- 两个浏览器客户端获得一致 Projection。
- motion 不重复完成或重启。

## Task 13 完成条件

- 存在可独立启动的 Node Event Gateway。
- 构建后的前端不依赖 Vite dev server 也能工作。
- `/api/v1/events` 接受标准 v1 envelope。
- API Key、source mapping、事件权限、body limit、CORS 和限流生效。
- 外部接口拒绝 derived event、runtime event 和 reset。
- healthz、readyz 和结构化脱敏日志可用。
- 提供 PM、Dev、QA 三份标准事件 fixture/script。
- server 重启恢复和 SSE 正常。

## Task 14 完成条件

- Inspector 增加内部 Diagnostics tab。
- 显示 Gateway、Ledger、Projection、epoch、revision、sequence 和连接状态。
- 显示最近 accepted、duplicate、rejected 事件的脱敏摘要。
- 显示系统级 motion queue 和 Artifact 状态聚合。
- 可以下载脱敏 Diagnostic Bundle。
- Diagnostics 失败不影响 Office Map、Inspect 和 Event Console。
- Office Summary 不出现技术指标。
- 不出现任何员工监控信息。

## 浏览器主验收链路

最终至少完成：

1. Event Console 提交 Alice -> Jack PRD。
2. Alice 将 PRD 送至 Hub。
3. Jack 收到通知但不自动领取。
4. Jack Accept 后领取并形成 Active Work。
5. 外部 Gateway 提交 Jack -> Quinn Feature。
6. Quinn Accept 并形成 Active Work。
7. 外部 Gateway 提交 Quinn -> Alice Test Report。
8. 多事件 FIFO 和多 Active Work 正确。
9. 重启 server，Projection 恢复且不重播历史动画。
10. SSE 断开后 polling 接管，恢复后回到 SSE。
11. 非法事件进入 rejected 诊断记录且不改变 Projection。
12. Diagnostics Bundle 不包含 evidence 正文、secret 或绝对路径。

## 不能宣称完成的情况

出现以下任一情况，不得标记 Goal complete：

- 任一 Task 未通过其 Spec 验收。
- 任何测试、资产验证或 build 失败。
- 浏览器存在未处理错误。
- 事件重复导致重复 Artifact、通知、Active Work 或动画。
- 重启丢失状态或重播全部历史动画。
- SSE 和 polling 同时写入并造成旧状态覆盖。
- Gateway 泄露 API Key、Authorization 或完整 evidence。
- Goal 期间修改了 PNG。
- 用删除测试或弱化断言规避失败。

## 最终验证

所有 Task 完成后执行：

```text
npm test
npm run verify:assets
npm run build
git diff --check -- apps/office-demo docs
git diff --numstat -- images
```

并完成 standalone server 浏览器验收、API fixture 验收、重启恢复、SSE 降级恢复和 Diagnostics 脱敏检查。

## 最终交付

创建：

```text
docs/task9-task14-execution-report.md
```

报告必须包含：

1. Task 9 至 Task 14 每项完成状态。
2. 最终架构与数据流。
3. Event Contract v1 摘要。
4. Artifact Evidence 三类结构摘要。
5. Ledger、恢复和 Reset epoch 说明。
6. SSE 与 polling 降级说明。
7. Gateway 启动和外部事件调用方式。
8. Diagnostics 信息边界。
9. 修改文件列表。
10. 自动化命令及实际结果。
11. 浏览器验收场景及截图绝对路径。
12. PNG 未修改证明。
13. 剩余风险和明确未实现内容。
14. 明确说明未创建 Git commit。

只有 Task 9 至 Task 14 全部实现、所有门禁通过、执行报告完成且没有遗留必需工作时，才将 Goal 标记为 complete。
