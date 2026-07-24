# Operations Console Tasks 15-20 Execution Plan

**Goal:** Implement the approved Operations Console at `/ops` and retain `/office` as a shared, inspect-only projection, without changing PNG assets or altering the pre-existing Task 15 baseline cleanup.

**Architecture:** A pathname application root chooses a single Office or Operations client. Both clients use the existing business-event API, ledger, projection snapshot, and `useOfficeBackend`; Operations adds sanitized internal read models and command-only forms. Runtime configuration uses `operationsConsoleEnabled` as the sole product boundary.

**Constraints:** Preserve all existing working-tree changes; no branch, commit, tag, PR, push, reset, checkout, restore, or unrelated cleanup. Do not modify `images/**/*.png`. All writes are standard business events. Work in order and pass each task gate before beginning the next.

## Baseline

- [x] Read the six approved specifications in sequence.
- [x] Record initial git state and image diff: `git diff --numstat -- images` returned no entries.
- [x] Run baseline verification: `npm run verify` passed (192 tests, asset verification, TypeScript/Vite production and server builds).

## Task 15 - Routing and Operations shell - complete

- [x] Add failing route/config/server tests for `/`, `/office`, `/ops`, all Ops subroutes, deep-link fallback, public 404s, titles/focus, and one backend connection per mounted page.
- [x] Replace the single-app entry with pathname routing and Office/Operations roots; add accessible desktop navigation, mobile drawer, connection summary, and placeholders only.
- [x] Change Vite/standalone configuration and serving rules to `operationsConsoleEnabled`; prevent SPA fallback from handling `/api/*` and disabled `/ops/*`.
- [x] Gate: targeted tests, `npm test`, `npm run verify:assets`, `npm run build`, diff check, internal/public browser routes and desktop/mobile screenshots.

## Task 16 - Overview and Dispatch - complete

- [x] Add failing selector/API/component tests for projection-derived overview aggregates, structured PRD evidence, route constraints, query prefill, and offline-assignee semantics.
- [x] Implement sanitized Operations overview read model and dispatch form/receipt using the existing discriminated evidence model and business-event submit path.
- [x] Verify Alice-to-Jack PRD submission drives the Office delivery and leaves acceptance independent.
- [x] Gate: targeted automated checks and a two-tab browser flow with zero console errors; screenshots: `task16-dispatch-receipt.png`, `task16-overview-after-dispatch.png`.

## Task 17 - People - complete

- [x] Add failing tests for derived people rows/details, query-backed search/filter/sort, multiple pending/active items, safe detail APIs, and legal accept visibility/idempotency.
- [x] Implement People table/detail drawer, dispatch prefill, and confirmed `artifact.accepted` command path without employee monitoring or direct state mutation.
- [x] Verify real-time pending and active-work updates preserve scroll position.
- [x] Gate: all automated checks and desktop/mobile People acceptance flow with `task17-*` screenshots.

## Task 18 - Artifact Registry and lifecycle

- [x] Add failing tests for sanitized list/detail/timeline APIs, lifecycle selector mapping, evidence rendering, query restoration, stable pagination, baseline-artifact timeline, invalid parameters, and accept rules.
- [x] Implement registry table/detail drawer and lifecycle selectors sourced from the existing projection and ledger.
- [x] Verify submitted-to-delivered-to-accepted-to-received, one state at a time, across Office, People, and Artifacts.
- [x] Gate: all automated checks and registry lifecycle desktop/mobile flow with `task18-*` screenshots.

## Task 19 - Events and System

- [x] Add failing tests for unified sanitized event results, internal-only protection, System health/runtime summaries, safe diagnostic bundle, diagnostics failure isolation, and two-step reset.
- [x] Implement Events and System pages by moving/reusing Console/Diagnostics capabilities; keep a single backend/SSE connection and make reset create a new epoch only.
- [x] Verify duplicate/conflict/rejected display, diagnostics refresh/local failure isolation, and reset without ledger deletion. SSE/polling behavior remains shared with the existing page-level backend hook and receives the complete end-to-end regression in Task 20.
- [x] Gate: focused automated checks, production client/server build, diff check, and Events/System browser flows with `task19-events-detail.png`, `task19-events-outcomes.png`, and `task19-system-reset.png` screenshots.

## Task 20 - Office cleanup and end-to-end integration

- [x] Scope files: `OfficeApp`, `InspectorShell`, inspector wrappers/styles, runtime config tests, Office route tests, integration/recovery tests, and final report.
- [x] Add failing regression tests proving Inspector is Inspect-only and legacy flags/tabs are removed; retain the existing PM-to-Dev-to-QA-to-PM, duplicate/conflict, multiple work, FIFO, restart, SSE recovery, reset, public-boundary, privacy, and route coverage in the full suite.
- [x] Remove only superseded Inspector console/diagnostics wrappers, flags, styles, props, and tests; retain Office map, inspection, acceptance, assets, and motion behavior.
- [x] Run prescribed production standalone, browser, two-tab, desktop/mobile, fixture, and error-listener acceptance flows; save required `task20-*` screenshots.
- [x] Write `docs/task15-task20-ops-console-execution-report.md` with actual outcomes, screenshots, risks, image comparison, and no-commit declaration.
- [x] Gate: final `npm test`, `npm run verify:assets`, `npm run build`, `git diff --check -- apps/office-demo docs`, `git diff --numstat -- images`, then all Tasks marked complete.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Task 17 title assertion matched two intentional locations | 1 | Scoped the test to the unique acceptance action. |
