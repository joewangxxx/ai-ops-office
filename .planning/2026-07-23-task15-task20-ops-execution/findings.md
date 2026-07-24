# Findings

## Initial repository state

- Pre-existing untracked files include all six approved specs, `docs/task15-task20-ops-console-goal-prompt.md`, and `.planning/2026-07-23-task15-task20-ops-specs/`; `.planning/.active_plan` was already modified. These changes are preserved.
- Head is `5e6dcb9 chore: establish event-driven office baseline`.
- Initial `git diff --numstat -- images` had no output; no PNG work is in scope.
- Baseline `npm run verify` passed: 36 test files / 192 tests, asset verification, and application/server builds.

## Existing implementation anchors

- `src/app/App.tsx` currently owns Office scene, backend connection, motion runner, and Inspector tabs.
- `src/hooks/useOfficeBackend.ts` already performs one page-level SSE connection with polling fallback/recovery and exposes standard business-event methods.
- `src/backend/businessEvents.ts`, `officeDomain.ts`, ledger/store/publisher layers already define the event-driven Artifact lifecycle.
- `src/components/inspector/EventConsole.tsx` and `DiagnosticsPanel.tsx` are migration sources, not components to duplicate.
- Standalone configuration currently exposes `eventConsoleEnabled`; it must be replaced by the sole `operationsConsoleEnabled` boundary.

## Approved design decisions

- The six supplied specifications are the approved design. No product-option re-evaluation is needed.
- `/ops` is command/write plus internal sanitized reads; `/office` is projection/read plus existing artifact acceptance only.
- Assignment and acceptance remain separate. Counts, notification, hub state, motions, and active work are projection-derived.

## Task 15 UI direction

- The Operations shell will use a restrained, dense control-room treatment: dark blue-black surface, cool cyan only for focus/connection state, slate structure, text labels beside all states, 6–8px maximum card radius, and no gradients or Office artwork.
- The distinctive element is the fixed status strip that makes the projection connection mode legible without impersonating employee presence. It is operational information, not decoration.

## Task 17 verification notes

- A People row is derived only from the scenario projection and layout mapping. Assignment counts come from sanitized notifications; the confirm action only calls the existing `artifact.accepted` command path.
- The real production flow proved independent assignment and acceptance: Alice submitted a PRD to Jack, the People drawer exposed the available assignment, and accepting it removed the pending item and added active work in the existing open view.
- Detail drawers are modal to assistive technology, focus their close action on entry, close on Escape, and restore focus to the triggering person control. The mobile drawer uses the existing responsive full-screen treatment.

## Task 18 verification notes

- Baseline scenario data can contain a Hub membership and an existing active-work record for the same Artifact. The centralized selector resolves the more specific active-work fact first, so the Registry has exactly one current Operations lifecycle state without inventing historical timestamps.
- Artifact list timestamps are derived only from persisted lifecycle events. Baseline rows deliberately render `Baseline` in the Updated column rather than a fabricated date.
- Pagination cursors are opaque and bind the current epoch, revision, sort key, and artifact ID. A changed projection invalidates a stale cursor and resets the client to a fresh first page, avoiding offset-based duplicates or omissions.
- Development and standalone server paths now use the same sanitized Registry read model. The detailed timeline reads the complete persisted ledger chain by artifact ID, correlation ID, and causation ID; it does not use display-text matching.

## Task 19 verification notes

- The Events read model combines persisted accepted ledger envelopes, persisted rejected-event diagnostics, and recent sanitized outcome results for duplicates/conflicts. It exposes only timestamp, event identity, source, correlation, result, and optional reason code; Evidence and request bodies never cross this boundary.
- Rejected validation records survive a standalone restart through the existing rejected-event ledger. Short-lived duplicate/conflict results are deliberately held in the existing EventResultStore and are available in the active operations session without creating a second persistence store.
- The System page reads diagnostic and rejected-event endpoints independently; an outage of either leaves reset and the last successful diagnostics render usable. Its reset control submits the existing standard `projection.reset` event with source `operations-system`, then waits for the normal projection/SSE path instead of clearing local state.
- Vite now serves the same Events and diagnostics read endpoints as the standalone gateway, so local development does not silently render a different Operations surface.

## Task 20 verification notes

- The approved cleanup is a component relocation rather than a second feature implementation: the shared form now lives at `components/operations/DispatchEventForm.tsx`, uses `operations-dispatch` as its command source, and has no reset path. `OperationsSystem` is the sole UI reset entry point.
- `OfficeApp` and `InspectorShell` now carry only projection/Inspect requirements. The removed runtime flags (`eventConsoleEnabled`, `diagnosticsEnabled`) and their Inspector-only props, tab state, wrappers, and styles have no source references.
- The older inspector-tab and reset-only tests were superseded by the approved Task 20 boundary and removed. The retained full suite covers the shared event ledger, duplicate/conflict semantics, multi-work state, FIFO, durable restart, reset epochs, SSE fallback/recovery, public routes, and redaction.
- Production browser verification on port 4176 submitted an Alice-to-Jack PRD from Dispatch and confirmed its arrival in the Office projection (PRD count 1 to 2), then accepted it through People. The Office count returned to 1 after the live handoff completed, demonstrating the two pages consume the same projection instead of a fixed animation.
