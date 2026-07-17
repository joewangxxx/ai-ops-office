# Task 1 implementation report

## Status

Completed Task 1: all avatar assets are registered, static seated avatars select idle/working presentation from explicit Active Work, and existing story pose semantics remain unchanged.

## Implemented scope

- Added `SeatedAvatarPoseName` and `resolveSeatedPose(hasActiveWork)` in `apps/office-demo/src/utils/avatarPresentation.ts`.
- Expanded `AvatarActorAssets` to the exact ten keys for all seven registered actors.
- Added required, distinct seated and movement asset types with non-optional per-file anchor metadata.
- Added the 42 authoritative asset records, `seatedRecommendedRenderSize` (150×150), `movementRecommendedRenderSize` (180×180), and all ten `seatedBackAnchor` values to `docs/office-layout.json`.
- Kept the four legacy pose records and semantic `AvatarPoseName`/`StoryPose` behavior intact.
- Derived `activeWorkDeskIds: ReadonlySet<string>` from non-empty trimmed `PersonScenario.currentTask` values in `App.tsx` and passed it through `OfficeScene`.
- Updated `AvatarSprite` to select only through `resolveSeatedPose`, align `visualSeatedBaseCenterSource` to `seatedBackAnchor`, render at 150×150, and expose the selected key as `data-avatar-pose`.
- Updated the static-map and Task 4.1 calibration assertions for seated-back presentation without changing story timing, movement, selection, Artifact, or Orb behavior.

## TDD evidence

RED command:

`npm test -- avatar-presentation.test.tsx static-office-map.test.tsx task41-static-calibration.test.tsx`

- Exit 1 as expected.
- `avatar-presentation.test.tsx` and `static-office-map.test.tsx` failed because `avatarPresentation` did not exist.
- `task41-static-calibration.test.tsx` failed because `seatedBackAnchor` was absent.

Focused GREEN command:

`npm test -- avatar-presentation.test.tsx static-office-map.test.tsx task41-static-calibration.test.tsx`

- Exit 0: 3 test files passed, 11 tests passed.

Final regression command:

`npm test`

- Exit 0: 8 test files passed, 29 tests passed.

Build verification:

`npm run build`

- Exit 0: TypeScript project build and Vite production build succeeded; 53 modules transformed.

## Metadata and scope audit

- Registry audit: 7 actors, 10 poses per actor, 70 paths, 70 unique paths.
- Authoritative comparison: zero mismatches across all 42 new asset objects and all ten desk anchors versus `.planning/2026-07-15-images-full-audit/new-avatar-metadata.json`.
- Sizes verified: seated 150×150 and movement 180×180.
- `git diff --check` passed for every Task 1 file.
- No image generation, PNG edits, staging, commits, resets, stashes, or cleanup operations were performed.
- Existing dirty-checkout work and the five accepted sprite files were left untouched.

## Self-review

Manual review found no remaining correctness, compatibility, or scope issues. One stale layout description was corrected so the documented seated placement convention now matches `seatedBackAnchor`/`visualSeatedBaseCenterSource` while explicitly retaining legacy `atDesk`/`seatAnchor` compatibility. CodeRabbit CLI was not installed, so the requested self-review used direct diff inspection, exact metadata comparison, the full regression suite, and the production build.

## Files in Task 1 scope

- `apps/office-demo/src/utils/avatarPresentation.ts`
- `apps/office-demo/tests/avatar-presentation.test.tsx`
- `apps/office-demo/src/data/officeLayout.ts`
- `docs/office-layout.json`
- `apps/office-demo/src/app/App.tsx`
- `apps/office-demo/src/components/office/OfficeScene.tsx`
- `apps/office-demo/src/components/office/AvatarSprite.tsx`
- `apps/office-demo/tests/static-office-map.test.tsx`
- `apps/office-demo/tests/task41-static-calibration.test.tsx`

## Concerns

None blocking. The checkout remains intentionally dirty with pre-existing overlapping Task 4.1/Task 6 work; no commit was created, as required.
