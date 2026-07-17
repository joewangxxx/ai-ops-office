# Task 1 working-tree diff

## apps/office-demo/src/utils/avatarPresentation.ts

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\src\utils\avatarPresentation.ts', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\utils\\avatarPresentation.ts.__ABSENT__" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\utils\\avatarPresentation.ts"
index 5f28270..39e5982 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\utils\\avatarPresentation.ts.__ABSENT__"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\utils\\avatarPresentation.ts"
@@ -1 +1,5 @@
-﻿
\ No newline at end of file
+export type SeatedAvatarPoseName = 'seatedIdleBack' | 'seatedWorkingBack';
+
+export function resolveSeatedPose(hasActiveWork: boolean): SeatedAvatarPoseName {
+  return hasActiveWork ? 'seatedWorkingBack' : 'seatedIdleBack';
+}
` 

## apps/office-demo/tests/avatar-presentation.test.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\tests\avatar-presentation.test.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\tests\\avatar-presentation.test.tsx.__ABSENT__" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\avatar-presentation.test.tsx"
index 5f28270..43ffbc4 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\tests\\avatar-presentation.test.tsx.__ABSENT__"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\avatar-presentation.test.tsx"
@@ -1 +1,123 @@
-﻿
\ No newline at end of file
+import { render, screen } from '@testing-library/react';
+import { describe, expect, it, vi } from 'vitest';
+import { AvatarSprite } from '../src/components/office/AvatarSprite';
+import { officeLayout, type RenderSize, type ScenePoint, type SourceRect } from '../src/data/officeLayout';
+import { resolveSeatedPose } from '../src/utils/avatarPresentation';
+import { calculateScenePlacement, toSceneRelativeStyle } from '../src/utils/scenePlacement';
+
+const avatarPoseKeys = [
+  'idle',
+  'atDesk',
+  'walk',
+  'carry',
+  'seatedIdleBack',
+  'seatedWorkingBack',
+  'walkUp',
+  'walkDown',
+  'carryUp',
+  'carryDown',
+] as const;
+
+const newlyRegisteredPoseFiles = {
+  seatedIdleBack: 'seated-idle-back.png',
+  seatedWorkingBack: 'seated-working-back.png',
+  walkUp: 'walk-up.png',
+  walkDown: 'walk-down.png',
+  carryUp: 'carry-up.png',
+  carryDown: 'carry-down.png',
+} as const;
+
+function expectFinitePoint(point: ScenePoint) {
+  expect(Number.isFinite(point.x)).toBe(true);
+  expect(Number.isFinite(point.y)).toBe(true);
+}
+
+function expectFiniteRect(rect: SourceRect) {
+  expectFinitePoint(rect);
+  expect(Number.isFinite(rect.width)).toBe(true);
+  expect(Number.isFinite(rect.height)).toBe(true);
+}
+
+describe('avatar presentation registry', () => {
+  it('registers ten anchored, unique assets for each of the seven actors', () => {
+    const actorEntries = Object.entries(officeLayout.assetAnchors.avatars.byActor);
+    const allPaths: string[] = [];
+    const newPaths: string[] = [];
+
+    expect(actorEntries).toHaveLength(7);
+    expect(officeLayout.assetAnchors.avatars.seatedRecommendedRenderSize).toEqual({ width: 150, height: 150 });
+
+    for (const [actorName, assets] of actorEntries) {
+      expect(Object.keys(assets)).toEqual(avatarPoseKeys);
+
+      for (const poseName of avatarPoseKeys) {
+        const asset = assets[poseName];
+        allPaths.push(asset.path);
+        expectFiniteRect(asset.sourceAlphaBounds);
+
+        if ('visualSeatedBaseCenterSource' in asset) {
+          expectFinitePoint(asset.visualSeatedBaseCenterSource);
+        } else {
+          expectFinitePoint(asset.visualFootShadowCenterSource);
+        }
+      }
+
+      for (const [poseName, fileName] of Object.entries(newlyRegisteredPoseFiles)) {
+        const path = assets[poseName as keyof typeof newlyRegisteredPoseFiles].path;
+        expect(path).toBe(`images/avatars/${actorName}/${fileName}`);
+        newPaths.push(path);
+      }
+    }
+
+    expect(allPaths).toHaveLength(70);
+    expect(new Set(allPaths)).toHaveProperty('size', 70);
+    expect(newPaths).toHaveLength(42);
+    expect(new Set(newPaths)).toHaveProperty('size', 42);
+  });
+
+  it('provides a finite seated-back anchor for every desk', () => {
+    expect(officeLayout.desks).toHaveLength(10);
+    for (const desk of officeLayout.desks) {
+      expectFinitePoint(desk.seatedBackAnchor);
+    }
+  });
+});
+
+describe('seated avatar selection', () => {
+  it('selects idle without Active Work and working with Active Work', () => {
+    expect(resolveSeatedPose(false)).toBe('seatedIdleBack');
+    expect(resolveSeatedPose(true)).toBe('seatedWorkingBack');
+  });
+
+  it('renders only the selected 150px seated asset at the seated-back anchor', () => {
+    const desk = officeLayout.desks.find((item) => item.id === 'pm-alice')!;
+    const onSelect = vi.fn();
+    const renderSize: RenderSize = { width: 150, height: 150 };
+    const expectedStyleFor = (pose: 'seatedIdleBack' | 'seatedWorkingBack') => {
+      const placement = calculateScenePlacement({
+        sceneAnchor: desk.seatedBackAnchor,
+        sourceAnchor: officeLayout.assetAnchors.avatars.byActor.Alice[pose].visualSeatedBaseCenterSource,
+        renderSize,
+        sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
+      });
+      return toSceneRelativeStyle({ placement, renderSize, sceneSize: officeLayout.scene });
+    };
+
+    const { rerender } = render(<AvatarSprite desk={desk} hasActiveWork={false} onSelect={onSelect} />);
+    const avatar = screen.getByTestId('avatar-pm-alice');
+
+    expect(avatar).toHaveAttribute('data-avatar-pose', 'seatedIdleBack');
+    expect(avatar).toHaveStyle(expectedStyleFor('seatedIdleBack'));
+    expect(avatar.querySelector('img')).toHaveAttribute('src', '/avatars/Alice/seated-idle-back.png');
+    expect(avatar.innerHTML).not.toContain('at-desk.png');
+    expect(avatar.innerHTML).not.toContain('seated-working-back.png');
+
+    rerender(<AvatarSprite desk={desk} hasActiveWork onSelect={onSelect} />);
+
+    expect(avatar).toHaveAttribute('data-avatar-pose', 'seatedWorkingBack');
+    expect(avatar).toHaveStyle(expectedStyleFor('seatedWorkingBack'));
+    expect(avatar.querySelector('img')).toHaveAttribute('src', '/avatars/Alice/seated-working-back.png');
+    expect(avatar.innerHTML).not.toContain('at-desk.png');
+    expect(avatar.innerHTML).not.toContain('seated-idle-back.png');
+  });
+});
` 

## apps/office-demo/src/data/officeLayout.ts

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-1-before\apps\office-demo\src\data\officeLayout.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\src\data\officeLayout.ts', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\data\\officeLayout.ts" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\data\\officeLayout.ts"
index e756215..b709a5b 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\data\\officeLayout.ts"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\data\\officeLayout.ts"
@@ -30,48 +30,68 @@ export type FurnitureAsset = AnchoredAsset & {
   screenRectSource?: SourceRect;
 };
 
 export type OrbAsset = AnchoredAsset & {
   meaning: string;
   visualCenterSource: ScenePoint;
 };
 
 export type AvatarPoseAsset = {
   path: string;
+  sourceAlphaBounds: SourceRect;
   visualFootShadowCenterSource: ScenePoint;
 };
 
 export type AtDeskAvatarPoseAsset = AvatarPoseAsset & {
   visualSeatCenterSource: ScenePoint;
 };
 
+export type SeatedAvatarPoseAsset = {
+  path: string;
+  sourceAlphaBounds: SourceRect;
+  visualSeatedBaseCenterSource: ScenePoint;
+};
+
+export type MovementAvatarPoseAsset = {
+  path: string;
+  sourceAlphaBounds: SourceRect;
+  visualFootShadowCenterSource: ScenePoint;
+};
+
 export type AvatarPoseName = 'idle' | 'atDesk' | 'walk' | 'carry';
 
 export type AvatarActorAssets = {
   idle: AvatarPoseAsset;
   atDesk: AtDeskAvatarPoseAsset;
   walk: AvatarPoseAsset;
   carry: AvatarPoseAsset;
+  seatedIdleBack: SeatedAvatarPoseAsset;
+  seatedWorkingBack: SeatedAvatarPoseAsset;
+  walkUp: MovementAvatarPoseAsset;
+  walkDown: MovementAvatarPoseAsset;
+  carryUp: MovementAvatarPoseAsset;
+  carryDown: MovementAvatarPoseAsset;
 };
 
 export type DeskDefinition = {
   id: string;
   workspaceId: string;
   deskAnchor: ScenePoint;
   occupant: {
     id: string;
     displayName: string;
     avatarKey: string | null;
     nameTagColor: string;
   };
   avatarAnchor: ScenePoint;
   seatAnchor: ScenePoint;
+  seatedBackAnchor: ScenePoint;
   nameTagAnchor: ScenePoint;
   orbAnchor: ScenePoint;
   online: boolean;
 };
 
 export type WorkspaceDefinition = {
   id: string;
   name: string;
   bounds: ScenePoint & RenderSize;
   safePlacementBounds: ScenePoint & RenderSize;
@@ -123,20 +143,22 @@ export type OfficeLayout = {
       artifactHub: FurnitureAsset;
     };
     artifacts: {
     prdBlue: FurnitureAsset;
       featureGreen: FurnitureAsset;
       reportPurple: FurnitureAsset;
     };
     orbs: Record<'blue' | 'gray' | 'yellow', OrbAsset>;
     avatars: {
       recommendedRenderSize: RenderSize;
+      seatedRecommendedRenderSize: RenderSize;
+      movementRecommendedRenderSize: RenderSize;
       byActor: Record<string, AvatarActorAssets>;
     };
   };
   workspaces: WorkspaceDefinition[];
   desks: DeskDefinition[];
   artifactHub: {
     id: string;
     hubAnchor: ScenePoint;
     artifactSlots: Array<{
       id: string;
` 

## docs/office-layout.json

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-1-before\docs\office-layout.json', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\docs\office-layout.json', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\docs\\office-layout.json" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\docs\\office-layout.json"
index acd7c17..b649572 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\docs\\office-layout.json"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\docs\\office-layout.json"
@@ -6,21 +6,21 @@
     "height": 941,
     "coordinateSystem": "logical-scene-px",
     "origin": "top-left",
     "backgroundTransparent": false
   },
   "assetAnchors": {
     "sourceCanvas": { "width": 1254, "height": 1254 },
     "placementConvention": {
       "deskAndHub": "Align source visualBottomCenter to the scene anchor.",
       "avatar": "Align source visualFootShadowCenter to avatarAnchor for every pose.",
-      "seatedAvatar": "Align each atDesk visualSeatCenterSource to desk seatAnchor; avatarAnchor remains reserved for idle, walk, and carry poses.",
+      "seatedAvatar": "Align seatedIdleBack or seatedWorkingBack visualSeatedBaseCenterSource to desk seatedBackAnchor; legacy atDesk and seatAnchor remain registered for story compatibility.",
       "nameTag": "Place by its own visual center at nameTagAnchor; it is relative to the avatar head area, not to the PNG crop.",
       "orb": "Place by visual center at orbAnchor; the point is to the avatar's right and does not imply business status."
     },
     "renderFormula": {
       "left": "sceneAnchor.x - sourceAnchor.x * renderWidth / 1254",
       "top": "sceneAnchor.y - sourceAnchor.y * renderHeight / 1254",
       "scale": "Use equal x/y scaling and image-rendering: pixelated."
     },
     "furniture": {
       "deskStandard": {
@@ -87,63 +87,107 @@
       "yellow": {
         "path": "images/orb/orb_yellow.png",
         "meaning": "Agent has produced a result and is awaiting human confirmation.",
         "sourceAlphaBounds": { "x": 159, "y": 126, "width": 936, "height": 962 },
         "visualCenterSource": { "x": 627, "y": 607 },
         "recommendedRenderSize": { "width": 36, "height": 36 }
       }
     },
     "avatars": {
       "recommendedRenderSize": { "width": 180, "height": 180 },
+      "seatedRecommendedRenderSize": { "width": 150, "height": 150 },
+      "movementRecommendedRenderSize": { "width": 180, "height": 180 },
       "footAnchorRule": "The x coordinate is the center of the visible feet/ground-shadow span; y is the bottommost visible shadow/foot pixel. Each pose is rendered through the same formula, so no page-specific CSS offset is permitted.",
       "byActor": {
         "Alice": {
           "idle": { "path": "images/avatars/Alice/idle.png", "sourceAlphaBounds": { "x": 455, "y": 238, "width": 343, "height": 727 }, "visualFootShadowCenterSource": { "x": 626.5, "y": 964 } },
           "atDesk": { "path": "images/avatars/Alice/at-desk.png", "sourceAlphaBounds": { "x": 392, "y": 206, "width": 517, "height": 772 }, "visualFootShadowCenterSource": { "x": 650.5, "y": 977 }, "visualSeatCenterSource": { "x": 650.5, "y": 950 } },
           "walk": { "path": "images/avatars/Alice/walk.png", "sourceAlphaBounds": { "x": 445, "y": 266, "width": 357, "height": 640 }, "visualFootShadowCenterSource": { "x": 623.5, "y": 905 } },
-          "carry": { "path": "images/avatars/Alice/carry.png", "sourceAlphaBounds": { "x": 310, "y": 169, "width": 659, "height": 843 }, "visualFootShadowCenterSource": { "x": 639.5, "y": 1011 } }
+          "carry": { "path": "images/avatars/Alice/carry.png", "sourceAlphaBounds": { "x": 310, "y": 169, "width": 659, "height": 843 }, "visualFootShadowCenterSource": { "x": 639.5, "y": 1011 } },
+          "seatedIdleBack": { "path": "images/avatars/Alice/seated-idle-back.png", "sourceAlphaBounds": { "x": 458, "y": 277, "width": 342, "height": 688 }, "visualSeatedBaseCenterSource": { "x": 628.5, "y": 964 } },
+          "seatedWorkingBack": { "path": "images/avatars/Alice/seated-working-back.png", "sourceAlphaBounds": { "x": 445, "y": 280, "width": 365, "height": 684 }, "visualSeatedBaseCenterSource": { "x": 627.5, "y": 963 } },
+          "walkUp": { "path": "images/avatars/Alice/walk-up.png", "sourceAlphaBounds": { "x": 470, "y": 219, "width": 303, "height": 777 }, "visualFootShadowCenterSource": { "x": 601.0, "y": 995 } },
+          "walkDown": { "path": "images/avatars/Alice/walk-down.png", "sourceAlphaBounds": { "x": 454, "y": 182, "width": 334, "height": 885 }, "visualFootShadowCenterSource": { "x": 653.0, "y": 1066 } },
+          "carryUp": { "path": "images/avatars/Alice/carry-up.png", "sourceAlphaBounds": { "x": 462, "y": 178, "width": 367, "height": 838 }, "visualFootShadowCenterSource": { "x": 665.5, "y": 1015 } },
+          "carryDown": { "path": "images/avatars/Alice/carry-down.png", "sourceAlphaBounds": { "x": 466, "y": 164, "width": 320, "height": 880 }, "visualFootShadowCenterSource": { "x": 649.5, "y": 1043 } }
         },
         "Bob": {
           "idle": { "path": "images/avatars/Bob/idle.png", "sourceAlphaBounds": { "x": 422, "y": 149, "width": 396, "height": 840 }, "visualFootShadowCenterSource": { "x": 620, "y": 988 } },
           "atDesk": { "path": "images/avatars/Bob/at-desk.png", "sourceAlphaBounds": { "x": 340, "y": 250, "width": 580, "height": 683 }, "visualFootShadowCenterSource": { "x": 630, "y": 932 }, "visualSeatCenterSource": { "x": 630, "y": 900 } },
           "walk": { "path": "images/avatars/Bob/walk.png", "sourceAlphaBounds": { "x": 405, "y": 220, "width": 447, "height": 770 }, "visualFootShadowCenterSource": { "x": 628.5, "y": 989 } },
-          "carry": { "path": "images/avatars/Bob/carry.png", "sourceAlphaBounds": { "x": 339, "y": 188, "width": 573, "height": 817 }, "visualFootShadowCenterSource": { "x": 625.5, "y": 1004 } }
+          "carry": { "path": "images/avatars/Bob/carry.png", "sourceAlphaBounds": { "x": 339, "y": 188, "width": 573, "height": 817 }, "visualFootShadowCenterSource": { "x": 625.5, "y": 1004 } },
+          "seatedIdleBack": { "path": "images/avatars/Bob/seated-idle-back.png", "sourceAlphaBounds": { "x": 431, "y": 258, "width": 395, "height": 716 }, "visualSeatedBaseCenterSource": { "x": 627.5, "y": 973 } },
+          "seatedWorkingBack": { "path": "images/avatars/Bob/seated-working-back.png", "sourceAlphaBounds": { "x": 448, "y": 261, "width": 365, "height": 707 }, "visualSeatedBaseCenterSource": { "x": 628.5, "y": 967 } },
+          "walkUp": { "path": "images/avatars/Bob/walk-up.png", "sourceAlphaBounds": { "x": 448, "y": 189, "width": 336, "height": 826 }, "visualFootShadowCenterSource": { "x": 658.0, "y": 1014 } },
+          "walkDown": { "path": "images/avatars/Bob/walk-down.png", "sourceAlphaBounds": { "x": 453, "y": 148, "width": 356, "height": 879 }, "visualFootShadowCenterSource": { "x": 592.5, "y": 1026 } },
+          "carryUp": { "path": "images/avatars/Bob/carry-up.png", "sourceAlphaBounds": { "x": 458, "y": 167, "width": 453, "height": 867 }, "visualFootShadowCenterSource": { "x": 650.5, "y": 1033 } },
+          "carryDown": { "path": "images/avatars/Bob/carry-down.png", "sourceAlphaBounds": { "x": 431, "y": 138, "width": 443, "height": 942 }, "visualFootShadowCenterSource": { "x": 584.5, "y": 1079 } }
         },
         "Jack": {
           "idle": { "path": "images/avatars/Jack/idle.png", "sourceAlphaBounds": { "x": 423, "y": 217, "width": 385, "height": 764 }, "visualFootShadowCenterSource": { "x": 615.5, "y": 980 } },
           "atDesk": { "path": "images/avatars/Jack/at-desk.png", "sourceAlphaBounds": { "x": 372, "y": 202, "width": 579, "height": 806 }, "visualFootShadowCenterSource": { "x": 661.5, "y": 1007 }, "visualSeatCenterSource": { "x": 661.5, "y": 970 } },
           "walk": { "path": "images/avatars/Jack/walk.png", "sourceAlphaBounds": { "x": 380, "y": 135, "width": 503, "height": 885 }, "visualFootShadowCenterSource": { "x": 631.5, "y": 1019 } },
-          "carry": { "path": "images/avatars/Jack/carry.png", "sourceAlphaBounds": { "x": 320, "y": 155, "width": 625, "height": 879 }, "visualFootShadowCenterSource": { "x": 632.5, "y": 1033 } }
+          "carry": { "path": "images/avatars/Jack/carry.png", "sourceAlphaBounds": { "x": 320, "y": 155, "width": 625, "height": 879 }, "visualFootShadowCenterSource": { "x": 632.5, "y": 1033 } },
+          "seatedIdleBack": { "path": "images/avatars/Jack/seated-idle-back.png", "sourceAlphaBounds": { "x": 437, "y": 237, "width": 379, "height": 725 }, "visualSeatedBaseCenterSource": { "x": 626.5, "y": 960 } },
+          "seatedWorkingBack": { "path": "images/avatars/Jack/seated-working-back.png", "sourceAlphaBounds": { "x": 437, "y": 252, "width": 380, "height": 707 }, "visualSeatedBaseCenterSource": { "x": 626.5, "y": 958 } },
+          "walkUp": { "path": "images/avatars/Jack/walk-up.png", "sourceAlphaBounds": { "x": 420, "y": 141, "width": 404, "height": 948 }, "visualFootShadowCenterSource": { "x": 666.5, "y": 1087 } },
+          "walkDown": { "path": "images/avatars/Jack/walk-down.png", "sourceAlphaBounds": { "x": 413, "y": 166, "width": 419, "height": 896 }, "visualFootShadowCenterSource": { "x": 666.0, "y": 1061 } },
+          "carryUp": { "path": "images/avatars/Jack/carry-up.png", "sourceAlphaBounds": { "x": 438, "y": 127, "width": 507, "height": 918 }, "visualFootShadowCenterSource": { "x": 666.5, "y": 1044 } },
+          "carryDown": { "path": "images/avatars/Jack/carry-down.png", "sourceAlphaBounds": { "x": 418, "y": 163, "width": 408, "height": 893 }, "visualFootShadowCenterSource": { "x": 661.5, "y": 1055 } }
         },
         "Kara": {
           "idle": { "path": "images/avatars/Kara/idle.png", "sourceAlphaBounds": { "x": 418, "y": 217, "width": 411, "height": 752 }, "visualFootShadowCenterSource": { "x": 623.5, "y": 968 } },
           "atDesk": { "path": "images/avatars/Kara/at-desk.png", "sourceAlphaBounds": { "x": 389, "y": 344, "width": 471, "height": 540 }, "visualFootShadowCenterSource": { "x": 624.5, "y": 883 }, "visualSeatCenterSource": { "x": 624.5, "y": 865 } },
           "walk": { "path": "images/avatars/Kara/walk.png", "sourceAlphaBounds": { "x": 384, "y": 214, "width": 480, "height": 799 }, "visualFootShadowCenterSource": { "x": 624, "y": 1012 } },
-          "carry": { "path": "images/avatars/Kara/carry.png", "sourceAlphaBounds": { "x": 418, "y": 204, "width": 463, "height": 752 }, "visualFootShadowCenterSource": { "x": 649.5, "y": 955 } }
+          "carry": { "path": "images/avatars/Kara/carry.png", "sourceAlphaBounds": { "x": 418, "y": 204, "width": 463, "height": 752 }, "visualFootShadowCenterSource": { "x": 649.5, "y": 955 } },
+          "seatedIdleBack": { "path": "images/avatars/Kara/seated-idle-back.png", "sourceAlphaBounds": { "x": 441, "y": 254, "width": 376, "height": 635 }, "visualSeatedBaseCenterSource": { "x": 629.0, "y": 888 } },
+          "seatedWorkingBack": { "path": "images/avatars/Kara/seated-working-back.png", "sourceAlphaBounds": { "x": 442, "y": 256, "width": 375, "height": 632 }, "visualSeatedBaseCenterSource": { "x": 628.5, "y": 886 } },
+          "walkUp": { "path": "images/avatars/Kara/walk-up.png", "sourceAlphaBounds": { "x": 422, "y": 167, "width": 413, "height": 811 }, "visualFootShadowCenterSource": { "x": 666.0, "y": 976 } },
+          "walkDown": { "path": "images/avatars/Kara/walk-down.png", "sourceAlphaBounds": { "x": 429, "y": 176, "width": 396, "height": 772 }, "visualFootShadowCenterSource": { "x": 660.0, "y": 947 } },
+          "carryUp": { "path": "images/avatars/Kara/carry-up.png", "sourceAlphaBounds": { "x": 425, "y": 193, "width": 440, "height": 798 }, "visualFootShadowCenterSource": { "x": 638.5, "y": 989 } },
+          "carryDown": { "path": "images/avatars/Kara/carry-down.png", "sourceAlphaBounds": { "x": 441, "y": 218, "width": 387, "height": 756 }, "visualFootShadowCenterSource": { "x": 597.0, "y": 973 } }
         },
         "Leo": {
           "idle": { "path": "images/avatars/Leo/idle.png", "sourceAlphaBounds": { "x": 440, "y": 258, "width": 392, "height": 734 }, "visualFootShadowCenterSource": { "x": 636, "y": 991 } },
           "atDesk": { "path": "images/avatars/Leo/at-desk.png", "sourceAlphaBounds": { "x": 449, "y": 257, "width": 383, "height": 695 }, "visualFootShadowCenterSource": { "x": 640.5, "y": 951 }, "visualSeatCenterSource": { "x": 640.5, "y": 925 } },
           "walk": { "path": "images/avatars/Leo/walk.png", "sourceAlphaBounds": { "x": 448, "y": 274, "width": 384, "height": 654 }, "visualFootShadowCenterSource": { "x": 640, "y": 927 } },
-          "carry": { "path": "images/avatars/Leo/carry.png", "sourceAlphaBounds": { "x": 371, "y": 192, "width": 561, "height": 768 }, "visualFootShadowCenterSource": { "x": 651.5, "y": 959 } }
+          "carry": { "path": "images/avatars/Leo/carry.png", "sourceAlphaBounds": { "x": 371, "y": 192, "width": 561, "height": 768 }, "visualFootShadowCenterSource": { "x": 651.5, "y": 959 } },
+          "seatedIdleBack": { "path": "images/avatars/Leo/seated-idle-back.png", "sourceAlphaBounds": { "x": 459, "y": 271, "width": 348, "height": 689 }, "visualSeatedBaseCenterSource": { "x": 635.0, "y": 958 } },
+          "seatedWorkingBack": { "path": "images/avatars/Leo/seated-working-back.png", "sourceAlphaBounds": { "x": 460, "y": 272, "width": 348, "height": 684 }, "visualSeatedBaseCenterSource": { "x": 634.0, "y": 955 } },
+          "walkUp": { "path": "images/avatars/Leo/walk-up.png", "sourceAlphaBounds": { "x": 447, "y": 167, "width": 364, "height": 845 }, "visualFootShadowCenterSource": { "x": 665.0, "y": 1011 } },
+          "walkDown": { "path": "images/avatars/Leo/walk-down.png", "sourceAlphaBounds": { "x": 454, "y": 188, "width": 370, "height": 780 }, "visualFootShadowCenterSource": { "x": 597.5, "y": 967 } },
+          "carryUp": { "path": "images/avatars/Leo/carry-up.png", "sourceAlphaBounds": { "x": 441, "y": 161, "width": 462, "height": 883 }, "visualFootShadowCenterSource": { "x": 581.5, "y": 1043 } },
+          "carryDown": { "path": "images/avatars/Leo/carry-down.png", "sourceAlphaBounds": { "x": 457, "y": 189, "width": 360, "height": 823 }, "visualFootShadowCenterSource": { "x": 595.5, "y": 1011 } }
         },
         "Quinn": {
           "idle": { "path": "images/avatars/Quinn/idle.png", "sourceAlphaBounds": { "x": 433, "y": 247, "width": 374, "height": 742 }, "visualFootShadowCenterSource": { "x": 620, "y": 988 } },
           "atDesk": { "path": "images/avatars/Quinn/at-desk.png", "sourceAlphaBounds": { "x": 390, "y": 238, "width": 501, "height": 773 }, "visualFootShadowCenterSource": { "x": 640.5, "y": 1010 }, "visualSeatCenterSource": { "x": 640.5, "y": 990 } },
           "walk": { "path": "images/avatars/Quinn/walk.png", "sourceAlphaBounds": { "x": 439, "y": 292, "width": 379, "height": 616 }, "visualFootShadowCenterSource": { "x": 628.5, "y": 907 } },
-          "carry": { "path": "images/avatars/Quinn/carry.png", "sourceAlphaBounds": { "x": 358, "y": 199, "width": 540, "height": 744 }, "visualFootShadowCenterSource": { "x": 628, "y": 942 } }
+          "carry": { "path": "images/avatars/Quinn/carry.png", "sourceAlphaBounds": { "x": 358, "y": 199, "width": 540, "height": 744 }, "visualFootShadowCenterSource": { "x": 628, "y": 942 } },
+          "seatedIdleBack": { "path": "images/avatars/Quinn/seated-idle-back.png", "sourceAlphaBounds": { "x": 415, "y": 259, "width": 408, "height": 707 }, "visualSeatedBaseCenterSource": { "x": 617.0, "y": 964 } },
+          "seatedWorkingBack": { "path": "images/avatars/Quinn/seated-working-back.png", "sourceAlphaBounds": { "x": 408, "y": 270, "width": 419, "height": 688 }, "visualSeatedBaseCenterSource": { "x": 616.5, "y": 957 } },
+          "walkUp": { "path": "images/avatars/Quinn/walk-up.png", "sourceAlphaBounds": { "x": 457, "y": 216, "width": 342, "height": 771 }, "visualFootShadowCenterSource": { "x": 673.0, "y": 986 } },
+          "walkDown": { "path": "images/avatars/Quinn/walk-down.png", "sourceAlphaBounds": { "x": 447, "y": 224, "width": 364, "height": 772 }, "visualFootShadowCenterSource": { "x": 682.0, "y": 994 } },
+          "carryUp": { "path": "images/avatars/Quinn/carry-up.png", "sourceAlphaBounds": { "x": 441, "y": 171, "width": 452, "height": 791 }, "visualFootShadowCenterSource": { "x": 666.5, "y": 961 } },
+          "carryDown": { "path": "images/avatars/Quinn/carry-down.png", "sourceAlphaBounds": { "x": 448, "y": 190, "width": 365, "height": 822 }, "visualFootShadowCenterSource": { "x": 680.5, "y": 1010 } }
         },
         "Rita": {
           "idle": { "path": "images/avatars/Rita/idle.png", "sourceAlphaBounds": { "x": 386, "y": 242, "width": 421, "height": 738 }, "visualFootShadowCenterSource": { "x": 596.5, "y": 979 } },
           "atDesk": { "path": "images/avatars/Rita/at-desk.png", "sourceAlphaBounds": { "x": 398, "y": 258, "width": 432, "height": 713 }, "visualFootShadowCenterSource": { "x": 614, "y": 970 }, "visualSeatCenterSource": { "x": 614, "y": 950 } },
           "walk": { "path": "images/avatars/Rita/walk.png", "sourceAlphaBounds": { "x": 375, "y": 222, "width": 479, "height": 738 }, "visualFootShadowCenterSource": { "x": 614.5, "y": 959 } },
-          "carry": { "path": "images/avatars/Rita/carry.png", "sourceAlphaBounds": { "x": 345, "y": 193, "width": 540, "height": 746 }, "visualFootShadowCenterSource": { "x": 615, "y": 938 } }
+          "carry": { "path": "images/avatars/Rita/carry.png", "sourceAlphaBounds": { "x": 345, "y": 193, "width": 540, "height": 746 }, "visualFootShadowCenterSource": { "x": 615, "y": 938 } },
+          "seatedIdleBack": { "path": "images/avatars/Rita/seated-idle-back.png", "sourceAlphaBounds": { "x": 454, "y": 276, "width": 347, "height": 656 }, "visualSeatedBaseCenterSource": { "x": 631.0, "y": 931 } },
+          "seatedWorkingBack": { "path": "images/avatars/Rita/seated-working-back.png", "sourceAlphaBounds": { "x": 457, "y": 279, "width": 340, "height": 652 }, "visualSeatedBaseCenterSource": { "x": 629.5, "y": 930 } },
+          "walkUp": { "path": "images/avatars/Rita/walk-up.png", "sourceAlphaBounds": { "x": 457, "y": 195, "width": 319, "height": 790 }, "visualFootShadowCenterSource": { "x": 640.0, "y": 984 } },
+          "walkDown": { "path": "images/avatars/Rita/walk-down.png", "sourceAlphaBounds": { "x": 423, "y": 209, "width": 363, "height": 777 }, "visualFootShadowCenterSource": { "x": 651.0, "y": 985 } },
+          "carryUp": { "path": "images/avatars/Rita/carry-up.png", "sourceAlphaBounds": { "x": 443, "y": 190, "width": 435, "height": 795 }, "visualFootShadowCenterSource": { "x": 628.0, "y": 984 } },
+          "carryDown": { "path": "images/avatars/Rita/carry-down.png", "sourceAlphaBounds": { "x": 411, "y": 198, "width": 412, "height": 788 }, "visualFootShadowCenterSource": { "x": 642.5, "y": 984 } }
         }
       }
     }
   },
   "workspaces": [
     {
       "id": "pm-office",
       "name": "PM Office",
       "bounds": { "x": 45, "y": 108, "width": 604, "height": 516 },
       "safePlacementBounds": { "x": 100, "y": 280, "width": 500, "height": 310 },
@@ -165,119 +209,129 @@
     }
   ],
   "desks": [
     {
       "id": "pm-alice",
       "workspaceId": "pm-office",
       "deskAnchor": { "x": 160, "y": 548 },
       "occupant": { "id": "alice", "displayName": "Alice", "avatarKey": "Alice", "nameTagColor": "#EA6A47" },
       "avatarAnchor": { "x": 160, "y": 465 },
       "seatAnchor": { "x": 160, "y": 469 },
+      "seatedBackAnchor": { "x": 160, "y": 564 },
       "nameTagAnchor": { "x": 160, "y": 325 },
       "orbAnchor": { "x": 236, "y": 401 },
       "online": true
     },
     {
       "id": "pm-bob",
       "workspaceId": "pm-office",
       "deskAnchor": { "x": 350, "y": 548 },
       "occupant": { "id": "bob", "displayName": "Bob", "avatarKey": "Bob", "nameTagColor": "#3B82F6" },
       "avatarAnchor": { "x": 350, "y": 465 },
       "seatAnchor": { "x": 350, "y": 469 },
+      "seatedBackAnchor": { "x": 350, "y": 564 },
       "nameTagAnchor": { "x": 350, "y": 325 },
       "orbAnchor": { "x": 426, "y": 401 },
       "online": true
     },
     {
       "id": "pm-cindy",
       "workspaceId": "pm-office",
       "deskAnchor": { "x": 540, "y": 548 },
       "occupant": { "id": "cindy", "displayName": "Cindy", "avatarKey": null, "nameTagColor": "#9CA3AF" },
       "avatarAnchor": { "x": 540, "y": 465 },
       "seatAnchor": { "x": 540, "y": 465 },
+      "seatedBackAnchor": { "x": 540, "y": 564 },
       "nameTagAnchor": { "x": 540, "y": 325 },
       "orbAnchor": { "x": 616, "y": 401 },
       "online": false
     },
     {
       "id": "dev-jack",
       "workspaceId": "dev-office",
       "deskAnchor": { "x": 1175, "y": 375 },
       "occupant": { "id": "jack", "displayName": "Jack", "avatarKey": "Jack", "nameTagColor": "#2563EB" },
       "avatarAnchor": { "x": 1175, "y": 295 },
       "seatAnchor": { "x": 1175, "y": 298 },
+      "seatedBackAnchor": { "x": 1175, "y": 391 },
       "nameTagAnchor": { "x": 1175, "y": 155 },
       "orbAnchor": { "x": 1251, "y": 231 },
       "online": true
     },
     {
       "id": "dev-kara",
       "workspaceId": "dev-office",
       "deskAnchor": { "x": 1445, "y": 375 },
       "occupant": { "id": "kara", "displayName": "Kara", "avatarKey": "Kara", "nameTagColor": "#EC4899" },
       "avatarAnchor": { "x": 1445, "y": 295 },
       "seatAnchor": { "x": 1445, "y": 300 },
+      "seatedBackAnchor": { "x": 1445, "y": 391 },
       "nameTagAnchor": { "x": 1445, "y": 155 },
       "orbAnchor": { "x": 1521, "y": 231 },
       "online": true
     },
     {
       "id": "dev-leo",
       "workspaceId": "dev-office",
       "deskAnchor": { "x": 1175, "y": 585 },
       "occupant": { "id": "leo", "displayName": "Leo", "avatarKey": "Leo", "nameTagColor": "#16A34A" },
       "avatarAnchor": { "x": 1175, "y": 515 },
       "seatAnchor": { "x": 1175, "y": 519 },
+      "seatedBackAnchor": { "x": 1175, "y": 601 },
       "nameTagAnchor": { "x": 1175, "y": 395 },
       "orbAnchor": { "x": 1251, "y": 451 },
       "online": true
     },
     {
       "id": "dev-mia",
       "workspaceId": "dev-office",
       "deskAnchor": { "x": 1445, "y": 585 },
       "occupant": { "id": "mia", "displayName": "Mia", "avatarKey": null, "nameTagColor": "#9CA3AF" },
       "avatarAnchor": { "x": 1445, "y": 515 },
       "seatAnchor": { "x": 1445, "y": 515 },
+      "seatedBackAnchor": { "x": 1445, "y": 601 },
       "nameTagAnchor": { "x": 1445, "y": 395 },
       "orbAnchor": { "x": 1521, "y": 451 },
       "online": false
     },
     {
       "id": "qa-quinn",
       "workspaceId": "qa-lab",
       "deskAnchor": { "x": 550, "y": 868 },
       "occupant": { "id": "quinn", "displayName": "Quinn", "avatarKey": "Quinn", "nameTagColor": "#7C3AED" },
       "avatarAnchor": { "x": 550, "y": 840 },
       "seatAnchor": { "x": 550, "y": 825 },
+      "seatedBackAnchor": { "x": 550, "y": 884 },
       "nameTagAnchor": { "x": 550, "y": 705 },
       "orbAnchor": { "x": 626, "y": 776 },
       "online": true
     },
     {
       "id": "qa-rita",
       "workspaceId": "qa-lab",
       "deskAnchor": { "x": 920, "y": 868 },
       "occupant": { "id": "rita", "displayName": "Rita", "avatarKey": "Rita", "nameTagColor": "#D946EF" },
       "avatarAnchor": { "x": 920, "y": 840 },
       "seatAnchor": { "x": 920, "y": 825 },
+      "seatedBackAnchor": { "x": 920, "y": 884 },
       "nameTagAnchor": { "x": 920, "y": 705 },
       "orbAnchor": { "x": 996, "y": 776 },
       "online": true
     },
     {
       "id": "qa-tina",
       "workspaceId": "qa-lab",
       "deskAnchor": { "x": 1290, "y": 868 },
       "occupant": { "id": "tina", "displayName": "Tina", "avatarKey": null, "nameTagColor": "#9CA3AF" },
       "avatarAnchor": { "x": 1290, "y": 840 },
       "seatAnchor": { "x": 1290, "y": 840 },
+      "seatedBackAnchor": { "x": 1290, "y": 884 },
       "nameTagAnchor": { "x": 1290, "y": 705 },
       "orbAnchor": { "x": 1366, "y": 776 },
       "online": false
     }
   ],
   "artifactHub": {
     "id": "artifact-hub",
     "workspaceId": null,
     "assetKey": "furniture.artifactHub",
     "hubAnchor": { "x": 850, "y": 510 },
` 

## apps/office-demo/src/app/App.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-1-before\apps\office-demo\src\app\App.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\src\app\App.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\app\\App.tsx" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\app\\App.tsx"
index f0e1e5a..bed6e97 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\app\\App.tsx"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\app\\App.tsx"
@@ -17,20 +17,23 @@ import {
 } from '../story/prdHandoffStory';
 import { officeSelection, type Selection } from '../types/selection';
 
 export function App() {
   const [selection, setSelection] = useState<Selection>(officeSelection);
   const [runtime, setRuntime] = useState(createStoryRuntime);
   const prefersReducedMotion = usePrefersReducedMotion();
   const story = getStoryFrame(runtime);
   const scenario = storyScenarioForState(runtime);
   const motionDurationMs = story.motion?.transitionDurationMs;
+  const activeWorkDeskIds: ReadonlySet<string> = new Set(
+    scenario.people.filter((person) => Boolean(person.currentTask?.trim())).map((person) => person.deskId),
+  );
 
   useEffect(() => {
     if (runtime.playbackStatus !== 'playing') return undefined;
 
     if (story.motion && !isMotionComplete(runtime)) {
       const timeout = window.setTimeout(
         () => setRuntime((current) => advanceStoryWaypoint(current, { reducedMotion: prefersReducedMotion })),
         prefersReducedMotion ? 0 : story.motion.transitionDurationMs,
       );
       return () => window.clearTimeout(timeout);
@@ -44,21 +47,21 @@ export function App() {
     const timeout = window.setTimeout(
       () => setRuntime((current) => advanceStoryState(current)),
       prefersReducedMotion ? 700 : story.autoAdvanceDelayMs,
     );
     return () => window.clearTimeout(timeout);
   }, [motionDurationMs, prefersReducedMotion, runtime, story.autoAdvanceDelayMs]);
 
   return (
     <main className="app-shell">
       <section aria-label="Office scene stage" className="office-stage">
-        <OfficeScene onSelectionChange={setSelection} prefersReducedMotion={prefersReducedMotion} story={story} />
+        <OfficeScene activeWorkDeskIds={activeWorkDeskIds} onSelectionChange={setSelection} prefersReducedMotion={prefersReducedMotion} story={story} />
       </section>
       <InspectorShell
         hubCounts={story.hub.counts}
         mobileOpen={selection.kind !== 'office'}
         onClose={() => setSelection(officeSelection)}
         onSelectionChange={setSelection}
         onStoryNext={() => setRuntime((current) => manualNextStory(current))}
         onStoryPlayPause={() => setRuntime((current) => current.playbackStatus === 'playing' ? pauseStory(current) : playStory(current))}
         onStoryPrevious={() => setRuntime((current) => previousStory(current))}
         onStoryReplay={() => setRuntime(replayStory())}
` 

## apps/office-demo/src/components/office/OfficeScene.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-1-before\apps\office-demo\src\components\office\OfficeScene.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\src\components\office\OfficeScene.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\components\\office\\OfficeScene.tsx" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\components\\office\\OfficeScene.tsx"
index 098e4cb..00b0a74 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\components\\office\\OfficeScene.tsx"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\components\\office\\OfficeScene.tsx"
@@ -5,37 +5,38 @@ import { sceneRectToRelativeStyle } from '../../utils/scenePlacement';
 import { AgentOrb } from './AgentOrb';
 import { ArtifactHub } from './ArtifactHub';
 import { AvatarSprite } from './AvatarSprite';
 import { DeskStation } from './DeskStation';
 import { NameTag } from './NameTag';
 import { StoryActorSprite } from './StoryActorSprite';
 import { StoryArtifact } from './StoryArtifact';
 import { StorySignals } from './StorySignals';
 
 type OfficeSceneProps = {
+  activeWorkDeskIds: ReadonlySet<string>;
   onSelectionChange: (selection: Selection) => void;
   story: StoryFrame;
   prefersReducedMotion: boolean;
 };
 
 function offsetFromDesk(point: ScenePoint, desk: (typeof officeLayout.desks)[number], source: ScenePoint) {
   return {
     x: point.x + source.x - desk.avatarAnchor.x,
     y: point.y + source.y - desk.avatarAnchor.y,
   };
 }
 
 function actorForDesk(actors: readonly StoryActor[], deskId: string) {
   return actors.find((actor) => actor.deskId === deskId);
 }
 
-export function OfficeScene({ onSelectionChange, prefersReducedMotion, story }: OfficeSceneProps) {
+export function OfficeScene({ activeWorkDeskIds, onSelectionChange, prefersReducedMotion, story }: OfficeSceneProps) {
   const { height, width } = officeLayout.scene;
   const transitionDurationMs = prefersReducedMotion ? 0 : story.motion?.transitionDurationMs ?? 0;
   const isMotionPaused = story.playbackStatus === 'paused';
 
   return (
     <section
       aria-label="Office scene"
       className="office-scene"
       data-logical-height={height}
       data-logical-width={width}
@@ -56,21 +57,21 @@ export function OfficeScene({ onSelectionChange, prefersReducedMotion, story }:
               type="button"
             />
           ))}
         </div>
         <div className="office-scene__layer office-scene__layer--chairs">
           {officeLayout.desks.map((desk) => <DeskStation desk={desk} key={desk.id} layer="chairBack" onSelect={onSelectionChange} />)}
         </div>
         <div className="office-scene__layer office-scene__layer--avatars">
           {officeLayout.desks.map((desk) => {
             const actor = actorForDesk(story.actors, desk.id);
-            return <AvatarSprite desk={desk} key={desk.id} onSelect={onSelectionChange} visible={actor?.pose === 'atDesk' || !actor} />;
+            return <AvatarSprite desk={desk} hasActiveWork={activeWorkDeskIds.has(desk.id)} key={desk.id} onSelect={onSelectionChange} visible={actor?.pose === 'atDesk' || !actor} />;
           })}
           {story.actors.map((actor) => <StoryActorSprite actor={actor} isPaused={isMotionPaused} key={actor.id} position={actor.coordinate} transitionDurationMs={transitionDurationMs} />)}
         </div>
         <div className="office-scene__layer office-scene__layer--furniture">
           {officeLayout.desks.map((desk) => <DeskStation desk={desk} key={desk.id} layer="front" onSelect={onSelectionChange} />)}
           <ArtifactHub counts={story.hub.counts} onSelect={onSelectionChange} />
         </div>
         <div className="office-scene__layer office-scene__layer--story-artifact"><StoryArtifact artifacts={story.artifacts} isPaused={isMotionPaused} transitionDurationMs={transitionDurationMs} /></div>
         <div className="office-scene__layer office-scene__layer--labels">
           {officeLayout.desks.map((desk) => {
` 

## apps/office-demo/src/components/office/AvatarSprite.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-1-before\apps\office-demo\src\components\office\AvatarSprite.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\src\components\office\AvatarSprite.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\components\\office\\AvatarSprite.tsx" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\components\\office\\AvatarSprite.tsx"
index 2c67bc7..caaf523 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\components\\office\\AvatarSprite.tsx"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\src\\components\\office\\AvatarSprite.tsx"
@@ -1,37 +1,41 @@
 import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
 import type { Selection } from '../../types/selection';
+import { resolveSeatedPose } from '../../utils/avatarPresentation';
 import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';
 
 type AvatarSpriteProps = {
   desk: (typeof officeLayout.desks)[number];
+  hasActiveWork: boolean;
   onSelect: (selection: Selection) => void;
   visible?: boolean;
 };
 
-export function AvatarSprite({ desk, onSelect, visible = true }: AvatarSpriteProps) {
+export function AvatarSprite({ desk, hasActiveWork, onSelect, visible = true }: AvatarSpriteProps) {
   if (!visible || !desk.online || !desk.occupant.avatarKey) {
     return null;
   }
 
-  const asset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey].atDesk;
-  const renderSize = officeLayout.assetAnchors.avatars.recommendedRenderSize;
+  const pose = resolveSeatedPose(hasActiveWork);
+  const asset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey][pose];
+  const renderSize = officeLayout.assetAnchors.avatars.seatedRecommendedRenderSize;
   const position = calculateScenePlacement({
-    sceneAnchor: desk.seatAnchor,
-    sourceAnchor: asset.visualSeatCenterSource,
+    sceneAnchor: desk.seatedBackAnchor,
+    sourceAnchor: asset.visualSeatedBaseCenterSource,
     renderSize,
     sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
   });
 
   return (
     <button
       aria-label={`Open ${desk.occupant.displayName} detail`}
       className="office-object-button office-sprite office-sprite--avatar"
+      data-avatar-pose={pose}
       data-testid={`avatar-${desk.id}`}
       onClick={() => onSelect({ kind: 'avatar', deskId: desk.id })}
       style={toSceneRelativeStyle({ placement: position, renderSize, sceneSize: officeLayout.scene })}
       type="button"
     >
       <img alt="" aria-hidden="true" className="office-sprite__image" draggable={false} src={toPublicAssetPath(asset.path)} />
     </button>
   );
 }
` 

## apps/office-demo/tests/static-office-map.test.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-1-before\apps\office-demo\tests\static-office-map.test.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\tests\static-office-map.test.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\tests\\static-office-map.test.tsx" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\static-office-map.test.tsx"
index 70c2be1..eb021e9 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\tests\\static-office-map.test.tsx"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\static-office-map.test.tsx"
@@ -1,14 +1,16 @@
 import { render, screen, within } from '@testing-library/react';
 import { describe, expect, it } from 'vitest';
 import { App } from '../src/app/App';
 import { officeLayout } from '../src/data/officeLayout';
+import { createStoryRuntime, storyScenarioForState } from '../src/story/prdHandoffStory';
+import { resolveSeatedPose } from '../src/utils/avatarPresentation';
 
 describe('static office map', () => {
   it('renders the complete initial office state from the layout data', () => {
     render(<App />);
 
     expect(screen.getByTestId('office-scene').querySelector('.office-scene__canvas')).toHaveStyle({
       height: '100%',
       width: '100%',
     });
     expect(screen.getAllByTestId('desk-station')).toHaveLength(10);
@@ -28,16 +30,21 @@ describe('static office map', () => {
     expect(within(hub).getByText('Feature')).toBeInTheDocument();
     expect(within(hub).getByText('Report')).toBeInTheDocument();
     expect(within(hub).getByText('2')).toBeInTheDocument();
 
     const renderedSources = Array.from(document.querySelectorAll('img')).map((image) => image.getAttribute('src'));
     expect(renderedSources).toContain(`/${officeLayout.assetAnchors.furniture.deskChairBack.path.replace(/^images\//, '')}`);
     expect(renderedSources).toContain(`/${officeLayout.assetAnchors.furniture.deskFront.path.replace(/^images\//, '')}`);
     expect(renderedSources).toContain(`/${officeLayout.assetAnchors.furniture.artifactHub.path.replace(/^images\//, '')}`);
     expect(renderedSources).toContain(`/${officeLayout.assetAnchors.orbs.gray.path.replace(/^images\//, '')}`);
 
+    const scenario = storyScenarioForState(createStoryRuntime());
+    const activeWorkDeskIds = new Set(scenario.people.filter((person) => Boolean(person.currentTask?.trim())).map((person) => person.deskId));
     for (const desk of officeLayout.desks.filter((item) => item.online)) {
-      const avatar = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey!].atDesk;
+      const pose = resolveSeatedPose(activeWorkDeskIds.has(desk.id));
+      const avatar = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey!][pose];
       expect(renderedSources).toContain(`/${avatar.path.replace(/^images\//, '')}`);
+      expect(screen.getByTestId(`avatar-${desk.id}`)).toHaveAttribute('data-avatar-pose', pose);
     }
+    expect(renderedSources.some((source) => source?.endsWith('/at-desk.png'))).toBe(false);
   });
 });
` 

## apps/office-demo/tests/task41-static-calibration.test.tsx

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\task-1-before\apps\office-demo\tests\task41-static-calibration.test.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\apps\office-demo\tests\task41-static-calibration.test.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\tests\\task41-static-calibration.test.tsx" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\task41-static-calibration.test.tsx"
index 7149d51..88dc80d 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\tests\\task41-static-calibration.test.tsx"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\apps\\office-demo\\tests\\task41-static-calibration.test.tsx"
@@ -8,47 +8,53 @@ type FutureLayout = {
   assetAnchors: {
     sourceCanvas: { width: number; height: number };
     furniture: {
       deskChairBack: { path: string };
       deskFront: { path: string };
       artifactHub: {
         screenRectSource: { x: number; y: number; width: number; height: number };
       };
     };
   };
-  desks: Array<{ id: string; online: boolean; seatAnchor: { x: number; y: number } }>;
+  desks: Array<{
+    id: string;
+    online: boolean;
+    seatAnchor: { x: number; y: number };
+    seatedBackAnchor: { x: number; y: number };
+  }>;
 };
 
 const task41Layout = officeLayout as unknown as FutureLayout;
 const sourceRectToAssetRelativeStyle = (scenePlacement as unknown as {
   sourceRectToAssetRelativeStyle: (rect: { x: number; y: number; width: number; height: number }, canvas: { width: number; height: number }) => Record<string, string>;
 }).sourceRectToAssetRelativeStyle;
 
 describe('Task 4.1 static map calibration', () => {
   it('converts a source rectangle to asset-relative percentages', () => {
     expect(sourceRectToAssetRelativeStyle(
       { x: 125.4, y: 313.5, width: 627, height: 940.5 },
       { width: 1254, height: 1254 },
     )).toEqual({
       height: '75%',
       left: '10%',
       top: '25%',
       width: '50%',
     });
   });
 
-  it('provides full-canvas desk layers, seat anchors, and a Hub screen rect in layout data', () => {
+  it('provides full-canvas desk layers, seated anchors, and a Hub screen rect in layout data', () => {
     expect(task41Layout.assetAnchors.furniture.deskChairBack.path).toBe('images/furniture/desk-chair-back.png');
     expect(task41Layout.assetAnchors.furniture.deskFront.path).toBe('images/furniture/desk-front.png');
     expect(task41Layout.assetAnchors.furniture.artifactHub.screenRectSource).toMatchObject({ x: 464, y: 342 });
     expect(task41Layout.desks).toHaveLength(10);
     expect(task41Layout.desks.every((desk) => Number.isFinite(desk.seatAnchor.x) && Number.isFinite(desk.seatAnchor.y))).toBe(true);
+    expect(task41Layout.desks.every((desk) => Number.isFinite(desk.seatedBackAnchor.x) && Number.isFinite(desk.seatedBackAnchor.y))).toBe(true);
   });
 
   it('layers every online desk as chair, seated Avatar, and desk front while offline desks have no Avatar', () => {
     render(<App />);
 
     for (const desk of task41Layout.desks) {
       expect(screen.getByTestId(`desk-chair-${desk.id}`)).toBeInTheDocument();
       expect(screen.getByTestId(`desk-front-${desk.id}`)).toBeInTheDocument();
       if (desk.online) {
         expect(screen.getByTestId(`avatar-${desk.id}`)).toBeInTheDocument();
` 

