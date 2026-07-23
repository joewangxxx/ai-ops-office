# Task 15 Event-Driven Baseline Report

Date: 2026-07-23
Branch: `main`
Baseline parent: `71d6e9a7f0743d40fa8c52e0dd58e22ab12e6519`

## Outcome

The Office Demo now has one product model: versioned Business Events write
durable domain facts, Runtime Events advance presentation motion, and the
projection is the only source rendered by the UI. The legacy Office Event API,
`artifact.completed` adapter, fixed Story state machine, and Story playback UI
have been removed.

The user explicitly authorized the recoverable local `main` baseline commit on
2026-07-23. This report is included in that baseline.

## Frozen workspace audit

The worktree was frozen before Task 15 without reset, checkout, or restore:

- 184 initial `git status --short` entries.
- 105 tracked files in the initial diff: 3,260 insertions and 1,036 deletions.
- 40 pre-existing modified formal PNGs under `images/`.
- Generated data before cleanup:
  - root `tmp`: 380 files / 159,805,939 bytes;
  - root `output`: 92 files / 71,793,467 bytes;
  - app `.playwright-cli`: 40 files / 1,194,958 bytes;
  - app `dist`: 121 files / 34,284,008 bytes;
  - app `dist-server`: 1 file / 103,012 bytes;
  - app `output`: 52 files / 25,700,783 bytes.

The final baseline intentionally contains the audited code, tests, documents,
planning history, fixtures, and all 40 pre-existing modified formal PNGs.
Generated build output, browser session state, temporary YAML, runtime ledgers,
and non-report screenshots are excluded.

## Legacy removal

Removed:

- `POST /api/office-events` and `POST /api/office-reset`;
- their Vite parser branches, API path entries, reset metadata, and standalone
  gateway routing;
- `applyOfficeEvent`, `OfficeEvent`, `ArtifactCompletedEvent`, and legacy
  evidence synthesis;
- `prdHandoffStory`, Story Controller, Story Artifact, Story Signals, fixed
  playback tests, and the old paused-position hooks;
- fixed Play/Pause/Resume/Next/Replay behavior and Story-only CSS.

Retained:

- `/api/business-events`;
- `/api/runtime-events`;
- `/api/office-state`;
- `/api/office-stream`;
- external `/api/v1/events`.

`OrbState` now lives in `src/types/officePresentation.ts`.
`RuntimeActorSprite` and `office-sprite--runtime-artifact` provide the live
motion presentation with `data-runtime-actor`; no runtime Story dependency
remains.

Repository searches over `src`, `server`, and runtime configuration found zero
matches for the removed API paths, `artifact.completed`, `applyOfficeEvent`,
legacy evidence creation, Story modules, old Story DOM/CSS names, or fixed
playback controls. The removed strings remain only in explicit negative
contract tests and historical design/planning records.

## Recovery correction found during browser acceptance

Restart testing with a complete ledger and no snapshot exposed one durable
projection defect: `artifact.received` recovered an accepted artifact at its
desk but left the ID in the Hub category list because Hub removal previously
occurred only inside a non-ledgered runtime transition.

A regression test now restarts from the full ledger without a snapshot and
asserts that the received artifact is absent from the Hub. The reducer removes
the Hub ID while applying the durable `artifact.received` fact, so both live and
recovery paths converge without replaying historical animation.

## Generated-data cleanup

`.gitignore` now excludes root `tmp`, every `.playwright-cli`, every
`dist-server`, `.data`, and Playwright output. Existing `dist` coverage remains.

Cleanup moved exact verified directories to the Windows Recycle Bin. It removed
root temporary data, tracked historical Task 7/8 and scheme-a browser output,
Playwright YAML/diagnostic state, build output, standalone runtime data, and
non-report evidence. Task 12's byte-identical third screenshot was removed and
the Task 9-14 report now points to the retained second screenshot.

During the first selective app-output cleanup, an unavailable PowerShell path
API caused the complete 52-file app output directory to be sent to the Recycle
Bin. This was detected immediately; the exact 23-file report allowlist was
restored and verified before work continued. No source or formal image was in
that directory. The duplicate and temporary files intentionally stayed
removed.

Final local ignored report evidence contains 27 files: the 23 retained Task
9-14 items plus four Task 15 artifacts. The following generated directories are
absent after verification: root `tmp`, root/app `.playwright-cli`, root
`output/playwright`, app `dist`, app `dist-server`, and app `.data`.

## Verification

| Gate | Result |
|---|---|
| Migrated legacy/domain/API tests | PASS - 13/13, after expected RED |
| Story/runtime presentation tests | PASS - 41/41, after expected RED |
| Full `npm test` | PASS - 36 files / 192 tests |
| `npm run verify:assets` | PASS - 1 file / 12 tests |
| `npm run build` | PASS - strict TypeScript, 60 frontend modules, 18 server modules |
| `git diff --check -- apps/office-demo docs` | PASS - exit 0 |
| `git diff --numstat -- images` | PASS - the same 40 binary entries |
| Frozen PNG SHA-256 comparison | PASS - 40/40 unchanged |
| Runtime legacy search | PASS - zero matches |

The full build was removed after the successful build gate because build output
is intentionally not part of the baseline.

## Real-browser and gateway acceptance

The built standalone server was tested in Chromium:

- Event Console submitted an Alice-to-Jack PRD; Jack explicitly accepted it and
  retained multiple Active Work entries.
- External Gateway Feature and Test Report fixtures were accepted; the Feature
  was explicitly accepted by Quinn.
- FIFO delivery, multiple Active Work entries, and Artifact Hub/Inspector
  rendering were verified.
- Restart from the same ledger recovered durable state with no active motion,
  no queued motion, and no historical animation replay.
- A deliberate server outage moved the client from SSE to polling fallback;
  restart restored SSE and stopped polling.
- A duplicate event returned `200 duplicate`.
- A schema-invalid event returned `400`; revision and artifact count were
  unchanged and the sanitized rejection appeared in mobile Diagnostics.
- Both removed standalone POST endpoints returned `404`.
- The downloaded diagnostic bundle contained 14 recent results and two
  sanitized rejections, with zero API-key, Authorization, evidence-secret,
  or absolute-workspace-path matches.
- Desktop motion, Artifact Hub, Inspector, and mobile Diagnostics rendered
  successfully.
- The fresh post-recovery browser session reported 0 console errors and
  0 warnings. The connection-refused messages from the separate deliberate
  outage session were expected fault-injection network events, not page errors.

Ignored Task 15 evidence:

- `apps/office-demo/output/playwright/task15-final-event-driven-chain.png`
- `apps/office-demo/output/playwright/task15-mobile-diagnostics.png`
- `apps/office-demo/output/playwright/task15-mobile-diagnostics-events.png`
- `apps/office-demo/output/playwright/task15-diagnostic-bundle.json`

## Baseline gate

The audited baseline is staged with no unstaged or untracked changes:

- 256 files;
- 10,026 insertions and 4,810 deletions;
- 55 source/server/config/fixture files;
- 40 test files;
- 35 documentation and planning files;
- 40 formal `images/**/*.png` entries;
- 85 tracked Playwright/generated-output removals;
- 1 existing tracked application screenshot.

The two other pre-existing tracked image changes are documentation/application
evidence: the seated contact sheet under `.planning` and
`apps/office-demo/screenshots/contextual-inspector-desktop.png`.

The user explicitly confirmed creation of the local `main` commit:

```text
chore: establish event-driven office baseline
```

No branch, tag, pull request, or push is authorized.
