# AI OPS Office Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based, presales AI OPS Office Demo that visually explains Human + Agent co-pilot work and Artifact handoff across PM, Dev, and QA.

**Architecture:** Use a fixed 1672 x 941 logical office scene rendered with React, TypeScript, and absolutely positioned DOM layers. All visual state is driven by typed Demo Mode data: the same data contracts can later accept Live Mode events without introducing employee-screen monitoring.

**Tech Stack:** Vite, React, TypeScript, CSS, Vitest, React Testing Library, Playwright.

## Global Constraints

- First release is Demo Mode only; do not show a mode switch in the customer UI.
- Preserve the fixed-camera pixel-art scene and scale the whole map proportionally.
- Use only business events and Agent session state; never collect screen, keyboard, mouse, window, attendance reason, or detailed tool logs.
- Workspace means a small office/team, not one employee desk.
- Keep persistent map UI restrained: no permanent handoff lines, no map title, no Story Progress header, and no monitoring dashboard.
- Artifact types are blue PRD, green Feature, and purple Test Report.
- The only map notification bubbles are `新需求进入`, `收到 PRD`, and `收到 Feature`.

## Proposed File Structure

```text
apps/office-demo/
  package.json
  vite.config.ts
  src/
    app/App.tsx
    components/office/OfficeMap.tsx
    components/office/Desk.tsx
    components/office/Avatar.tsx
    components/office/ArtifactHub.tsx
    components/inspector/Inspector.tsx
    components/inspector/OfficeSummary.tsx
    components/inspector/WorkspaceOverview.tsx
    components/inspector/ArtifactDetail.tsx
    components/story/StoryController.tsx
    data/assets.ts
    data/demoScenario.ts
    data/officeLayout.ts
    types/office.ts
    hooks/useDemoStory.ts
    styles/tokens.css
    styles/app.css
    test/setup.ts
  tests/
    layout.test.ts
    inspector.test.tsx
    story.test.tsx
    e2e/office-demo.spec.ts
images/                         # existing approved asset source; Vite publicDir points here
docs/superpowers/specs/          # approved product spec
```

---

### Task 1: Freeze the scene contract and asset manifest

**Files:**
- Create: `docs/office-assets-and-layout.md`
- Create: `apps/office-demo/src/types/office.ts`
- Create: `apps/office-demo/src/data/assets.ts`
- Create: `apps/office-demo/src/data/officeLayout.ts`
- Test: `apps/office-demo/tests/layout.test.ts`

**Interfaces:**
- Produces `AssetKey`, `AvatarPose`, `DeskDefinition`, `WorkspaceDefinition`, `MapPoint`, and `OFFICE_LAYOUT`.
- All later map and story components consume the same `deskId`, `workspaceId`, and logical-coordinate values.

- [ ] Define the immutable scene coordinate system as `width: 1672`, `height: 941`, matching `images/scene/office-shell.png`.
- [ ] Inventory approved asset paths, including four poses for each available avatar, the three Artifact icons, the three Agent Orbs, the desk, and the Artifact Hub.
- [ ] Define each desk by a stable id, workspace, desk anchor, avatar anchor, name-tag anchor, and orb anchor. Store coordinates as logical map pixels, never browser pixels.
- [ ] Record the three Workspace boundaries: PM (left), Dev (right), QA (bottom), plus the central Hub point.
- [ ] Add the initial ten-seat demo layout: PM 2/3 online, Dev 3/4 online, QA 2/3 online. Use empty desks for the three offline seats.
- [ ] Write a unit test asserting unique desk ids, required anchors, and all anchors remain inside `1672 x 941`.
- [ ] Produce a screenshot of the coordinate-overlay diagnostic before removing the temporary overlay.

**Acceptance:** A developer can place any approved asset consistently from data alone; no component contains unexplained literal coordinates.

### Task 2: Create the runnable frontend shell

**Files:**
- Create: `apps/office-demo/package.json`
- Create: `apps/office-demo/vite.config.ts`
- Create: `apps/office-demo/src/main.tsx`
- Create: `apps/office-demo/src/app/App.tsx`
- Create: `apps/office-demo/src/styles/tokens.css`
- Create: `apps/office-demo/src/styles/app.css`
- Create: `apps/office-demo/src/test/setup.ts`

**Interfaces:**
- Consumes `OFFICE_LAYOUT` from Task 1.
- Provides a fixed map region, a right-side Inspector region, and a bottom-right Story Controller region.

- [ ] Initialize Vite React TypeScript in `apps/office-demo`.
- [ ] Configure Vite `publicDir` to use the existing root `images` directory without duplicating assets.
- [ ] Add Vitest, Testing Library, and Playwright configuration.
- [ ] Implement desktop layout: map takes available width, Inspector is fixed width, controller sits in the map’s lower-right corner.
- [ ] Implement narrow-screen behavior: map scales to fit and Inspector starts collapsed until an object is selected.
- [ ] Add a smoke test rendering `App` and asserting the scene, Inspector, and controller regions exist.

**Acceptance:** `npm run dev` opens a nonblank responsive app shell; `npm test` passes.

### Task 3: Assemble the static office map

**Files:**
- Create: `apps/office-demo/src/components/office/OfficeMap.tsx`
- Create: `apps/office-demo/src/components/office/Desk.tsx`
- Create: `apps/office-demo/src/components/office/Avatar.tsx`
- Create: `apps/office-demo/src/components/office/ArtifactHub.tsx`
- Modify: `apps/office-demo/src/app/App.tsx`
- Test: `apps/office-demo/tests/layout.test.ts`

**Interfaces:**
- Consumes `OFFICE_LAYOUT` and `AssetKey`.
- Emits `onSelect({ kind, id })` for workspace, online avatar, offline desk, and Hub selection.

- [ ] Render `office-shell.png` at the logical scene size with proportional CSS scaling only.
- [ ] Render ten desk layers at their desk anchors and the Artifact Hub at the Hub anchor.
- [ ] Render online avatars in their `at-desk` pose, color-customized name tags, and the correct gray/blue/yellow orb.
- [ ] Render offline seats as a desk plus gray name tag only; never place an Avatar or Orb on them.
- [ ] Make Workspace areas, online Avatars, offline desks, and the Hub keyboard-accessible click targets.
- [ ] Verify visually at desktop and narrow widths that no sprite overlaps a wall, another desk, or the Inspector.

**Acceptance:** The page immediately reads as three staffed office areas around a shared Artifact Hub, with 7/10 people online.

### Task 4: Implement the contextual Inspector

**Files:**
- Create: `apps/office-demo/src/components/inspector/Inspector.tsx`
- Create: `apps/office-demo/src/components/inspector/OfficeSummary.tsx`
- Create: `apps/office-demo/src/components/inspector/WorkspaceOverview.tsx`
- Create: `apps/office-demo/src/components/inspector/ArtifactDetail.tsx`
- Create: `apps/office-demo/src/data/demoScenario.ts`
- Modify: `apps/office-demo/src/app/App.tsx`
- Test: `apps/office-demo/tests/inspector.test.tsx`

**Interfaces:**
- `Selection = { kind: 'office' | 'workspace' | 'avatar' | 'offlineDesk' | 'hub' | 'artifact'; id?: string }`.
- `Inspector` consumes `Selection` and typed Demo Mode data.

- [ ] Implement default `Office Summary`: People Online 7/10, Today outputs, and at most three timestamped Latest Handoff rows.
- [ ] Make People Online and Today figures expand only to shallow Workspace or Artifact title lists.
- [ ] Implement Workspace Overview with Team online count, Today Output, and Inbox/In Progress/Outbox; omit Active Avatars, Overall Status, Current Focus, and Desk Status.
- [ ] Implement online Avatar Detail with name, role, Agent, current task only when present, and input Artifact only when applicable.
- [ ] Implement Offline Desk Detail with name, role, Offline, and Agent Not active; show no absence reason or duration.
- [ ] Implement Hub Overview and Artifact Detail; Artifact Detail shows title/version in one line, status, Submitted By, Confirmed By, and Accepted By only.
- [ ] Write tests covering selection changes and the absence of prohibited monitoring fields.

**Acceptance:** Clicking an object explains its business meaning without becoming a productivity-monitoring surface.

### Task 5: Build one vertical-slice handoff before the complete story

**Files:**
- Create: `apps/office-demo/src/hooks/useDemoStory.ts`
- Create: `apps/office-demo/src/components/story/StoryController.tsx`
- Modify: `apps/office-demo/src/components/office/OfficeMap.tsx`
- Modify: `apps/office-demo/src/data/demoScenario.ts`
- Test: `apps/office-demo/tests/story.test.tsx`

**Interfaces:**
- `StoryStep` contains `id`, `label`, `durationMs`, `patch`, `bubble?`, and optional `handoff`.
- `useDemoStory(steps)` exposes `play`, `pause`, `next`, `previous`, `replay`, and `currentStep`.

- [ ] Implement only the PM-submit-PRD to Dev-receive-PRD sequence first: PM carries PRD to Hub, Hub count updates, Dev receives `收到 PRD`, Dev retrieves the PRD, then Dev begins coding.
- [ ] Animate the character by changing logical position between named anchors; do not create a clickable route or permanent line.
- [ ] Ensure data-state changes happen after the handoff arrives, not at animation start.
- [ ] Make `Coding...` appear only after Dev returns from the Hub and its coding state actually starts.
- [ ] Add pause, previous, next, and replay controls; controller labels show business phase, never `Step n / 10`.
- [ ] Add fake-timer tests for state changes at the end of the handoff sequence.

**Acceptance:** This one sequence is polished enough to demonstrate the complete Human + Agent plus Artifact-Hub interaction model on its own.

### Task 6: Extend to the complete ten-step demo

**Files:**
- Modify: `apps/office-demo/src/data/demoScenario.ts`
- Modify: `apps/office-demo/src/hooks/useDemoStory.ts`
- Modify: `apps/office-demo/src/components/office/OfficeMap.tsx`
- Modify: `apps/office-demo/src/components/story/StoryController.tsx`
- Test: `apps/office-demo/tests/story.test.tsx`

- [ ] Add the 2-second idle state, followed by the ten approved steps: new requirement, PRD drafting, human confirmation, PRD storage, Dev notification, PRD retrieval, Feature development, Feature storage, QA testing, Test Report storage.
- [ ] Use bubbles only for `新需求进入`, `收到 PRD`, and `收到 Feature`; fade each after 3–5 seconds and keep them noninteractive.
- [ ] Show yellow orb blinking only during human-confirmation states; use blue only for active co-pilot assistance; default to gray when no active session exists.
- [ ] Run one foreground story event at a time while allowing only subtle background desk activity.
- [ ] Update Hub counts and Latest Handoff at each completed handoff; retain only the latest three rows.
- [ ] Stop on the completion state and expose `Replay Demo`; do not auto-loop or show a completion banner.
- [ ] Test the final state contains the Test Report, correct counts, and a replayable controller.

**Acceptance:** A customer can watch the entire PM → Dev → QA Artifact flow without reading separate instructions.

### Task 7: Validate presentation quality and handoff readiness

**Files:**
- Create: `apps/office-demo/tests/e2e/office-demo.spec.ts`
- Create: `docs/office-demo-qa-checklist.md`

- [ ] Add Playwright desktop screenshots for initial idle, PRD handoff, Dev coding, QA receipt, and completion state.
- [ ] Add a narrow-screen screenshot confirming map scaling and Inspector expansion on selection.
- [ ] Verify all images load with transparent backgrounds, including the three repaired Orbs and Jack’s four poses.
- [ ] Verify keyboard focus and selection for every interactive map object; verify bubbles, moving Artifacts, and handoff movement are not interactive.
- [ ] Review the finished demo against the ten product acceptance criteria in `docs/superpowers/specs/2026-07-09-ai-ops-office-demo-design.md`.
- [ ] Package the final run command and local demo URL for a mentor review.

**Acceptance:** The demo is presentation-ready, understandable in one viewing, and demonstrably avoids employee-monitoring claims.

## Sequencing

1. Execute Task 1 immediately. It is the present next task and produces the asset manifest plus coordinate table.
2. Execute Tasks 2–4 to obtain a clickable static demo.
3. Execute Task 5 as the first animation acceptance gate before expanding scope.
4. Execute Tasks 6–7 only after the vertical slice is approved visually.

## Plan Self-Review

- Covers the approved 2D office map, Workspace/team model, three-orb semantics, Artifact Hub, Inspector, limited bubbles, ten-step story, responsive behavior, privacy boundary, and completion behavior.
- Excludes full Workspaces, chat/code/test logs, employee activity monitoring, permanent handoff paths, and Live Mode UI controls.
- Every later component consumes the coordinate and Demo Mode data contracts produced by Task 1.
