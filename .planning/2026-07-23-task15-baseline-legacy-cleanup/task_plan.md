# Task 15 — Baseline Closure and Legacy Cleanup

## Objective

Leave the office demo with one event-driven product model, a reviewed and clean
working tree, and a recoverable local `main` baseline created only after explicit
user confirmation.

## Gates

1. **Workspace freeze and audit**
   - Record parent HEAD, status count, tracked diff, generated directory sizes,
     and the 40 pre-existing `images/**/*.png` hashes.
   - Preserve all user and Task 9–14 work.
2. **Legacy event removal**
   - Migrate tests to v1 business/runtime events.
   - Remove `/api/office-events`, `/api/office-reset`, `applyOfficeEvent`,
     `artifact.completed`, and legacy evidence construction.
   - Prove both old POST endpoints return 404.
3. **Story product removal**
   - Move `OrbState` to presentation types.
   - Remove the fixed Story controller/state/artifact/signal/playback code.
   - Rename the live actor/artifact presentation to runtime terminology.
4. **Generated artifact cleanup**
   - Ignore and remove temporary/build/Playwright output according to the
     approved allowlist.
   - Keep report evidence locally ignored and de-duplicate exact matches.
5. **Verification and baseline review**
   - Run targeted tests, full tests, asset verification, production build,
     whitespace checks, PNG comparison, and real-browser acceptance.
   - Audit and stage all intentional changes.
   - Stop for explicit user confirmation before creating the baseline commit.

## Commit boundary

Planned local commit on `main`:

```text
chore: establish event-driven office baseline
```

No branch, tag, pull request, or push is authorized.
