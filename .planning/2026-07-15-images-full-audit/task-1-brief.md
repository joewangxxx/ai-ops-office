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

- [ ] **Step 1: Write failing registry and selector tests**

Add tests that assert seven actors × ten exact keys, 70 unique avatar paths, 42 new paths present, 150×150 seated size, finite per-file source anchors, finite ten-desk `seatedBackAnchor`, `resolveSeatedPose(false) === 'seatedIdleBack'`, and `resolveSeatedPose(true) === 'seatedWorkingBack'`. Render an online desk twice and assert exact idle/working `img.src`, 150px placement input, absence of legacy `at-desk.png`, and absence of the unselected seated path.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- avatar-presentation.test.tsx static-office-map.test.tsx task41-static-calibration.test.tsx` from `apps/office-demo`.

Expected: FAIL because the six registry keys, new selector, seated render size, `seatedBackAnchor`, and `hasActiveWork` interface do not exist.

- [ ] **Step 3: Add the typed registry and JSON metadata**

Use the exact paths, `sourceAlphaBounds`, `visualSeatedBaseCenterSource`, movement foot anchors, sizes, and desk anchors from `.planning/2026-07-15-images-full-audit/new-avatar-metadata.json`. Keep the four legacy pose objects byte-for-byte in meaning. Define separate seated and movement asset types; do not cast away missing fields with optional properties.

- [ ] **Step 4: Add explicit Active Work wiring**

In `App.tsx`, derive a `ReadonlySet<string>` from `scenario.people.filter(person => Boolean(person.currentTask?.trim())).map(person => person.deskId)` and pass it to `OfficeScene`. Pass `activeWorkDeskIds.has(desk.id)` into `AvatarSprite`. Select the pose only through `resolveSeatedPose`, position through `desk.seatedBackAnchor` and `asset.visualSeatedBaseCenterSource`, and use the 150×150 seated render size.

- [ ] **Step 5: Verify GREEN and regressions**

Run the targeted test command again, then `npm test`. Expected: targeted tests pass; all existing Task 4.1/5/6 tests remain green.

---
