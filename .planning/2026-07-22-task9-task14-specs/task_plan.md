# Task 9-14 Design Specs

## Goal

为 Task 9 至 Task 14 编写可独立执行、前后衔接的中文设计 Spec，并输出一份可直接用于 Codex Goal 模式的总 Prompt。

## Phases

| Phase | Status | Deliverable |
|---|---|---|
| 1. 现状与约束盘点 | complete | 当前架构、测试基线、技术债与边界 |
| 2. Task 9-11 Spec | complete | 事件契约、Artifact 证据模型、事件账本 |
| 3. Task 12-14 Spec | complete | SSE、外部网关、运行健康 |
| 4. Goal Prompt | complete | 顺序执行与逐项验收 Prompt |
| 5. 自检与验证 | complete | 占位符、矛盾、范围、链接与工作区检查 |

## Decisions

- 采用契约优先路线，顺序为 Task 9 -> 10 -> 11 -> 12 -> 13 -> 14。
- Task 9 区分外部业务事件与内部运行时事件。
- Task 11 的事件重放只用于恢复投影，不在 UI 中播放历史动画。
- Task 12 使用 SSE，保留轮询降级，不采用 WebSocket。
- Event Console 保留为内部模拟输入，不成为生产集成入口。
- 所有任务不得采集屏幕、键鼠、窗口内容或细粒度 Agent 工具调用。
- 设计文档使用中文，代码标识和事件名保留英文。

## Errors Encountered

| Error | Resolution |
|---|---|
| 旧版中文 Spec 在 PowerShell 输出中出现编码乱码 | 不复用乱码文本，新增文档统一使用 UTF-8 内容并以结构化自检验证 |
| PowerShell 将 `rg` 的 glob 参数按 Windows 路径传入并返回 os error 123 | 改用 `Get-ChildItem` 展开文件后逐一传给检查命令 |
