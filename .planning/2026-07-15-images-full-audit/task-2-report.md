# Task 2 implementation report

## Status

Completed Task 2: story movement now derives presentation direction from waypoint deltas and selects directional walk/carry assets without changing semantic `StoryPose` values.

## Implemented scope

- Added `MovementDirection = 'up' | 'down' | 'horizontal'` in `apps/office-demo/src/utils/avatarPresentation.ts`.
- Added `directionBetween(from, to)` using dominant-axis comparison:
  - dominant negative Y maps to `up`;
  - dominant positive Y maps to `down`;
  - horizontal-dominant and equal-magnitude deltas map to `horizontal`.
- Added `resolveMovementPose(pose, direction)` for all six required results: `walk`, `carry`, `walkUp`, `walkDown`, `carryUp`, and `carryDown`.
- Added optional presentation-only `direction?: MovementDirection` to `StoryActor`; `StoryPose` remains exactly `atDesk | walk | carry`.
- Moving actors derive direction from the active route leg. Waypoint index 0 compares current to next; every later index compares previous to current.
- Non-motion Hub hold actors explicitly receive the default `horizontal` direction and retain generic semantic/presentation `walk`.
- Updated `StoryActorSprite` to resolve a registry key from semantic pose plus presentation direction. The existing unconditional hook flow remains intact, including the `atDesk` null render behavior.
- Added pure, rendered-path, real-route, semantic-pose, and Hub-hold regression coverage.

## TDD evidence

Pre-change focused baseline:

`npm test -- avatar-presentation.test.tsx task6-story-engine.test.tsx`

- Exit 0: 2 test files passed, 11 tests passed.

RED command after test-only edits:

`npm test -- avatar-presentation.test.tsx task6-story-engine.test.tsx`

- Exit 1 as expected: 2 test files failed, 16 tests failed, and 13 compatibility tests passed.
- Failures were specific to the missing direction/pose helpers, absent actor direction metadata, and generic-only sprite asset lookup.
- No production code had been edited before this RED run.

Focused GREEN command after the minimal implementation:

`npm test -- avatar-presentation.test.tsx task6-story-engine.test.tsx`

- Exit 0: 2 test files passed, 29 tests passed.

Full regression command:

`npm test`

- Exit 0: 8 test files passed, 47 tests passed.

Build verification:

`npm run build`

- Exit 0: TypeScript project build and Vite production build succeeded; 53 modules transformed.

## Requirement and self-review audit

- Pure tests cover negative dominant Y, positive dominant Y, horizontal dominance, and equal-magnitude dominance.
- Pose tests cover all six resolver outputs.
- Render tests assert the exact Alice paths for up/down/horizontal walk and carry actors.
- Real `pm-delivering` route tests assert the first leg selects `carryUp`, a later leg selects `carryDown`, and both actors retain semantic pose `carry`.
- Non-motion `prd-stored` and `feature-stored` hold actors remain `walk` with `horizontal` presentation.
- Manual review found no story state-order, timing, Artifact, Orb, selection, React hook-order, or scope changes.
- `git diff --check` exited 0 for the Task 2 files; its only output was the repository's existing Windows LF-to-CRLF normalization warning for tracked files.

## Files in Task 2 scope

- `apps/office-demo/src/utils/avatarPresentation.ts`
- `apps/office-demo/src/story/prdHandoffStory.ts`
- `apps/office-demo/src/components/office/StoryActorSprite.tsx`
- `apps/office-demo/tests/avatar-presentation.test.tsx`
- `apps/office-demo/tests/task6-story-engine.test.tsx`

## Safety and repository state

- No PNG or other image asset was modified.
- No ImageGen operation was used.
- No reset, stash, clean, stage, commit, branch, or push operation was performed.
- Existing user-owned and Task 1 working-tree changes were preserved.

## Concerns

None blocking. The shared checkout remains intentionally dirty, and the Task 1-created avatar presentation utility/test files remain untracked because staging and commits were explicitly out of scope.
