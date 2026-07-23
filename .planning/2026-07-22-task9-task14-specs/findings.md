# Findings

## Current Baseline

- 应用位于 `apps/office-demo`，React 19 + Vite 6 + TypeScript。
- `npm test` 当前 15 个测试文件、115 个测试通过。
- `npm run verify:assets` 当前 12 个测试通过。
- `npm run build` 当前通过。
- Event Console 已能提交 `artifact.completed`，并按 PRD、Feature、Report 过滤上下游在线员工。
- 现有 API 由 Vite 插件提供，状态只保存在进程内存中。
- 前端每 500ms 轮询 `/api/office-state`。
- `motion.completed` 与外部业务事件共用同一 Union 和同一 POST 入口。
- Artifact 当前主要包含 id、category、title 和责任链字段，缺少岗位差异化证据内容。
- Latest Handoff 只保留三条展示记录，不是审计事件账本。

## Architectural Risks

- 事件缺少统一 envelope、schemaVersion、source、occurredAt 和 eventId 幂等语义。
- 服务重启会丢失事件和投影状态。
- 轮询增加延迟和无效请求，且真实多客户端场景下语义不够清楚。
- Event Console 与未来外部系统入口尚未隔离。
- 缺少 rejected/dead-letter、连接健康和投影 revision 等诊断信息。
- 工作区存在大量历史未提交修改，执行 Goal 时必须保留并谨慎分阶段验证。
- 系统派生的 delivered/received 需要 correlationId、causationId 和 motion 上的因果引用，才能稳定生成幂等事件。
- Ledger 恢复必须有显式 recovery reducer 模式，避免历史事件重新创建 presentation motion。

## Product Boundaries

- Office Map 是业务状态投影，不是员工监控。
- 不采集屏幕、键鼠、窗口内容、在线时长或离线原因。
- 分配与接受保持分离，接收人确认 Accept 后才领取 Artifact。
- 员工可拥有多个 Active Work，排序优先级保持 active > waiting_human > available。
- 不恢复固定 PM -> Dev -> QA 播放器。
