# AI OPS Office Demo — Task 6 Story Engine

## Goal

Close the replayable office story engine and add the Dev Feature → QA receipt → QA Testing sequence, while preserving the existing Task 4, Task 4.1, and Task 5 functionality.

## Constraints

- Implement the specified Gate 0 playback semantics before extending the story.
- Treat `docs/office-layout.json` as the sole route and scene-coordinate input.
- Keep React components as renderers of a projected `StoryFrame`; business transitions, metrics, handoffs, signals, and Orb states live in the story/data layer.
- Write and observe failing tests before new production behavior.
- Do not add permanent paths, walking beyond approved approaches, live integrations, or any unrequested Story Controller capabilities.

## Phases

### Phase 1: Baseline, evidence, and Task 5 playback diagnosis
Status: completed
- Capture the pre-change map, read the existing story, data, routes, tests, and browser state.
- Document the current playback/waypoint coupling and required generic data changes.

### Phase 2: Test-first contract and data routes
Status: completed
- Add failing Task 6 tests for playback lifecycle, pause/resume/replay, actor/Feature projection, metrics, signals, and duplicate prevention.
- Extend layout data with Dev/QA routes and Feature anchors.

### Phase 3: Generic story engine and UI projection
Status: in_progress
- Replace Alice/Jack-specific frame logic with pure generic Actors, Artifacts, signals, Orb states, and scenario projection.
- Wire an animation-safe controller and scene renderer that keeps a paused waypoint fixed and supports reduced motion.

### Phase 4: Regression, browser acceptance, and report
Status: pending
- Run the complete suite and build, verify pause/resume live, inspect console/page errors, and create all required desktop/mobile screenshots.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Initial combined tool invocation was parsed as JavaScript instead of PowerShell | 1 | Used the execution wrapper correctly; no workspace files changed. |
| Full `npm test` timed out after 64 seconds | 1 | Existing Task 5 test repeatedly clicked Next without advancing waypoint timers; replaced that obsolete synchronous loop with contract-level assertions. A fresh full suite then passed. |
| First browser state-advance batch exceeded the 30-second command limit | 1 | The browser reached `dev-notified`; continue with smaller state batches and verify the state after each capture. |
