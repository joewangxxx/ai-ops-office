# Task 21–Task 22: Office navigation and live sync

## Goal

Implement the approved Task 21 and Task 22 specifications in strict order while preserving existing Task 15–Task 20 work and all PNG assets.

## Constraints

- No branch, commit, tag, PR, push, reset, checkout, restore, or unrelated deletion.
- Manual code and documentation changes use `apply_patch`.
- Do not modify `images/**/*.png`.
- Task 22 implementation starts only after Task 21 gates pass.

## Phases

### 1. Baseline and scope — complete

- Record Git state and PNG numstat.
- Read both approved specs and affected source/tests.
- Run `npm run verify` plus individual baseline commands.

### 2. Task 21 test-first implementation — complete

- Add Spec §9 scenario tests and verify each newly added test fails for the missing parent-navigation behavior.
- Implement typed Inspector frames/history, disclosure restoration, contextual Back, focus restoration, and safe projection/reset reconciliation.
- Run Task 21 tests, all checks, production/standalone build, desktop and mobile browser acceptance.
- Capture required Task 21 screenshots and record logs/errors in `progress.md`.

### 3. Task 21 gate — complete

- Confirm all Task 21 automated and browser acceptance criteria; only then start Task 22.

### 4. Task 22 test-first implementation — in progress

- Add Spec §12 tests for internal-only native `/ops` entry, projection-driven PRD counts, duplicate/conflict, FIFO, SSE/polling/restart/reset synchronization.
- Verify tests fail before the missing behavior is implemented.
- Implement smallest strictly typed changes using existing runtime config, Event → Ledger → Projection → SSE/polling path.
- Run focused and complete checks plus production/standalone build and two-tab desktop/mobile browser acceptance.

### 5. Final gates and report — pending

- Run required final commands and static scans.
- Verify no PNG changes and no browser console/page/unhandled-rejection errors.
- Write the required execution report with commands, outcomes, screenshots, risks, and non-actions.

## Acceptance gates

| Gate | Evidence |
| --- | --- |
| Task 21 | Spec §9 tests pass; required three screenshots; desktop/mobile navigation and clean logs |
| Task 22 | Spec §12 tests pass; required four screenshots; two-tab live sync, public-mode isolation, clean logs |
| Final | `npm test`, assets, build, diff check, PNG numstat, static scan, report |

## Completion status

- Task 22 implementation and browser acceptance: complete.
- Final verification and execution report: complete.
