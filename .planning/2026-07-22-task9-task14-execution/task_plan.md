# Tasks 9–14 Event-Driven Office Execution Plan

**Goal:** Upgrade `apps/office-demo` from an in-memory Event Console projection into the specified local, persistent, externally addressable event-driven system, completing Tasks 9 through 14 in strict order.

**Architecture:** A versioned business-event contract feeds the application service/reducer as the sole business-state writer. A JSONL ledger and atomic snapshot persist the projection; SSE publishes revisions to clients with polling fallback; a standalone Node gateway accepts authorized external envelopes; internal-only diagnostics report privacy-safe runtime aggregates.

**Tech stack:** TypeScript, React, Vite, Node, Vitest, Testing Library, Playwright/browser acceptance, JSONL + atomic JSON snapshot, Server-Sent Events.

## Global constraints

- Execute Task 9 → 10 → 11 → 12 → 13 → 14; do not advance until the current task passes every gate.
- Preserve all pre-existing workspace changes. Do not reset, checkout, restore, commit, switch branches, or push.
- Do not generate, edit, recompress, move, or delete `images/**/*.png`.
- Use strict TypeScript and existing React/Vite/Node patterns; add no runtime dependency unless a spec is otherwise impossible.
- The reducer/application service is the sole business-state writer; UI cannot mutate artifact location, Hub count, Active Work, or people state directly.
- Assignment and acceptance remain separate; FIFO handoff and multiple Active Work per employee remain supported.
- Recovery must not replay completed historical presentation motion; only unfinished handoffs may reconcile into motion.
- Do not collect or show employee-screen/activity, input, window, offline-reason, online-duration, prompts/chats/tool calls, or AI-assisted metrics.
- Do not use `dangerouslySetInnerHTML` for evidence.
- Per Task: test-first RED → minimal GREEN → targeted tests → full tests → assets → build → diff check → real-browser acceptance/error check → screenshot → progress record.

## Phase 0 — Workspace and baseline

**Status:** complete

- [x] Capture `git status --short`, `git diff --stat`, and `git diff --numstat -- images`.
- [x] Map repository structure, scripts, current tests, and prior Task 7/7.2.1/8 behavior.
- [x] Run baseline `npm test` in `apps/office-demo`.
- [x] Run baseline `npm run verify:assets`.
- [x] Run baseline `npm run build`.
- [x] Record results in `progress.md` and discoveries in `findings.md`.

## Task 9 — Business Event Contract v1

**Status:** complete

**Files and interfaces:**

- Create `apps/office-demo/src/backend/businessEvents.ts`: v1 envelope/event unions, strict parsers, runtime signal parser, deterministic metadata/factory helpers, and the explicitly bounded legacy adapter.
- Modify `apps/office-demo/src/backend/officeDomain.ts`: add epoch and motion causal metadata; expose business-event and runtime-signal application paths for all five business events while preserving FIFO/multiple Active Work behavior.
- Modify `apps/office-demo/src/backend/viteOfficeApi.ts`: orchestrate idempotency/content-conflict checks, derived events, fallback motion completion, reset, `/api/business-events`, `/api/runtime-events`, and legacy `/api/office-events` adapter.
- Modify `apps/office-demo/src/hooks/useOfficeBackend.ts`: post business envelopes and runtime signals to separate endpoints; consume accepted/duplicate responses; use injected metadata generation for accepted/reset events.
- Modify `apps/office-demo/src/hooks/useOfficeMotionRunner.ts`: report only `MotionCompletedSignal` through the runtime callback.
- Modify `apps/office-demo/src/components/inspector/EventConsole.tsx`, `src/components/inspector/InspectorShell.tsx`, and `src/app/App.tsx`: submit/preview v1 `artifact.submitted`, label `Submit and Assign`, create v1 accept/reset events, and keep runtime signals out of the Console.
- Create `apps/office-demo/tests/task9-business-events.test.ts`, `task9-office-domain.test.ts`, `task9-office-api.test.ts`, and `task9-frontend.test.tsx`; migrate directly affected Task 7/8 assertions to the v1 public paths while retaining an explicit legacy-adapter test.

**Produced interfaces:**

- `BusinessEventEnvelope<TType, TPayload>` and `BusinessEvent` union for `artifact.submitted|delivered|accepted|received|projection.reset`.
- `MotionCompletedSignal` for `motion.completed` only.
- `parseBusinessEventEnvelope(value)` and `parseMotionCompletedSignal(value)` strict runtime validation.
- `applyBusinessEvent(state, event)` and `applyRuntimeEvent(state, signal)` as the domain/application boundary; runtime completion returns or applies only deterministic derived business events.
- `createOfficeApiStore(dependencies?)` with injected clock/ID/timer boundaries and accepted/duplicate response shape.

- [x] Read the Task 9 spec and relevant implementation/tests; record exact affected files and interfaces below before editing code.
- [x] Add failing contract/domain/API/Event Console tests and verify expected RED failures.
- [x] Implement the minimal v1 envelope, event semantics, idempotency/conflict behavior, causal references, business/runtime API separation, and bounded legacy adapter.
- [x] Verify the submit → Hub → accept → receive loop and all Task 9 completion criteria.
- [x] Pass targeted tests, full tests, assets, build, diff check, browser/error checks, and save `output/playwright/task9-*` screenshots.
- [x] Record evidence and mark complete only after every checkbox passes.

## Task 10 — Artifact Evidence model

**Status:** complete

**Files and interfaces:**

- Create `apps/office-demo/src/domain/artifactEvidence.ts`: discriminated PRD/Feature/Test Report evidence types, category-matching parser/validator, safe URL/count/coverage/business-rule checks, and explicit legacy-summary evidence factory.
- Modify `apps/office-demo/src/data/demoScenario.ts`: add `evidence` to `ArtifactScenario` and populate all seven existing fixtures with concise legal role-specific evidence while preserving IDs/titles.
- Modify `apps/office-demo/src/backend/businessEvents.ts`: require and parse `artifact.evidence` in every new `artifact.submitted` envelope.
- Modify `apps/office-demo/src/backend/officeDomain.ts` and `src/backend/viteOfficeApi.ts`: validate evidence again at the domain boundary, project it into scenario artifacts, and limit fallback evidence generation to the legacy adapter.
- Modify `apps/office-demo/src/components/inspector/EventConsole.tsx`: category-specific structured fields/drafts, client validation, draft cleanup on category switch, and evidence in Event Preview; no free JSON editor.
- Create `apps/office-demo/src/components/inspector/ArtifactEvidencePanels.tsx`: independent `PrdEvidencePanel`, `FeatureEvidencePanel`, and `TestReportEvidencePanel` with text-safe rendering and safe external links.
- Modify `apps/office-demo/src/components/inspector/InspectorContent.tsx` and `src/styles/app.css`: render responsibility chain first, then the matching evidence panel, hide empty optionals, and preserve Hub/Today/Handoff behavior.
- Create `apps/office-demo/tests/task10-artifact-evidence.test.ts`, `task10-event-console.test.tsx`, and `task10-artifact-detail.test.tsx`; adjust existing Task 7–9 fixtures to carry valid evidence.

**Produced interfaces:**

- `ArtifactEvidence = PrdEvidence | FeatureEvidence | TestReportEvidence` with `kind` matching `ArtifactCategory`.
- `parseArtifactEvidence(category, value): ArtifactEvidence` and `createLegacyArtifactEvidence(category, title): ArtifactEvidence`.
- Role-specific evidence panel components that render plain React text nodes and only `http:`/`https:` links with `target="_blank" rel="noopener noreferrer"`.

- [x] Read the Task 10 spec and relevant implementation/tests; record exact affected files and interfaces below before editing code.
- [x] Add failing discriminated-evidence, Event Console, fixture, and Artifact Detail tests; verify expected RED failures.
- [x] Implement minimal PRD, Feature, and Test Report evidence structures and role-specific safe rendering.
- [x] Verify forbidden metadata/full-context/code/log content is not displayed and all fixtures are legal.
- [x] Pass targeted tests, full tests, assets, build, diff check, browser/error checks, and save `output/playwright/task10-*` screenshots.
- [x] Record evidence and mark complete only after every checkbox passes.

## Task 11 — Event Ledger and recovery

**Status:** complete

**Files and interfaces:**

- Create `apps/office-demo/src/backend/eventLedger.ts`: persistence record/rejection/status types, `EventLedger`, `InMemoryEventLedger`, and serial/flush-safe `JsonlEventLedger` with tail quarantine and middle-corruption degradation.
- Create `apps/office-demo/src/backend/projectionSnapshotStore.ts`: snapshot type/interface plus in-memory and atomic JSON implementations with invalid-snapshot fallback.
- Create `apps/office-demo/src/backend/officeStore.ts`: Vite-independent application store, stable envelope hashes, append-before-commit transaction order, rejected metadata, snapshots, recovery, idempotency, degraded-state gating, runtime-derived event persistence, and serialized async commands.
- Modify `apps/office-demo/src/backend/officeDomain.ts`: numeric reset epochs, explicit `live|recovery` apply mode, recovery-safe event projection, snapshot hydration, and FIFO incomplete-handoff reconciliation without historical presentation replay.
- Modify `apps/office-demo/src/backend/viteOfficeApi.ts` and `vite.config.ts`: keep HTTP/legacy translation in the adapter, expose awaited store readiness/async handling, and use local JSONL/snapshot storage for the dev server.
- Modify `.gitignore`: exclude every local `.data/` directory.
- Create `apps/office-demo/tests/task11-event-ledger.test.ts` and `task11-recovery.test.ts`: in-memory/JSONL/snapshot, restart, incremental/no-snapshot recovery, idempotency, append failure, reset history, corruption modes, incomplete handoffs, and FIFO coverage using temporary directories only.
- Adjust Task 9 reset assertions and directly affected API tests for numeric epoch and the async persistent boundary while preserving the synchronous in-memory compatibility surface.

**Produced interfaces:**

- `EventLedger`, `PersistedBusinessEvent`, `RejectedEventRecord`, `InMemoryEventLedger`, and `JsonlEventLedger`.
- `ProjectionSnapshotStore`, `PersistedProjectionSnapshot`, `InMemoryProjectionSnapshotStore`, and `JsonProjectionSnapshotStore`.
- `createOfficeStore(dependencies)` with `ready`, serialized `acceptBusinessEvent` / `acceptRuntimeSignal`, snapshot/status access, and async `dispose`.
- `applyBusinessEvent(state, event, { mode })`, `hydrateOfficeState(snapshot)`, and `reconcileIncompleteHandoffs(state)`.

- [x] Read the Task 11 spec and relevant implementation/tests; record exact affected files and interfaces below before editing code.
- [x] Add failing in-memory/JSONL ledger, atomic snapshot, restart idempotency, reset epoch, write-failure, and reconciliation tests; verify expected RED failures.
- [x] Implement the minimal injected ledger/storage/snapshot/recovery boundaries and `.data` exclusion.
- [x] Verify completed history does not animate, unfinished handoffs reconcile, and failed writes do not commit memory state.
- [x] Pass targeted tests, full tests, assets, build, diff check, restart browser/error checks, and save `output/playwright/task11-*` screenshots.
- [x] Record evidence and mark complete only after every checkbox passes.

## Task 12 — SSE live Projection

**Status:** complete

**Files and interfaces:**

- Create `apps/office-demo/src/backend/projectionPublisher.ts`: `ProjectionStreamMessage`, publisher interface, 100-message ring buffer, latest snapshot, cursor replay, and listener cleanup.
- Modify `apps/office-demo/src/backend/officeStore.ts`: accept/share a publisher, expose durable sequence, and publish only after each persisted business commit or successful runtime projection transition; publish recovered initial state once ready.
- Modify `apps/office-demo/src/backend/viteOfficeApi.ts`: add `/api/office-stream`, SSE formatting/headers, immediate/latest or Last-Event-ID replay, heartbeat, per-IP limit, backpressure disconnect, close cleanup, and server-dispose cleanup.
- Modify `apps/office-demo/src/hooks/useOfficeBackend.ts`: EventSource-first synchronization state machine, strict epoch/revision guards, 10-second initial deadline, three-failure polling fallback, five-second SSE recovery attempts, POST/SSE deduplication, and complete cleanup while retaining ordered poll protection.
- Verify `apps/office-demo/src/hooks/useOfficeMotionRunner.ts` without changing business semantics; add an explicit same-motion rerender/reconnect regression test if current primitive dependencies already satisfy the contract.
- Create `apps/office-demo/tests/task12-projection-publisher.test.ts`, `task12-office-stream.test.ts`, `task12-backend-hook.test.tsx`, and `task12-motion-runner.test.tsx`; migrate older hook tests to an injected unavailable-SSE path where their subject is polling/POST compatibility.

**Produced interfaces:**

- `ProjectionPublisher`, `ProjectionStreamMessage`, and `createProjectionPublisher(initial, capacity?)` with `replayAfter(cursor)`.
- `serveProjectionStream(request, response, publisher, options)` returning an idempotent cleanup callback.
- `ProjectionConnectionState` and an EventSource-injectable `useOfficeBackend` synchronization boundary.

- [x] Read the Task 12 spec and relevant implementation/tests; record exact affected files and interfaces below before editing code.
- [x] Add failing SSE endpoint/hook, fallback/recovery, revision ordering, multi-client, and motion-deduplication tests; verify expected RED failures.
- [x] Implement SSE as default with polling only during disconnection and epoch/revision stale-update guards.
- [x] Verify two clients converge and SSE recovery stops polling without restarting/completing motion twice.
- [x] Pass targeted tests, full tests, assets, build, diff check, browser/error checks, and save `output/playwright/task12-*` screenshots.
- [x] Record evidence and mark complete only after every checkbox passes.

## Task 13 — External Event Gateway

**Status:** complete

**Files and interfaces:**

- Create `apps/office-demo/src/backend/incomingEventAdapter.ts`: `IncomingEventAdapter`, `AdapterContext`, and `CanonicalEventAdapter` that validates a v1 envelope and overwrites `source.system` with the authenticated identity.
- Create `apps/office-demo/server/config.ts`: centralized `GatewayConfig` / `ApiClientConfig`, environment validation, SHA-256 key hashing/constant-time matching helpers, CORS parsing, size/port defaults, and safe Event Console host policy.
- Create `apps/office-demo/server/gateway.ts`: reusable Node HTTP server, external `/api/v1/events`, internal API/SSE transport reuse, static `dist` serving, SPA fallback/runtime public config injection, body/content-type/CORS/rate-limit boundaries, health/readiness probes, structured redacted logging, and deterministic start/close lifecycle.
- Create `apps/office-demo/server/main.ts` and `vite.server.config.ts`: production entry and bundled ESM server artifact; modify TypeScript/build/npm configuration to typecheck, bundle, and run it without Vite dev middleware.
- Modify `apps/office-demo/src/backend/viteOfficeApi.ts` only to export shared response/body helpers if required by the standalone adapter; preserve Vite behavior.
- Modify `apps/office-demo/src/app/App.tsx` and `src/components/inspector/InspectorShell.tsx`: consume only injected public `eventConsoleEnabled` runtime config and hide the Console tab when disabled while preserving Inspect/Accept.
- Create three redacted-key-free PM/Dev/QA v1 fixture envelopes plus one environment-keyed submission script and npm aliases.
- Create `apps/office-demo/tests/task13-config.test.ts`, `task13-gateway.test.ts`, and `task13-standalone-recovery.test.ts` covering lifecycle/static files, auth/permissions/source override, size/content/CORS/rate limit, idempotency/conflict, probes, transport parity, log redaction, restart recovery, and standalone SSE.

**Produced interfaces:**

- `GatewayConfig`, `ApiClientConfig`, `parseGatewayConfig(env)`, `loadApiClients(path)`, `hashApiKey(key)`, and `authenticateApiClient(key, clients)`.
- `IncomingEventAdapter<TInput>`, `AdapterContext`, and `CanonicalEventAdapter`.
- `createOfficeGateway(options)` returning an independently startable/closable server and shared application-store handle.
- Public `window.__OFFICE_CONFIG__.eventConsoleEnabled` injection containing no secret material.

- [x] Read the Task 13 spec and relevant implementation/tests; record exact affected files and interfaces below before editing code.
- [x] Add failing standalone server/API/security/health/readiness/logging/fixture/restart tests; verify expected RED failures.
- [x] Implement the minimal Node gateway, built frontend serving, `/api/v1/events`, API-key mapping/permissions, limits, CORS, rate limit, probes, redacted logs, and PM/Dev/QA fixtures/scripts.
- [x] Verify derived/runtime/reset rejection, restart recovery, and SSE operation without Vite.
- [x] Pass targeted tests, full tests, assets, build, diff check, standalone browser/error checks, and save `output/playwright/task13-*` screenshots.
- [x] Record evidence and mark complete only after every checkbox passes.

## Task 14 — Runtime Diagnostics

**Status:** complete

**Files and interfaces:**

- Create `apps/office-demo/src/backend/eventResultStore.ts`: bounded 100-entry `EventResultStore`, `SanitizedEventResult`, and strict payload-free record/recent behavior.
- Create `apps/office-demo/src/backend/runtimeDiagnostics.ts`: `RuntimeHealth`, projection-runtime aggregates, health derivation, rejected-record sanitization, and `DiagnosticBundle` construction helpers.
- Modify `apps/office-demo/src/backend/eventLedger.ts`: expose bounded recent accepted/rejected reads, persist optional correlation ID, rotate rejected JSONL at 5 MB with five retained files, and never return payload bodies.
- Modify `apps/office-demo/src/backend/officeStore.ts` and `viteOfficeApi.ts`: expose recent durable/rejected summaries, seed startup accepted results, record accepted/duplicate/rejected outcomes, and keep diagnostics failures outside the projection transaction.
- Modify `apps/office-demo/server/gateway.ts`: add internal-only diagnostics/recent/rejected/bundle GET endpoints, maximum limit 100, content disposition, server health/connection aggregation, and independent error mapping.
- Modify `apps/office-demo/src/hooks/useOfficeBackend.ts`: enrich the existing connection state with SSE state, last snapshot, reconnect count, and polling fallback without another request path.
- Create `apps/office-demo/src/components/inspector/DiagnosticsPanel.tsx`; modify `InspectorShell`, `App`, runtime public config, and CSS for the internal-only third tab, five-second health refresh, manual lists refresh, safe bundle download, local failure alerts, accessible wrapping, and motion-preserving view switches.
- Create `apps/office-demo/tests/task14-runtime-diagnostics.test.ts`, `task14-diagnostics-api.test.ts`, and `task14-diagnostics-ui.test.tsx`; extend ledger tests for bounded rotation/read behavior where appropriate.

**Produced interfaces:**

- `EventResultStore`, `SanitizedEventResult`, and `createEventResultStore(capacity?)`.
- `RuntimeHealth`, `ProjectionRuntimeSummary`, `DiagnosticBundle`, `deriveRuntimeDiagnostics(...)`, and rejected-event sanitizers.
- Internal GET endpoints `/api/internal/diagnostics`, `/recent-events`, `/rejected-events`, and `/diagnostic-bundle` with payload-free bounded output.
- An enriched `ProjectionConnectionState` consumed directly by `DiagnosticsPanel`.

- [x] Read the Task 14 spec and relevant implementation/tests; record exact affected files and interfaces below before editing code.
- [x] Add failing diagnostics API/UI/bundle/redaction/failure-isolation/privacy tests; verify expected RED failures.
- [x] Implement the minimal internal-only Diagnostics tab, runtime/connection summaries, recent redacted event outcomes, queue/artifact aggregates, and bundle download.
- [x] Verify Office Summary remains non-technical, no employee-monitoring data appears, and diagnostics failure does not break existing surfaces.
- [x] Pass targeted tests, full tests, assets, build, diff check, browser/error checks, and save `output/playwright/task14-*` screenshots.
- [x] Record evidence and mark complete only after every checkbox passes.

## Final acceptance and delivery

**Status:** complete

- [x] Run final `npm test`, `npm run verify:assets`, and `npm run build`.
- [x] Run `git diff --check -- apps/office-demo docs` and `git diff --numstat -- images`.
- [x] Complete the 12-step browser acceptance chain on the standalone server, including restart, SSE fallback/recovery, invalid-event diagnostics, and diagnostic-bundle redaction.
- [x] Confirm no `console.error`, `pageerror`, or `unhandledrejection`.
- [x] Create `docs/task9-task14-execution-report.md` with every required section and absolute screenshot paths.
- [x] Confirm no commit, branch switch, or push occurred.
- [x] Mark the Codex goal complete only if every phase above is complete and no required work remains.

## Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Initial `/goal` wrapper registered only the instruction to read the objective file. | 1 | Completed the wrapper after reading the file, then registered the full Tasks 9–14 objective as the active goal. |
| First Task 9 closure test dereferenced the missing API response after the expected 404. | 1 | Added an explicit expected-status assertion/guard so RED reports the missing endpoint rather than a secondary dereference. |
| Task 9 combined verification stopped at `git diff --check` because two new TypeScript files had a blank line at EOF. | 1 | Removed the two blank EOF lines and scheduled a complete gate rerun; parallel results from the stopped run are not credited. |
| Task 9 build found a `Promise<OfficeSnapshot>`/`Promise<void>` UI callback mismatch and an unsafe generic `in` guard. | 1 | Traced each boundary, wrapped the App callback to return `void`, narrowed JSON from `unknown`, and confirmed the build passes. |
| Task 11 first build found the moved accepted-response type export and two string epoch fixtures. | 1 | Re-exported the public response shape and migrated the fixtures/assertions to numeric reset epochs. |
| Task 11 first restart observation recovered durable state but exposed a revision drop from 5 to 4 after presentation-only history was suppressed. | 1 | Added a deterministic durable-sequence revision floor and a regression assertion; final restart recovered revision 12 with no motion. |
| PowerShell `Get-NetTCPConnection` probe timed out after confirming `npx` availability. | 1 | Replaced it with direct HTTP readiness polling; Vite was ready immediately. |
| A combined hidden-server command was rejected by command policy. | 1 | Split directory creation, hidden `Start-Process`, and HTTP readiness polling into scoped commands. |
| The Playwright skill wrapper routed through a misconfigured WSL `bash` and could not translate the Windows path. | 1 | Used the skill-approved underlying `npx --package @playwright/cli playwright-cli` command directly. |
| First Playwright `run-code` wait used a statement instead of the required `(page) => ...` function. | 1 | Verified completion from the subsequent snapshot, then used the documented function form for pageerror/unhandled checks. |
| Task 12 full suite retained the Task 7 500 ms polling cadence after the new 5-second fallback contract. | 1 | Migrated that compatibility assertion to the Task 12 interval; all 170 tests passed. |
| Task 12 first build inferred no-op cleanup callbacks as `() => undefined`. | 1 | Annotated both cleanup variables as `() => void`; strict TypeScript and production build passed. |
| Task 12 first browser script used a non-exact Office scene region and an obsolete success phrase. | 2 | Tightened the accessible locator and matched the actual role=status message; the complete chain then passed. |
| The first combined Task 13 hidden-server command was rejected by command policy. | 1 | Split environment-bound process launch and readiness polling into separate scoped commands. |
| The first three-artifact browser wait targeted text while Jack detail was still selected, and the full-scene summary hit target was intercepted by furniture. | 1 | Verified durable Hub state, activated the existing accessible summary button through its DOM action, and captured the converged summary. |
| The first bundle audit used an unsupported PowerShell `Select-String -Recurse` switch. | 1 | Enumerated files with `Get-ChildItem -Recurse -File` and piped them into `Select-String`; production and bundle secret matches were both zero. |
| Task 14's first strict build found a narrowed health literal and an unsupported Testing Library matcher option. | 1 | Added the explicit runtime-health type and used the supported exact-text query; all targeted and full builds passed. |
| A Playwright request route was left installed across remote `run-code` calls during the motion check. | 2 | Diagnosed the stale remote handler, closed only the affected Playwright sessions, and kept every later route install/use/removal inside one automation call. |
| Mobile visual inspection found the Diagnostics heading overlapping the wrapped tab row at 390 px. | 1 | Made the Inspector header non-shrinking and used equal-width column-flow tabs; browser geometry and screenshot checks then passed with no overflow or overlap. |
| Delivery audit found the earlier Task 9–11 screenshot files referenced in progress were no longer present. | 1 | Recreated five consolidated acceptance screenshots from the final recovered ledger, visually inspected them, and verified every report path exists. |
