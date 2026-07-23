# Progress

## 2026-07-23

- Started Task 15 on explicitly authorized current `main`.
- Frozen parent HEAD and current dirty-worktree inventory.
- Captured the 40 pre-existing changed PNG hashes before Task 15 edits.
- Removed the legacy Office Event/reset APIs, adapter types, compatibility
  evidence, and gateway routes. Migrated their tests to v1 and added 404
  negative coverage for both Vite and standalone paths.
- Removed the fixed Story product model, controls, artifacts, signals, hooks,
  tests, and CSS. Moved `OrbState` and renamed the retained live sprites to
  runtime terminology.
- Cleaned generated output with an explicit report-evidence allowlist and added
  durable ignore rules.
- Real-browser recovery exposed a Hub-membership replay defect. Added a
  full-ledger/no-snapshot regression and moved Hub removal into the durable
  `artifact.received` reducer path.
- Final verification passed: 36 files / 192 tests, 12 asset tests, production
  build, whitespace check, 40/40 frozen PNG hashes, zero runtime legacy
  references, and standalone Chromium acceptance.
- Staged all 256 audited files: 10,026 insertions, 4,810 deletions, 40 formal
  image entries, and 85 tracked generated-output removals. The index has no
  whitespace errors and the worktree has no unstaged or untracked changes.
- The user explicitly confirmed the local `main` baseline commit on 2026-07-23.
  No branch, tag, pull request, or push is authorized.
