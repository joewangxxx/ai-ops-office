# Findings — Tasks 9–14

## Objective constraints established

- The six dated design specs are the only design authority and must be consumed in task order.
- Existing Office Map visuals and Task 7/7.2.1/8 business behavior must remain intact.
- All newly introduced time, IDs, storage paths, and network objects must be injectable for deterministic tests.
- PNG files are protected throughout the goal.

## Repository discoveries

- The worktree starts with 98 tracked-file changes (2,258 insertions / 821 deletions) plus untracked specs/planning/temp content. These are user/prior-task changes and must be preserved.
- The PNG baseline already contains 40 modified files under `images/`. The goal's image check is therefore a before/after equality check against this captured list, not an expectation of empty Git image diff.
- Existing production boundaries are concentrated in `src/backend/officeDomain.ts`, `src/backend/viteOfficeApi.ts`, `src/hooks/useOfficeBackend.ts`, `src/hooks/useOfficeMotionRunner.ts`, `src/components/inspector/*`, and `src/app/App.tsx`.
- Existing coverage includes Task 7, Task 7.2, and Task 8 domain, API, hook, Event Console, Inspector, map, avatar, and asset tests.
- `package.json` has React/ReactDOM runtime dependencies only; Node/Vite/Vitest/TypeScript and Testing Library are dev dependencies. Required scripts are `test`, `verify:assets`, `build`, and composite `verify`.
- Baseline validation is fully green: 15 files / 115 tests, asset validation 12 tests, TypeScript + Vite production build.

## Design/spec notes

### Task 9

- Current events are unversioned `{type,...}` values. `artifact.completed`, `artifact.accepted`, and `motion.completed` all flow through `/api/office-events`; reset flows through `/api/office-reset`.
- The existing domain already preserves assignment/acceptance separation, FIFO motion, multiple Active Work, cloned-state failure atomicity, and duplicate motion completion. Those invariants should be retained while splitting business facts from presentation runtime.
- Current motion completion directly mutates delivered/received business state. Task 9 requires deterministic derived `artifact.delivered` (`<submitted-id>:delivered`) and `artifact.received` (`<accepted-id>:received`) events, so each motion must retain `causationEventId` and `correlationId`.
- The API store is the correct orchestration point for eventId idempotency/content conflicts, derived-event application, server fallback timers, and legacy translation. The reducer remains the state mutation boundary.
- The Event Console currently emits and previews `artifact.completed`, uses `Complete and Assign`, and only injects the artifact-ID suffix. Task 9 needs stable injected event metadata (`eventId`, `occurredAt`, `correlationId`) in its preview and must submit `artifact.submitted`.
- The frontend hook currently polls and posts every message to the legacy endpoint. Task 9 will split `postBusinessEvent` from `postRuntimeEvent`; Task 12 will later replace steady polling with SSE.
- The old `/api/office-events` route must remain only as a legacy adapter during Task 9. Existing Task 7/8 tests that intentionally cover old public behavior will be migrated to v1 except one explicit adapter test.
- Final legacy audit: the live React hook and App contain no legacy endpoint or `artifact.completed` calls. Legacy names remain only in `officeDomain.ts` and `viteOfficeApi.ts` adapter code plus the explicit adapter test.
- Legacy adapter removal condition: remove `/api/office-events`, `/api/office-reset`, `OfficeEvent`/`ArtifactCompletedEvent`, and `applyOfficeEvent` after all Task 7/8 compatibility tests and any non-UI local callers have migrated to v1 business/runtime APIs. No live frontend dependency blocks removal now.
- Browser acceptance confirmed Event Console previewed a complete v1 envelope, Alice submitted a PRD, Hub count increased, Jack received an available notification without auto-accept, and Accept created a second Active Work entry.
- Browser diagnostics: 0 console errors/warnings, `pageErrors: []`, `unhandled: []`. The request log showed v1 business/runtime POSTs returning 202; one expected aborted poll occurred during page lifecycle cancellation.

### Task 10

- `ArtifactScenario` currently has only identity/status/responsibility fields; all seven demo artifacts lack evidence and must be migrated without changing IDs/titles.
- Task 9 `ArtifactSubmittedPayload` currently parses/stores only id/category/title, so evidence must be present in the contract parser and revalidated in `registerSubmittedArtifact` before projection mutation.
- The legacy adapter is the only permitted place to synthesize evidence. Its generated evidence must be explicitly marked with `legacy-summary` and still satisfy the chosen category's rules.
- Existing `ArtifactDetail` already omits Type/Source/Target/Version and places Status/responsibility first; it is a clean host for three independent evidence panels.
- Hub counts, Today Output title-list drilldown, Latest Handoff text, and carrier clickability are separate existing paths and should not receive evidence summaries.
- Event Console currently has only title/category/route fields. Category switches already reset route and messages; Task 10 must also replace the entire category-specific evidence draft so stale fields cannot leak into another kind.
- Evidence validation rules are naturally centralized in a domain module so API parsing, reducer validation, fixtures, and structured UI drafts share one contract without a runtime dependency.
- The completed evidence parser is the canonical runtime boundary for API, domain, and Console eligibility. Category/kind mismatches, required list items, safe preview protocols, non-negative counts, coverage bounds, and passed-report constraints are enforced identically.
- All seven initial fixtures now carry concise legal evidence; browser-created artifacts retain evidence intact through the business-event API and projection.
- The role-specific panels render React text nodes only, omit empty optionals and generic Type/Source/Target/Version metadata, and recheck preview URL protocols before rendering a new-window link.
- Browser inspection exposed a pre-existing hit-area issue: Rita's visible sprite intercepts physical clicks intended for the underlying QA workspace overview target. Keyboard/DOM activation of that accessible button works and was used to finish Task 10 acceptance; no Task 10 source changed the scene layering.

### Task 11

- Runtime-derived `artifact.delivered` and `artifact.received` must be appended before their applied state commits; presentation-only motion completions remain deliberately absent from the business ledger.
- Recovery can rebuild all business state with `mode: recovery`, then determine unfinished work from durable artifact statuses: `Delivering` maps to producer-to-Hub and `Collecting` maps to assignee-to-Hub. Scenario insertion order preserves ledger submission FIFO.
- A snapshot is an optimization, not authority: invalid snapshots fall back to sequence 1, while snapshot idempotency hashes plus incremental records restore cross-restart duplicate/conflict behavior.
- JSONL tail damage is recoverable only when the invalid record is the unterminated final line. Any corrupt middle line marks the store degraded and business POSTs return 503.
- Because presentation transitions increase projection revision but are intentionally not persisted, recovery needs a deterministic revision floor above any previously observable runtime revision. Reserving three revisions per durable sequence prevents same-epoch regression while keeping durable sequence separate for Task 12.
- Browser acceptance used the ignored local `.data` ledger and multiple abrupt Node process restarts. The stored artifact, notification, Hub state, Active Work, and Latest Handoff all recovered without replaying completed motion.

### Task 12

- Projection publication belongs after the application-store commit boundary, not inside the domain reducer: persisted business events and successful runtime transitions publish, while failed writes and duplicates do not create phantom snapshots.
- SSE cursor identity uses `epoch:revision`; durable `sequence` remains separate so presentation-only revisions can update clients without pretending to be ledger records.
- The publisher's bounded ring can replay a known cursor in order and deliberately returns the latest snapshot when a cursor is absent from the retained window.
- The frontend accepts only a higher revision within the same epoch or any higher epoch. This makes POST responses, SSE messages, recovery polling, and reset snapshots share one stale-update guard.
- Browser acceptance confirmed that EventSource is the steady-state transport: neither normal client made `/api/office-state` requests until the acceptance script explicitly fetched state for assertions.
- A real Chromium connection refusal is surfaced as a browser resource console diagnostic even when application code handles the EventSource error. Normal clients remained at zero console/page errors; only the isolated fault-injection page recorded the expected refused-resource messages.

### Task 13

- Vite's SSR build can bundle the TypeScript server and all local domain/application/storage modules into one Node 20 ESM entry without adding a runtime dependency; Node built-ins remain external.
- The external route parses only canonical v1 envelopes, checks the authenticated client's allowlist, and overwrites `source.system` before the shared application-store boundary. Derived events and motion/reset signals therefore cannot bypass the existing causal rules.
- Internal UI mutations remain usable on the standalone origin through browser `Sec-Fetch-Site`/Origin checks, while bearer clients are directed exclusively to `/api/v1/events`; the external route never accepts runtime or reset payloads.
- Static HTML runtime injection contains only the public Event Console boolean. API hashes stay in the server-only clients file, and fixture scripts require the plaintext key from their environment.
- Standalone shutdown closes SSE subscriptions before the HTTP listener and persists the store afterward. Browser restart acceptance recovered the same JSONL/snapshot state and Task 12's EventSource fallback/recovery behavior without Vite.
- The map's full-scene summary button is also physically covered by furniture in the current layer stack, similar to the previously documented QA workspace target. Its accessible DOM activation remains functional; Task 13 did not alter map layout or PNGs.

### Task 14

- Diagnostics stays outside the projection transaction: health/list/bundle failures are locally reported and cannot block Office Map, Inspect, Event Console, ledger commits, or SSE publication.
- Accepted/duplicate outcomes use a bounded in-memory summary store seeded from durable recent records; rejected summaries are read from the rotating ledger. Neither path retains or returns event payloads.
- Runtime health is system-level only: Gateway/Ledger/Projection status, epoch/revision/sequence, motion/queue counts, artifact-state aggregates, and the existing browser connection state. Employee activity, prompts, screen/input data, online duration, offline reasons, and AI-assistance metrics remain outside the model.
- The rejected ledger rotates before a write would exceed 5 MB and retains five historical files; recent reads merge current and rotated files while preserving a hard caller limit of 100.
- Real mobile visual inspection found that a flex-shrinking Inspector header could overlap a wrapped third tab. Making the header non-shrinking and using equal-width column-flow tabs removed the overlap without horizontal scrolling at 390×844.
- Browser fault injection must install and remove request routes in one automation call. Leaving a remote Playwright route handler across calls can stall later sessions even though the application and server remain healthy.
