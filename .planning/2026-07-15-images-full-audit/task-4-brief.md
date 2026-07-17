# Task 4 Brief — Persistent Asset Gates and Documentation Reconciliation

## Shared constraints

- Work in the current dirty `main` checkout. Do not reset, stash, clean, stage, commit, or overwrite unrelated changes.
- Do not modify any file below `images/`.
- Do not call ImageGen; Scheme A reserves it for a genuine visual defect found during final runtime composite QA.
- Use strict red-green-refactor for executable behavior and report the exact RED/GREEN commands and outcomes.
- The authoritative registry is `docs/office-layout.json`; the authoritative fixed image inventory is the 81 paths reachable from that registry.

## Frontend manifest gate

- Create `apps/office-demo/tests/asset-manifest.test.ts`.
- Prove exactly 81 unique registered image paths, exact-case filesystem resolution, existing regular files, PNG signature and IHDR contracts.
- Expected contracts: the office scene is 1672×941 RGB PNG; all other registered assets are 1254×1254 RGBA PNG.
- Modify `apps/office-demo/package.json` with `verify:assets` and aggregate `verify = npm test && npm run verify:assets && npm run build`; targeted `npm test -- <files>` must remain unchanged.

## Python audit gate

- Create `tools/audit_image_assets.py` and `tests/test_audit_image_assets.py`.
- CLI: `--root <repo> --layout docs/office-layout.json --json <report>`.
- Enforce registry completeness/uniqueness/exact case; decode, dimensions/mode; nonempty Alpha; transparent corners; no visible edge contact; no visible exact `#00ff00`; the 2px Chebyshev transparent-RGB halo contract; duplicate SHA reporting/failure; compressed-size budgets; and category-specific shadow/glow policy reporting.
- Synthetic tests must cover empty Alpha, edge contact, exact chroma, far hidden RGB, duplicate SHA, wrong mode/size, and category allowlists.
- The real 81-file repository must pass without weakening the stated contracts. If category thresholds require explicit policy/allowlists, encode and document them rather than silently ignoring failures.

## Documentation reconciliation

- Modify `docs/office-assets-and-layout.md`, `docs/avatar-asset-generation-report.md`, and `.planning/2026-07-15-images-full-audit/audit-report.md`.
- Document all 42 new Avatar files, split desk layers, Active Work selection, direction rules, 150/180 render sizes, seated/source anchors, layer order, and on-demand DOM loading.
- Replace stale seated alpha bounds for Bob, Jack, Kara, Leo, and Rita with values from `.planning/2026-07-15-images-full-audit/new-avatar-metadata.json`.
- Correct sanitation evidence to 33,521,337→10,260,945 bytes for the 34-file group and 33,781,582→10,502,131 including Kara; 43,261,599 pixels were cleared across 35 targets.
- Reconcile the old audit from “unwired/P0” to the implemented Scheme A state without rewriting historical evidence as if it never existed.

## Required completion checks

- Frontend: focused Vitest, then `npm run verify` from `apps/office-demo`.
- Python: focused auditor tests, then both image-tool test files from repository root.
- Real CLI: write a JSON report under `.planning/2026-07-15-images-full-audit/` and exit 0.
- Each worker must summarize changed files, tests, known limitations, and must not stage or commit.
