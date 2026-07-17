# Image Assets Scheme A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the approved 81-image visual baseline while losslessly sanitizing transparent RGB, registering all 70 avatar poses, and selecting seated/directional sprites from explicit work and route state.

**Architecture:** `docs/office-layout.json` remains the data-driven runtime asset registry. Static seated presentation uses `PersonScenario.currentTask` as the explicit Active Work signal; story semantics remain `atDesk | walk | carry`, with a separate presentation direction derived from the active waypoint segment. A deterministic Python transaction sanitizes only the fixed 35-file allowlist and proves decoded-pixel invariants before replacement.

**Tech Stack:** React 19, TypeScript 5.9, Vitest 3, Vite 6, Python 3.12, Pillow 11.1, NumPy 2.2, pytest 9.

## Global Constraints

- Work in the current dirty `main` checkout because five accepted, uncommitted sprite files are part of the required baseline. Do not reset, stash, clean, stage, commit, or overwrite unrelated changes.
- Active Work is exactly a non-empty `PersonScenario.currentTask`; do not infer it from `online`, Orb color, Artifact count/status, device activity, or story labels.
- Offline desks render no Avatar. An online desk without Active Work uses `seatedIdleBack`; an online desk with Active Work uses `seatedWorkingBack`.
- Preserve legacy `idle`, `atDesk`, `walk`, and `carry` registry entries and Task 6 semantic poses.
- Directional presentation is separate from semantic pose: negative dominant Y delta selects Up, positive dominant Y delta selects Down, and horizontal/equal-Y selects the generic legacy pose.
- At waypoint index 0, direction uses current→next; later indices use previous→current. Non-motion hub hold states retain generic `walk`.
- Seated render size is exactly 150×150; legacy/directional movement remains 180×180.
- Scene-side seated anchor is exactly `deskAnchor + (0,16)` and is stored as `seatedBackAnchor`; each seated file uses its own `visualSeatedBaseCenterSource`.
- Exact 42-asset metadata comes from `.planning/2026-07-15-images-full-audit/new-avatar-metadata.json`, which has been independently validated 42/42.
- Preserve layer order `desk-chair-back → avatar → desk-front`; registering paths must not preload unselected images.
- Sanitation target is the fixed 34 high-confidence files plus `images/avatars/Kara/walk-down.png`. Preserve all `alpha>0` RGBA and every Alpha value; preserve hidden RGB at Chebyshev distance ≤2 from visible alpha; clear only farther `alpha=0` RGB.
- Do not invoke ImageGen for PNG sanitation, registry, state logic, anchors, documentation, or compression. Use one built-in ImageGen edit per asset only if final composite QA identifies a real visual defect.
- All production behavior changes follow red-green-refactor. Binary promotion requires verified backup, candidate, journal, report, and rollback.

---

### Task 1: Register all avatar assets and activate seated work-state selection

**Files:**
- Create: `apps/office-demo/src/utils/avatarPresentation.ts`
- Create: `apps/office-demo/tests/avatar-presentation.test.tsx`
- Modify: `apps/office-demo/src/data/officeLayout.ts`
- Modify: `docs/office-layout.json`
- Modify: `apps/office-demo/src/app/App.tsx`
- Modify: `apps/office-demo/src/components/office/OfficeScene.tsx`
- Modify: `apps/office-demo/src/components/office/AvatarSprite.tsx`
- Modify: `apps/office-demo/tests/static-office-map.test.tsx`
- Modify: `apps/office-demo/tests/task41-static-calibration.test.tsx`

**Interfaces:**
- Produces `type SeatedAvatarPoseName = 'seatedIdleBack' | 'seatedWorkingBack'`.
- Produces `resolveSeatedPose(hasActiveWork: boolean): SeatedAvatarPoseName`.
- Expands `AvatarActorAssets` to all ten exact keys: `idle`, `atDesk`, `walk`, `carry`, `seatedIdleBack`, `seatedWorkingBack`, `walkUp`, `walkDown`, `carryUp`, `carryDown`.
- Adds `avatars.seatedRecommendedRenderSize = { width: 150, height: 150 }` and `DeskDefinition.seatedBackAnchor`.
- `AvatarSprite` consumes `hasActiveWork: boolean` and adds `data-avatar-pose` with the selected registry key.

- [x] **Step 1: Write failing registry and selector tests**

Add tests that assert seven actors × ten exact keys, 70 unique avatar paths, 42 new paths present, 150×150 seated size, finite per-file source anchors, finite ten-desk `seatedBackAnchor`, `resolveSeatedPose(false) === 'seatedIdleBack'`, and `resolveSeatedPose(true) === 'seatedWorkingBack'`. Render an online desk twice and assert exact idle/working `img.src`, 150px placement input, absence of legacy `at-desk.png`, and absence of the unselected seated path.

- [x] **Step 2: Run the test and verify RED**

Run: `npm test -- avatar-presentation.test.tsx static-office-map.test.tsx task41-static-calibration.test.tsx` from `apps/office-demo`.

Expected: FAIL because the six registry keys, new selector, seated render size, `seatedBackAnchor`, and `hasActiveWork` interface do not exist.

- [x] **Step 3: Add the typed registry and JSON metadata**

Use the exact paths, `sourceAlphaBounds`, `visualSeatedBaseCenterSource`, movement foot anchors, sizes, and desk anchors from `.planning/2026-07-15-images-full-audit/new-avatar-metadata.json`. Keep the four legacy pose objects byte-for-byte in meaning. Define separate seated and movement asset types; do not cast away missing fields with optional properties.

- [x] **Step 4: Add explicit Active Work wiring**

In `App.tsx`, derive a `ReadonlySet<string>` from `scenario.people.filter(person => Boolean(person.currentTask?.trim())).map(person => person.deskId)` and pass it to `OfficeScene`. Pass `activeWorkDeskIds.has(desk.id)` into `AvatarSprite`. Select the pose only through `resolveSeatedPose`, position through `desk.seatedBackAnchor` and `asset.visualSeatedBaseCenterSource`, and use the 150×150 seated render size.

- [x] **Step 5: Verify GREEN and regressions**

Run the targeted test command again, then `npm test`. Expected: targeted tests pass; all existing Task 4.1/5/6 tests remain green.

---

### Task 2: Select directional movement assets from waypoint deltas

**Files:**
- Modify: `apps/office-demo/src/utils/avatarPresentation.ts`
- Modify: `apps/office-demo/src/story/prdHandoffStory.ts`
- Modify: `apps/office-demo/src/components/office/StoryActorSprite.tsx`
- Modify: `apps/office-demo/tests/avatar-presentation.test.tsx`
- Modify: `apps/office-demo/tests/task6-story-engine.test.tsx`

**Interfaces:**
- Produces `type MovementDirection = 'up' | 'down' | 'horizontal'`.
- Produces `directionBetween(from: ScenePoint, to: ScenePoint): MovementDirection` using dominant-axis comparison.
- Produces `resolveMovementPose(pose: 'walk' | 'carry', direction: MovementDirection): 'walk' | 'carry' | 'walkUp' | 'walkDown' | 'carryUp' | 'carryDown'`.
- Adds optional presentation field `direction?: MovementDirection` to `StoryActor`; semantic `StoryPose` remains unchanged.

- [x] **Step 1: Write failing pure and rendered-direction tests**

Assert negative dominant Y maps to up, positive dominant Y to down, equal/horizontal to generic; assert all six pose outputs. Render `StoryActorSprite` with up/down/horizontal walk/carry actors and assert exact selected paths. Add real-route assertions that the first and a later `pm-delivering` segment choose directional Carry assets while story pose remains `carry`.

- [x] **Step 2: Run and verify RED**

Run: `npm test -- avatar-presentation.test.tsx task6-story-engine.test.tsx`.

Expected: FAIL because direction and directional registry selection are absent.

- [x] **Step 3: Implement presentation direction additively**

At waypoint index 0 compare `waypoints[0]` to `waypoints[1]`; otherwise compare `waypoints[index-1]` to `waypoints[index]`. Store the result on the moving actor. `StoryActorSprite` resolves the registry key from semantic pose plus direction. Hub hold actors without `motion` keep `direction: 'horizontal'` and generic `walk`.

- [x] **Step 4: Verify GREEN and compatibility**

Run the targeted test, then `npm test` and `npm run build`. Expected: all pass; no story-state order, timing, Artifact, Orb, or selection behavior changes.

---

### Task 3: Build and execute the transactional transparent-RGB sanitizer

**Files:**
- Create: `tools/sanitize_transparent_rgb.py`
- Create: `tests/test_transparent_rgb_sanitizer.py`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/manifest.json`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/backup/images/...`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/candidate/images/...`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/transaction.json`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/report.json`
- Modify: the fixed 35 target PNGs only after all candidates pass.

**Interfaces:**
- Produces `sanitize_rgba(image: Image.Image, radius: int = 2) -> tuple[Image.Image, SanitizeMetrics]`.
- CLI modes: `--dry-run` and `--apply`; both require `--root`, `--manifest`, and `--run-dir`.
- Manifest contains exact relative path and expected pre-sanitize SHA-256 for all 35 targets.

- [x] **Step 1: Write synthetic failing tests**

Cover alpha values 1/127/254/255, offsets 1/2/(2,2) preserved, offset 3 cleared, multiple islands, edge clipping, transparent-only, opaque-only, already-zero, idempotence, rejected non-RGBA/non-1254 live inputs, path escape/symlink rejection, hash mismatch, candidate re-decode, dry-run immutability, and rollback after injected replacement failure.

- [x] **Step 2: Run and verify RED**

Run: `python -m pytest tests/test_transparent_rgb_sanitizer.py -q` from repository root.

Expected: FAIL because the sanitizer module and CLI do not exist.

- [x] **Step 3: Implement the minimal deterministic sanitizer**

Use `visible = alpha > 0`, a Pillow `ImageFilter.MaxFilter(5)` mask for Chebyshev radius 2, and clear only `(~visible) & (~within_2px)`. Fail closed on path, hash, mode, size, PNG chunks, and candidate invariants. Generate and verify every candidate before replacing any source. Use verified byte backups, same-volume atomic replacement, a per-file journal, and rollback only committed targets on any error.

- [x] **Step 4: Verify unit GREEN and live dry run**

Run pytest, then a live `--dry-run`. Expected live metrics: 35 targets; 34-file group clears 43,261,598 RGB pixels; Kara clears exactly 1; no source hash changes.

- [x] **Step 5: Apply the transaction and re-verify**

Run `--apply` into a unique run directory. Expected: all 35 decoded images preserve every `alpha>0` RGBA value, full Alpha plane, mode, dimensions, bbox and visible-pixel hash; all far transparent RGB is zero; protected halo RGB is unchanged. Expected total bytes are approximately 10,502,131 versus 33,781,582 before, with decoded invariants governing over compressed byte exactness.

---

### Task 4: Add persistent asset gates and reconcile documentation

**Files:**
- Create: `apps/office-demo/tests/asset-manifest.test.ts`
- Create: `tools/audit_image_assets.py`
- Create: `tests/test_audit_image_assets.py`
- Modify: `apps/office-demo/package.json`
- Modify: `docs/office-assets-and-layout.md`
- Modify: `docs/avatar-asset-generation-report.md`
- Modify: `.planning/2026-07-15-images-full-audit/audit-report.md`

**Interfaces:**
- `asset-manifest.test.ts` proves 81 unique, exact-case, existing paths and IHDR dimension/color-type contracts from `officeLayout`.
- `audit_image_assets.py --root <repo> --layout docs/office-layout.json --json <report>` enforces decode, dimensions/mode, alpha occupancy, transparent corners, edge contact, strict visible `#00ff00`, transparent-RGB halo contract, SHA duplicates, compressed budgets, and category-specific shadow/glow policy reporting.
- Add package script `verify:assets` and aggregate `verify = npm test && npm run verify:assets && npm run build`; leave targeted `npm test -- <files>` behavior unchanged.

- [x] **Step 1: Write failing manifest/audit tests**

Assert the exact 81-path count, case-sensitive directory entries, PNG signature/IHDR, and synthetic audit failures for empty Alpha, edge contact, exact chroma, far hidden RGB, duplicate SHA, wrong mode/size, and category allowlists.

- [x] **Step 2: Run and verify RED**

Run targeted Vitest and pytest. Expected: FAIL because the gate scripts/tests and aggregate command do not exist.

- [x] **Step 3: Implement gates and update documentation**

Document all 42 new Avatar assets, split desk layers, seated/directional selection rules, 150/180 sizes, anchors, and on-demand DOM loading. Replace the stale seated alpha bounds for Bob/Jack/Kara/Leo/Rita with values from `new-avatar-metadata.json`. Correct audit size evidence to the halo-preserving live totals: 33,521,337→10,260,945 bytes for the 34-file group and 33,781,582→10,502,131 including Kara.

- [x] **Step 4: Verify GREEN**

Run `npm run verify` from `apps/office-demo` and pytest from the repository root. Expected: all frontend tests, image gates, sanitizer/auditor tests, TypeScript, and Vite build pass.

---

### Task 5: Runtime composite QA and conditional ImageGen repair

**Files:**
- Create: `.planning/2026-07-15-images-full-audit/scheme-a-runtime-desktop.png`
- Create: `.planning/2026-07-15-images-full-audit/scheme-a-runtime-contact-sheet.png`
- Create: `.planning/2026-07-15-images-full-audit/scheme-a-final-validation.json`
- Modify only if a visual failure exists: one failed PNG per ImageGen iteration.

- [x] **Step 1: Capture runtime evidence**

Run the Vite app, capture initial/working/idle and representative up/down Walk/Carry frames at the project viewport, and build a contact sheet that shows chair-back → avatar → desk-front occlusion and selected source path.

- [x] **Step 2: Apply strict visual acceptance**

Verify seven identities, strict rear seated orientation, legs inside chair area, Idle/Working arm-only state difference, directional semantics, Carry Artifact semantics, anchors, no clipping, no glow/shadow/chroma, and correct actual render scale.

- [x] **Step 3: Use ImageGen only for a failed asset**

If and only if Step 2 identifies a real sprite defect, load the local target and at most four role-labeled references with `view_image`, make one built-in `image_gen` edit using the approved prompt in `.planning/2026-07-15-images-full-audit/imagegen-prompts.md`, output flat `#00ff00`, remove it with the installed chroma helper, validate candidate/composite, and promote only after approval. If all cells pass, record `imagegen_calls: 0` and the reason `no_visual_asset_failure_after_runtime_integration`.

- [x] **Step 4: Final verification**

Run `npm run verify`, both Python test files, the full image audit, and compare all non-target image SHA values to `implementation-baseline.csv`. Record commands, exit codes, counts, ImageGen call count, changed paths, and evidence paths in `scheme-a-final-validation.json`.
