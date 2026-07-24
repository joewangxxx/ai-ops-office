# Task 15 至 Task 20 Operations Console Specs

## Objective

在不修改产品代码和图片资产的前提下，为独立的 `/ops` Operations Console
编写六份可执行的中文设计 Spec，并产出一份可直接用于 Codex Goal 的总 Prompt。

## Confirmed Boundary

- `/ops` 是内部命令端和运营后台。
- `/office` 是只读的实时业务投影端。
- 后台只能提交标准业务事件，不能直接修改 Projection、统计数字或人物状态。
- Assignment 与 Acceptance 分离。
- Event Console 和 Diagnostics 从 Office Inspector 迁移到 `/ops`。
- Office Inspector 最终只保留 Inspect。
- 不增加员工行为监控，不修改任何 `images/**/*.png`。

## Numbering Note

工作区已有一个已经完成的“Task 15：Baseline Closure and Legacy Cleanup”。
本轮继续遵照用户确认的 Task 15 至 Task 20 编号，但以完整 Spec 文件名为唯一执行依据。
旧 Task 15 作为本轮实现的前置基线，不得被覆盖或重复执行。

## Phases

### Phase 1: Context and boundaries

- Status: complete
- Review existing Task 9 至 Task 14 specs, runtime architecture, and completed baseline Task 15.
- Freeze command/read separation and numbering note.

### Phase 2: Six design specs

- Status: complete
- Task 15: Operations Console routing and shell.
- Task 16: Overview and Dispatch Center.
- Task 17: People directory and employee operations.
- Task 18: Artifact registry and lifecycle.
- Task 19: Events and System operations.
- Task 20: Office cleanup and end-to-end integration.

### Phase 3: Goal prompt

- Status: complete
- Create a strict sequential execution prompt with per-task gates.
- Include TDD, browser acceptance, privacy, image protection, and dirty-worktree rules.

### Phase 4: Documentation verification

- Status: complete
- Verify all files exist and are UTF-8.
- Check code fences and placeholder markers.
- Run `git diff --check` on the new documentation.

## Deliverables

- Six specs under `docs/superpowers/specs/`.
- `docs/task15-task20-ops-console-goal-prompt.md`.
- This planning directory with findings and progress.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Existing completed plan already uses Task 15 | 1 | Preserve it as a prerequisite and make full Spec filenames canonical. |

## Verification Result

- Seven deliverable files exist and are readable as UTF-8.
- All Markdown code fences are balanced.
- No TODO/TBD/TBC/FIXME/placeholder markers remain.
- `git diff --check` passed for the new documentation and planning files.
- `git diff --numstat -- images` produced no output; this work did not modify PNG assets.
