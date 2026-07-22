# Production Seated Workstation Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the failing full-desk foreground composite with audited split workstation layers so seated heads, name tags, and chair backs remain readable at every online desk.

**Architecture:** Register the existing audited desk-back, narrow desk-foreground, and chair assets as production furniture layers. Derive seated avatar placement from each avatar's `visualSeatedBaseCenterSource`, render the chair on its own larger registration, and compute static decorations from the combined seated silhouette; movement decoration behavior remains unchanged.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite, Playwright.

## Global Constraints

- Preserve all pre-existing uncommitted changes; do not reset, checkout, or commit.
- Do not modify `images/avatars/**/*.png` or `images/scene/office-shell.png`.
- Do not modify backend events, polling, Artifact state, Active Work, or Handoff behavior.
- Reuse the existing audited derived furniture assets; do not call ImageGen unless browser validation proves they fail.
- Add no third-party dependencies.

---

### Task 1: Lock the production composite contract with failing tests

**Files:**
- Modify: `apps/office-demo/tests/task72-visual-calibration.test.tsx`
- Test: `apps/office-demo/tests/task72-visual-calibration.test.tsx`

**Interfaces:**
- Consumes: `officeLayout`, `calculateSeatedAvatarPresentation`, rendered `OfficeScene` DOM.
- Produces: regression requirements for `deskBack`, enlarged `chairBack`, narrow `deskForeground`, unoccluded heads, visible chair sides, and seated name tags below the chair.

- [ ] **Step 1: Write the failing tests**

Add assertions that the layout exposes `deskBack` and `deskForeground`, `DeskStation` renders both independent layers, all online seated presentations retain at least 500 visible chair-mask pixels in the audited geometry, and `staticDecorationAnchors.nameTag.y` equals `combinedBounds.bottom + 8` rather than `avatarBounds.top - 12`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- tests/task72-visual-calibration.test.tsx tests/avatar-presentation.test.tsx`

Expected: FAIL because production furniture has only `deskFront`, the chair is 210×210, and the seated name tag is above the hidden head.

### Task 2: Promote the audited five-layer workstation model

**Files:**
- Modify: `docs/office-layout.json`
- Modify: `apps/office-demo/src/data/officeLayout.ts`
- Modify: `apps/office-demo/src/components/office/DeskStation.tsx`
- Modify: `apps/office-demo/src/components/office/OfficeScene.tsx`
- Modify: `apps/office-demo/src/styles/app.css`

**Interfaces:**
- Consumes: `images/derived/alice-desk-back-clean-sample.png`, `images/derived/alice-desk-foreground-clean-sample.png`, `images/derived/alice-desk-chair-wide-sample.png`.
- Produces: `DeskStation` layers `deskBack | chairBack | deskForeground`; production layer order `deskBack -> chairBack -> avatar -> deskForeground`.

- [ ] **Step 1: Register existing assets without editing their pixels**

Register the three 1254×1254 RGBA assets with their audited source anchors. Use a 210×210 desk back/foreground and 260×260 chair.

- [ ] **Step 2: Render independent semantic layers**

Render desk back before chairs, chairs before avatars, and the narrow foreground after avatars. Preserve the existing accessible offline-desk selection target on the foreground layer.

- [ ] **Step 3: Run the focused tests and keep expected geometry failures isolated**

Run: `npm test -- tests/task72-visual-calibration.test.tsx`

Expected: layer tests pass; seated anchor tests remain red until Task 3.

### Task 3: Correct the seated plane and static decoration anchors

**Files:**
- Modify: `apps/office-demo/src/utils/avatarVisualBounds.ts`
- Modify: `apps/office-demo/src/components/office/AvatarSprite.tsx`
- Modify: `apps/office-demo/src/components/office/OfficeScene.tsx`
- Modify: `apps/office-demo/src/components/office/NameTag.tsx`
- Modify: `apps/office-demo/src/styles/app.css`
- Modify: `apps/office-demo/tests/avatar-presentation.test.tsx`

**Interfaces:**
- Produces: `calculateSeatedAvatarPresentation({ avatarAnchor, chairAnchor, ... })` returning avatar/chair/combined bounds and seated decorations; moving presentations retain `calculateAvatarDecorationAnchors` above-head behavior.

- [ ] **Step 1: Place avatar and chair on separate registered planes**

Use each pose's `visualSeatedBaseCenterSource` for the avatar. Use the audited chair source anchor and layout chair anchor; do not align the avatar bottom to the chair caster bottom.

- [ ] **Step 2: Compute seated-only decorations**

Set the seated name-tag anchor to the combined avatar/chair bottom plus 8 logical pixels and render it with a top-origin transform. Keep moving name tags above the active directional asset and keep offline fallback behavior unchanged.

- [ ] **Step 3: Verify GREEN**

Run: `npm test -- tests/task72-visual-calibration.test.tsx tests/avatar-presentation.test.tsx tests/task7-frontend-integration.test.tsx`

Expected: PASS.

### Task 4: Full regression and browser visual acceptance

**Files:**
- Create: `output/playwright/task7-2-seated-fix-final.png`

- [ ] **Step 1: Run complete automated verification**

Run: `npm test`, `npm run verify:assets`, `npm run build`, and `git diff --check -- apps/office-demo docs images/furniture images/derived`.

- [ ] **Step 2: Inspect real browser output**

At 1440×900, 1920×1080, and 1280×720 verify Alice, Jack, Kara, Quinn, and Rita: full heads, no name tag over monitor, visible chair outline, no overflow, and zero console errors/unhandled rejections.

- [ ] **Step 3: Preserve protected assets**

Confirm `images/avatars/**/*.png` and `images/scene/office-shell.png` have no writes from this task, record the final screenshot path, and do not create a Git commit.
