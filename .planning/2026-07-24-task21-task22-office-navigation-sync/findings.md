# Findings

## Initial workspace state — 2026-07-24

- Existing uncommitted Task 15–Task 20 changes span server, Office/Operations application code, backend, styles, config and legacy tests. Several Event Console and Diagnostics files are intentionally deleted by prior work.
- The approved Task 21 and Task 22 specifications are untracked files and are the controlling design documents.
- `images` has no reported numstat changes at the initial inspection.
- Task 22 explicitly overrides the prior no-return-entry constraint only for an internal-mode, native new-tab `/ops` link on Office Summary. Office remains inspect-only.

## Implementation decisions

- Task 21 keeps the Inspector navigation state in `OfficeApp` as a typed frame plus LIFO history. Artifact list and Active Work actions supply a parent label and stable focus-target ID; only the Office-owned controlled path receives this navigation metadata, preserving legacy standalone `InspectorContent` callback behavior.
- Disclosure is controlled by the frame for artifact-parent metrics/categories. Latest Handoff remains local because it is not a navigation parent.
- Current Artifact disappearance is reconciled against the latest projection by returning to the nearest valid stored parent frame, otherwise Office Summary.
- Browser automation's `agent-browser` CLI can navigate and inspect this app, but its `screenshot`, `set viewport` follow-up, and console commands intermittently stall in this Node 20 environment. The browser itself remains live; mobile and Hub screenshots were captured through that live Chromium session's DevTools protocol after verifying the page state. This is an automation transport issue, not an application console/page error.
- `App` is the existing single resolver for `operationsConsoleEnabled`; prop-drilling it through `OfficeApp` -> `InspectorShell` -> `InspectorContent` keeps the Office entry configuration explicit and avoids repeated global configuration reads or a second runtime config store.
- Operations Overview already derives its Today counts from the same snapshot workspace output artifact IDs that drive Office Summary. The backend `artifact.submitted` projection appends each accepted ID only to the producer workspace's Today output; the existing ledger/store/hook suite retains idempotency, conflict, FIFO, SSE fallback/recovery, reset, and restart coverage.
- Browser validation identified and fixed one stale Operations Overview status comparison: Hub-ready runtime artifacts are `Awaiting Acceptance`, not `Available`. The count remains projection-derived and now agrees with the Office Hub state.
