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

- [ ] **Step 1: Write failing pure and rendered-direction tests**

Assert negative dominant Y maps to up, positive dominant Y to down, equal/horizontal to generic; assert all six pose outputs. Render `StoryActorSprite` with up/down/horizontal walk/carry actors and assert exact selected paths. Add real-route assertions that the first and a later `pm-delivering` segment choose directional Carry assets while story pose remains `carry`.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- avatar-presentation.test.tsx task6-story-engine.test.tsx`.

Expected: FAIL because direction and directional registry selection are absent.

- [ ] **Step 3: Implement presentation direction additively**

At waypoint index 0 compare `waypoints[0]` to `waypoints[1]`; otherwise compare `waypoints[index-1]` to `waypoints[index]`. Store the result on the moving actor. `StoryActorSprite` resolves the registry key from semantic pose plus direction. Hub hold actors without `motion` keep `direction: 'horizontal'` and generic `walk`.

- [ ] **Step 4: Verify GREEN and compatibility**

Run the targeted test, then `npm test` and `npm run build`. Expected: all pass; no story-state order, timing, Artifact, Orb, or selection behavior changes.

---
