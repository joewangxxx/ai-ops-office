# Task 2 working-tree diff

## apps/office-demo/src/utils/avatarPresentation.ts

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-2-before\apps\office-demo\src\utils\avatarPresentation.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\src\utils\avatarPresentation.ts', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\src\\utils\\avatarPresentation.ts" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\utils\\avatarPresentation.ts"
index 39e5982..2f97187 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\src\\utils\\avatarPresentation.ts"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\utils\\avatarPresentation.ts"
@@ -1,5 +1,26 @@
+import type { ScenePoint } from '../data/officeLayout';
+
 export type SeatedAvatarPoseName = 'seatedIdleBack' | 'seatedWorkingBack';
+export type MovementDirection = 'up' | 'down' | 'horizontal';
+export type MovementAvatarPoseName = 'walk' | 'carry' | 'walkUp' | 'walkDown' | 'carryUp' | 'carryDown';
 
 export function resolveSeatedPose(hasActiveWork: boolean): SeatedAvatarPoseName {
   return hasActiveWork ? 'seatedWorkingBack' : 'seatedIdleBack';
 }
+
+export function directionBetween(from: ScenePoint, to: ScenePoint): MovementDirection {
+  const deltaX = to.x - from.x;
+  const deltaY = to.y - from.y;
+
+  if (Math.abs(deltaY) <= Math.abs(deltaX)) return 'horizontal';
+  return deltaY < 0 ? 'up' : 'down';
+}
+
+export function resolveMovementPose(
+  pose: 'walk' | 'carry',
+  direction: MovementDirection,
+): MovementAvatarPoseName {
+  if (direction === 'horizontal') return pose;
+  if (pose === 'walk') return direction === 'up' ? 'walkUp' : 'walkDown';
+  return direction === 'up' ? 'carryUp' : 'carryDown';
+}
` 

## apps/office-demo/src/story/prdHandoffStory.ts

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-2-before\apps\office-demo\src\story\prdHandoffStory.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\src\story\prdHandoffStory.ts', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\src\\story\\prdHandoffStory.ts" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\story\\prdHandoffStory.ts"
index feaa542..7f04017 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\src\\story\\prdHandoffStory.ts"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\story\\prdHandoffStory.ts"
@@ -1,18 +1,19 @@
 import {
   demoScenario,
   getHubArtifactCounts,
   type DemoScenario,
   type HandoffScenario,
   type HubArtifactCount,
 } from '../data/demoScenario';
 import { officeLayout, type ScenePoint } from '../data/officeLayout';
+import { directionBetween, type MovementDirection } from '../utils/avatarPresentation';
 
 export const prdHandoffStateOrder = [
   'ready',
   'pm-delivering',
   'prd-stored',
   'pm-returning',
   'dev-notified',
   'dev-collecting',
   'dev-returning',
   'dev-received',
@@ -34,20 +35,21 @@ export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'complete';
 export type StoryPose = 'atDesk' | 'walk' | 'carry';
 export type StoryActorId = 'alice' | 'jack' | 'quinn';
 export type OrbState = 'blue' | 'gray' | 'yellow';
 export type StoryArtifactCategory = 'prd' | 'feature';
 export type StoryArtifactLocation = 'desk' | 'carrier' | 'hub';
 
 export type StoryActor = {
   id: StoryActorId;
   deskId: string;
   pose: StoryPose;
+  direction?: MovementDirection;
   coordinate: ScenePoint;
 };
 
 export type StoryMotion = {
   actorId: StoryActorId;
   waypoints: ScenePoint[];
   transitionDurationMs: number;
 };
 
 export type StoryArtifact = {
@@ -112,22 +114,27 @@ const jackSubmittedFeature: HandoffScenario = { time: '10:36', summary: 'Jack su
 const quinnAcceptedFeature: HandoffScenario = { time: '10:39', summary: 'Quinn accepted Login Feature from Artifact Hub' };
 
 const stateIndex = (state: OfficeStoryState) => prdHandoffStateOrder.indexOf(state);
 const isAtOrAfter = (state: OfficeStoryState, target: OfficeStoryState) => stateIndex(state) >= stateIndex(target);
 
 function actorAtDesk(id: StoryActorId): StoryActor {
   const desk = actorDeskById[id];
   return { id, deskId: desk.id, pose: 'atDesk', coordinate: desk.seatAnchor };
 }
 
-function actorMoving(id: StoryActorId, pose: Exclude<StoryPose, 'atDesk'>, coordinate: ScenePoint): StoryActor {
-  return { id, deskId: actorDeskById[id].id, pose, coordinate };
+function actorMoving(
+  id: StoryActorId,
+  pose: Exclude<StoryPose, 'atDesk'>,
+  coordinate: ScenePoint,
+  direction: MovementDirection = 'horizontal',
+): StoryActor {
+  return { id, deskId: actorDeskById[id].id, pose, direction, coordinate };
 }
 
 function storyMotionFor(state: OfficeStoryState): StoryMotion | undefined {
   switch (state) {
     case 'pm-delivering':
       return { actorId: 'alice', waypoints: [aliceDesk.avatarAnchor, producerRoute.deskExit, producerRoute.staging, producerRoute.hubApproach], transitionDurationMs: 340 };
     case 'pm-returning':
       return { actorId: 'alice', waypoints: [producerRoute.hubApproach, producerRoute.staging, producerRoute.deskExit, producerRoute.deskReturn], transitionDurationMs: 340 };
     case 'dev-collecting':
       return { actorId: 'jack', waypoints: [jackDesk.avatarAnchor, consumerRoute.deskExit, consumerRoute.staging, consumerRoute.hubApproach], transitionDurationMs: 340 };
@@ -143,30 +150,40 @@ function storyMotionFor(state: OfficeStoryState): StoryMotion | undefined {
       return { actorId: 'quinn', waypoints: [qaConsumerRoute.hubApproach, qaConsumerRoute.staging, qaConsumerRoute.deskExit, qaConsumerRoute.deskReturn], transitionDurationMs: 340 };
     default:
       return undefined;
   }
 }
 
 function waypointFor(runtime: StoryRuntime, motion: StoryMotion) {
   return motion.waypoints[Math.min(runtime.waypointIndex, motion.waypoints.length - 1)]!;
 }
 
+function directionForWaypoint(runtime: StoryRuntime, motion: StoryMotion): MovementDirection {
+  const waypointIndex = Math.min(runtime.waypointIndex, motion.waypoints.length - 1);
+  const current = motion.waypoints[waypointIndex]!;
+  const from = waypointIndex === 0 ? current : motion.waypoints[waypointIndex - 1]!;
+  const to = waypointIndex === 0
+    ? motion.waypoints[Math.min(1, motion.waypoints.length - 1)]!
+    : current;
+  return directionBetween(from, to);
+}
+
 function actorsFor(runtime: StoryRuntime, motion: StoryMotion | undefined): StoryActor[] {
   const actors = [actorAtDesk('alice'), actorAtDesk('jack'), actorAtDesk('quinn')];
   const replaceActor = (actor: StoryActor) => {
     const index = actors.findIndex((item) => item.id === actor.id);
     actors[index] = actor;
   };
 
   if (motion) {
     const pose = runtime.state === 'pm-delivering' || runtime.state === 'dev-returning' || runtime.state === 'dev-delivering-feature' || runtime.state === 'qa-returning' ? 'carry' : 'walk';
-    replaceActor(actorMoving(motion.actorId, pose, waypointFor(runtime, motion)));
+    replaceActor(actorMoving(motion.actorId, pose, waypointFor(runtime, motion), directionForWaypoint(runtime, motion)));
     return actors;
   }
 
   if (runtime.state === 'prd-stored') replaceActor(actorMoving('alice', 'walk', producerRoute.hubApproach));
   if (runtime.state === 'feature-stored') replaceActor(actorMoving('jack', 'walk', devProducerRoute.hubApproach));
   return actors;
 }
 
 function artifactSlot(assetKey: StoryArtifact['assetKey']) {
   const wantedKey = `artifact.${assetKey}`;
` 

## apps/office-demo/src/components/office/StoryActorSprite.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-2-before\apps\office-demo\src\components\office\StoryActorSprite.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\src\components\office\StoryActorSprite.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\src\\components\\office\\StoryActorSprite.tsx" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\components\\office\\StoryActorSprite.tsx"
index 0cece4f..49843a6 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\src\\components\\office\\StoryActorSprite.tsx"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\components\\office\\StoryActorSprite.tsx"
@@ -1,26 +1,30 @@
 import { officeLayout, toPublicAssetPath, type ScenePoint } from '../../data/officeLayout';
 import type { StoryActor } from '../../story/prdHandoffStory';
+import { resolveMovementPose } from '../../utils/avatarPresentation';
 import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';
 import { usePausedScenePlacement } from '../../hooks/usePausedScenePlacement';
 
 type StoryActorSpriteProps = {
   actor: StoryActor;
   position: ScenePoint;
   transitionDurationMs: number;
   isPaused: boolean;
 };
 
 export function StoryActorSprite({ actor, isPaused, position, transitionDurationMs }: StoryActorSpriteProps) {
   const desk = officeLayout.desks.find((item) => item.id === actor.deskId)!;
   const actorKey = desk.occupant.avatarKey!;
-  const asset = officeLayout.assetAnchors.avatars.byActor[actorKey][actor.pose];
+  const presentationPose = actor.pose === 'atDesk'
+    ? actor.pose
+    : resolveMovementPose(actor.pose, actor.direction ?? 'horizontal');
+  const asset = officeLayout.assetAnchors.avatars.byActor[actorKey][presentationPose];
   const renderSize = officeLayout.assetAnchors.avatars.recommendedRenderSize;
   const placement = calculateScenePlacement({
     sceneAnchor: position,
     sourceAnchor: asset.visualFootShadowCenterSource,
     renderSize,
     sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
   });
   const pausedPlacement = usePausedScenePlacement<HTMLSpanElement>(
     toSceneRelativeStyle({ placement, renderSize, sceneSize: officeLayout.scene }),
     isPaused,
` 

## apps/office-demo/tests/avatar-presentation.test.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-2-before\apps\office-demo\tests\avatar-presentation.test.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\tests\avatar-presentation.test.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\tests\\avatar-presentation.test.tsx" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\avatar-presentation.test.tsx"
index 43ffbc4..ba471b8 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\tests\\avatar-presentation.test.tsx"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\avatar-presentation.test.tsx"
@@ -1,15 +1,17 @@
 import { render, screen } from '@testing-library/react';
 import { describe, expect, it, vi } from 'vitest';
 import { AvatarSprite } from '../src/components/office/AvatarSprite';
+import { StoryActorSprite } from '../src/components/office/StoryActorSprite';
 import { officeLayout, type RenderSize, type ScenePoint, type SourceRect } from '../src/data/officeLayout';
-import { resolveSeatedPose } from '../src/utils/avatarPresentation';
+import type { StoryActor } from '../src/story/prdHandoffStory';
+import { directionBetween, resolveMovementPose, resolveSeatedPose } from '../src/utils/avatarPresentation';
 import { calculateScenePlacement, toSceneRelativeStyle } from '../src/utils/scenePlacement';
 
 const avatarPoseKeys = [
   'idle',
   'atDesk',
   'walk',
   'carry',
   'seatedIdleBack',
   'seatedWorkingBack',
   'walkUp',
@@ -114,10 +116,60 @@ describe('seated avatar selection', () => {
 
     rerender(<AvatarSprite desk={desk} hasActiveWork onSelect={onSelect} />);
 
     expect(avatar).toHaveAttribute('data-avatar-pose', 'seatedWorkingBack');
     expect(avatar).toHaveStyle(expectedStyleFor('seatedWorkingBack'));
     expect(avatar.querySelector('img')).toHaveAttribute('src', '/avatars/Alice/seated-working-back.png');
     expect(avatar.innerHTML).not.toContain('at-desk.png');
     expect(avatar.innerHTML).not.toContain('seated-idle-back.png');
   });
 });
+
+describe('movement avatar selection', () => {
+  it.each([
+    [{ x: 0, y: 0 }, { x: 4, y: -6 }, 'up'],
+    [{ x: 0, y: 0 }, { x: -4, y: 6 }, 'down'],
+    [{ x: 0, y: 0 }, { x: 6, y: -4 }, 'horizontal'],
+    [{ x: 0, y: 0 }, { x: 6, y: -6 }, 'horizontal'],
+  ] as const)('classifies the delta from %o to %o as %s', (from, to, expectedDirection) => {
+    expect(directionBetween(from, to)).toBe(expectedDirection);
+  });
+
+  it.each([
+    ['walk', 'horizontal', 'walk'],
+    ['walk', 'up', 'walkUp'],
+    ['walk', 'down', 'walkDown'],
+    ['carry', 'horizontal', 'carry'],
+    ['carry', 'up', 'carryUp'],
+    ['carry', 'down', 'carryDown'],
+  ] as const)('resolves %s moving %s to %s', (pose, direction, expectedPose) => {
+    expect(resolveMovementPose(pose, direction)).toBe(expectedPose);
+  });
+
+  it.each([
+    ['walk', 'up', '/avatars/Alice/walk-up.png'],
+    ['walk', 'down', '/avatars/Alice/walk-down.png'],
+    ['walk', 'horizontal', '/avatars/Alice/walk.png'],
+    ['carry', 'up', '/avatars/Alice/carry-up.png'],
+    ['carry', 'down', '/avatars/Alice/carry-down.png'],
+    ['carry', 'horizontal', '/avatars/Alice/carry.png'],
+  ] as const)('renders the exact %s/%s asset', (pose, direction, expectedPath) => {
+    const actor: StoryActor = {
+      id: 'alice',
+      deskId: 'pm-alice',
+      pose,
+      direction,
+      coordinate: { x: 160, y: 465 },
+    };
+
+    render(
+      <StoryActorSprite
+        actor={actor}
+        isPaused={false}
+        position={actor.coordinate}
+        transitionDurationMs={340}
+      />,
+    );
+
+    expect(screen.getByTestId('moving-avatar-alice').querySelector('img')).toHaveAttribute('src', expectedPath);
+  });
+});
` 

## apps/office-demo/tests/task6-story-engine.test.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-2-before\apps\office-demo\tests\task6-story-engine.test.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\tests\task6-story-engine.test.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\tests\\task6-story-engine.test.tsx" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\task6-story-engine.test.tsx"
index 4bf238e..0d6c3e2 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-2-before\\apps\\office-demo\\tests\\task6-story-engine.test.tsx"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\task6-story-engine.test.tsx"
@@ -1,32 +1,39 @@
 import { describe, expect, it } from 'vitest';
+import { officeLayout } from '../src/data/officeLayout';
 import * as storyModule from '../src/story/prdHandoffStory';
+import { resolveMovementPose, type MovementDirection } from '../src/utils/avatarPresentation';
 
 type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'complete';
 
 type StoryRuntime = {
   state: string;
   playbackStatus: PlaybackStatus;
   waypointIndex: number;
 };
 
 type ProjectedArtifact = {
   id: string;
   category: 'prd' | 'feature';
   location: 'desk' | 'carrier' | 'hub';
   deskId?: string;
   carrierId?: string;
 };
 
 type ProjectedFrame = {
   state: string;
-  actors: Array<{ id: string; pose: string; coordinate: { x: number; y: number } }>;
+  actors: Array<{
+    id: string;
+    pose: 'atDesk' | 'walk' | 'carry';
+    direction?: MovementDirection;
+    coordinate: { x: number; y: number };
+  }>;
   artifacts: ProjectedArtifact[];
   signals: Array<{ kind: 'receiptBubble' | 'statusLabel'; text: string }>;
   orbs: Record<'alice' | 'jack' | 'quinn', 'blue' | 'gray' | 'yellow'>;
   hub: { counts: Array<{ category: string; count: number }> };
   latestHandoffs: Array<{ summary: string }>;
 };
 
 type StoryEngineContract = typeof storyModule & {
   createStoryRuntime: () => StoryRuntime;
   playStory: (runtime: StoryRuntime) => StoryRuntime;
@@ -64,20 +71,44 @@ describe('Task 6 generic office story engine', () => {
     expect(story.getStoryFrame(afterPausedTick).actors.find((actor) => actor.id === 'alice')?.coordinate).toEqual(
       beforePause.actors.find((actor) => actor.id === 'alice')?.coordinate,
     );
 
     const resumed = story.resumeStory(paused);
     expect(resumed.playbackStatus).toBe('playing');
     expect(resumed.waypointIndex).toBe(paused.waypointIndex);
     expect(story.advanceStoryWaypoint(resumed).waypointIndex).toBeGreaterThan(resumed.waypointIndex);
   });
 
+  it('keeps semantic carry while selecting up and down Carry assets from real PM route legs', () => {
+    const pmDelivering = moveTo('pm-delivering');
+    const firstActor = story.getStoryFrame({ ...pmDelivering, waypointIndex: 0 }).actors.find((actor) => actor.id === 'alice')!;
+    const laterActor = story.getStoryFrame({ ...pmDelivering, waypointIndex: 3 }).actors.find((actor) => actor.id === 'alice')!;
+
+    expect(firstActor).toMatchObject({ pose: 'carry', direction: 'up' });
+    expect(laterActor).toMatchObject({ pose: 'carry', direction: 'down' });
+
+    const firstAssetKey = resolveMovementPose('carry', firstActor.direction!);
+    const laterAssetKey = resolveMovementPose('carry', laterActor.direction!);
+    expect(officeLayout.assetAnchors.avatars.byActor.Alice[firstAssetKey].path).toBe('images/avatars/Alice/carry-up.png');
+    expect(officeLayout.assetAnchors.avatars.byActor.Alice[laterAssetKey].path).toBe('images/avatars/Alice/carry-down.png');
+  });
+
+  it('keeps non-motion hub hold actors on the generic walk presentation', () => {
+    const alice = story.getStoryFrame(moveTo('prd-stored')).actors.find((actor) => actor.id === 'alice')!;
+    const jack = story.getStoryFrame(moveTo('feature-stored')).actors.find((actor) => actor.id === 'jack')!;
+
+    expect(alice).toMatchObject({ pose: 'walk', direction: 'horizontal' });
+    expect(jack).toMatchObject({ pose: 'walk', direction: 'horizontal' });
+    expect(resolveMovementPose('walk', alice.direction!)).toBe('walk');
+    expect(resolveMovementPose('walk', jack.direction!)).toBe('walk');
+  });
+
   it('reaches complete only at QA Testing and replay restores all initial story evidence', () => {
     let runtime = story.playStory(story.createStoryRuntime());
     while (runtime.state !== 'qa-testing') runtime = story.advanceStoryState(runtime);
 
     expect(runtime.playbackStatus).toBe('complete');
 
     const replayed = story.replayStory();
     const frame = story.getStoryFrame(replayed);
     expect(replayed).toMatchObject({ state: 'ready', playbackStatus: 'idle' });
     expect(count(frame, 'prd')).toBe(1);
` 

