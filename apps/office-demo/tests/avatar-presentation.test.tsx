import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AvatarSprite } from '../src/components/office/AvatarSprite';
import { RuntimeActorSprite } from '../src/components/office/RuntimeActorSprite';
import { officeLayout, type RenderSize, type ScenePoint, type SourceRect } from '../src/data/officeLayout';
import { directionBetween, resolveMovementPose, resolveSeatedPose, type MovementAvatarPoseName } from '../src/utils/avatarPresentation';
import { calculateSeatedAvatarPresentation } from '../src/utils/avatarVisualBounds';
import { calculateScenePlacement, toSceneRelativeStyle } from '../src/utils/scenePlacement';

const avatarPoseKeys = [
  'idle',
  'atDesk',
  'walk',
  'carry',
  'seatedIdleBack',
  'seatedWorkingBack',
  'walkUp',
  'walkDown',
  'walkLeft',
  'walkRight',
  'carryUp',
  'carryDown',
  'carryLeft',
  'carryRight',
] as const;

const newlyRegisteredPoseFiles = {
  seatedIdleBack: 'seated-idle-back.png',
  seatedWorkingBack: 'seated-working-back.png',
  walkUp: 'walk-up.png',
  walkDown: 'walk-down.png',
  walkLeft: 'walk-left.png',
  walkRight: 'walk-right.png',
  carryUp: 'carry-up.png',
  carryDown: 'carry-down.png',
  carryLeft: 'carry-left.png',
  carryRight: 'carry-right.png',
} as const;

const aliceHorizontalMetrics = {
  walkLeft: { sourceAlphaBounds: { x: 410, y: 214, width: 403, height: 758 }, visualFootShadowCenterSource: { x: 579, y: 970 } },
  walkRight: { sourceAlphaBounds: { x: 439, y: 221, width: 384, height: 729 }, visualFootShadowCenterSource: { x: 626.5, y: 949 } },
  carryLeft: { sourceAlphaBounds: { x: 426, y: 148, width: 423, height: 887 }, visualFootShadowCenterSource: { x: 627.5, y: 1033 } },
  carryRight: { sourceAlphaBounds: { x: 410, y: 145, width: 446, height: 901 }, visualFootShadowCenterSource: { x: 637, y: 1045 } },
} as const;

function expectFinitePoint(point: ScenePoint) {
  expect(Number.isFinite(point.x)).toBe(true);
  expect(Number.isFinite(point.y)).toBe(true);
}

function expectFiniteRect(rect: SourceRect) {
  expectFinitePoint(rect);
  expect(Number.isFinite(rect.width)).toBe(true);
  expect(Number.isFinite(rect.height)).toBe(true);
}

describe('avatar presentation registry', () => {
  it('registers fourteen anchored, unique assets for each of the seven actors', () => {
    const actorEntries = Object.entries(officeLayout.assetAnchors.avatars.byActor);
    const allPaths: string[] = [];
    const newPaths: string[] = [];

    expect(actorEntries).toHaveLength(7);
    expect(officeLayout.assetAnchors.avatars.seatedRecommendedRenderSize).toEqual({ width: 150, height: 150 });

    for (const [actorName, assets] of actorEntries) {
      expect(Object.keys(assets)).toEqual(avatarPoseKeys);

      for (const poseName of avatarPoseKeys) {
        const asset = assets[poseName];
        allPaths.push(asset.path);
        expectFiniteRect(asset.sourceAlphaBounds);

        if ('visualSeatedBaseCenterSource' in asset) {
          expectFinitePoint(asset.visualSeatedBaseCenterSource);
        } else {
          expectFinitePoint(asset.visualFootShadowCenterSource);
        }
      }

      for (const [poseName, fileName] of Object.entries(newlyRegisteredPoseFiles)) {
        const path = assets[poseName as keyof typeof newlyRegisteredPoseFiles].path;
        expect(path).toBe(`images/avatars/${actorName}/${fileName}`);
        newPaths.push(path);
      }
    }

    expect(allPaths).toHaveLength(98);
    expect(new Set(allPaths)).toHaveProperty('size', 98);
    expect(newPaths).toHaveLength(70);
    expect(new Set(newPaths)).toHaveProperty('size', 70);
    expect(officeLayout.assetAnchors.avatars.byActor.Alice).toMatchObject(aliceHorizontalMetrics);
  });

  it('provides a finite seated-back anchor for every desk', () => {
    expect(officeLayout.desks).toHaveLength(10);
    for (const desk of officeLayout.desks) {
      expectFinitePoint(desk.seatedBackAnchor);
    }
  });
});

describe('seated avatar selection', () => {
  it('always selects the working-back pose for an online employee', () => {
    expect(resolveSeatedPose()).toBe('seatedWorkingBack');
  });

  it('renders only the 150px working-back asset from its visible bounds at the desk', () => {
    const desk = officeLayout.desks.find((item) => item.id === 'pm-alice')!;
    const onSelect = vi.fn();
    const renderSize: RenderSize = { width: 150, height: 150 };
    const orbAsset = officeLayout.assetAnchors.orbs.gray;
    const expectedStyleFor = (pose: 'seatedWorkingBack') => {
      const placement = calculateSeatedAvatarPresentation({
        avatarAnchor: desk.seatedBackAnchor,
        avatarAsset: officeLayout.assetAnchors.avatars.byActor.Alice[pose],
        avatarRenderSize: renderSize,
        chairAsset: officeLayout.assetAnchors.furniture.deskChairBack,
        chairAnchor: desk.chairBackAnchor,
        chairRenderSize: officeLayout.assetAnchors.furniture.deskChairBack.recommendedRenderSize,
        orbAsset,
        orbRenderSize: orbAsset.recommendedRenderSize,
        sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
      }).placement;
      return toSceneRelativeStyle({ placement, renderSize, sceneSize: officeLayout.scene });
    };

    render(<AvatarSprite desk={desk} onSelect={onSelect} />);
    const avatar = screen.getByTestId('avatar-pm-alice');

    expect(avatar).toHaveAttribute('data-avatar-pose', 'seatedWorkingBack');
    expect(avatar).toHaveStyle(expectedStyleFor('seatedWorkingBack'));
    expect(avatar.querySelector('img')).toHaveAttribute('src', '/avatars/Alice/seated-working-back.png');
    expect(avatar.innerHTML).not.toContain('at-desk.png');
    expect(avatar.innerHTML).not.toContain('seated-idle-back.png');
  });
});

describe('movement avatar selection', () => {
  it.each([
    [{ x: 0, y: 0 }, { x: 4, y: -6 }, 'up'],
    [{ x: 0, y: 0 }, { x: -4, y: 6 }, 'down'],
    [{ x: 0, y: 0 }, { x: -6, y: -4 }, 'left'],
    [{ x: 0, y: 0 }, { x: 6, y: -4 }, 'right'],
    [{ x: 0, y: 0 }, { x: 6, y: -6 }, 'right'],
    [{ x: 0, y: 0 }, { x: 0, y: 0 }, null],
  ] as const)('classifies the delta from %o to %o as %s', (from, to, expectedDirection) => {
    expect(directionBetween(from, to)).toBe(expectedDirection);
  });

  it.each([
    ['walk', 'up', 'walkUp'],
    ['walk', 'down', 'walkDown'],
    ['walk', 'left', 'walkLeft'],
    ['walk', 'right', 'walkRight'],
    ['carry', 'up', 'carryUp'],
    ['carry', 'down', 'carryDown'],
    ['carry', 'left', 'carryLeft'],
    ['carry', 'right', 'carryRight'],
  ] as const)('resolves %s moving %s to %s', (pose, direction, expectedPose) => {
    expect(resolveMovementPose(pose, direction)).toBe(expectedPose);
  });

  it.each([
    ['walk', 'up', '/avatars/Alice/walk-up.png'],
    ['walk', 'down', '/avatars/Alice/walk-down.png'],
    ['walk', 'left', '/avatars/Alice/walk-left.png'],
    ['walk', 'right', '/avatars/Alice/walk-right.png'],
    ['carry', 'up', '/avatars/Alice/carry-up.png'],
    ['carry', 'down', '/avatars/Alice/carry-down.png'],
    ['carry', 'left', '/avatars/Alice/carry-left.png'],
    ['carry', 'right', '/avatars/Alice/carry-right.png'],
  ] as const)('renders the exact %s/%s asset', (pose, direction, expectedPath) => {
    const actor = {
      id: 'alice',
      deskId: 'pm-alice',
      pose,
      direction,
      coordinate: { x: 160, y: 465 },
    } as const;

    render(
      <RuntimeActorSprite
        actor={actor}
        position={actor.coordinate}
        transitionDurationMs={340}
      />,
    );

    expect(screen.getByTestId('moving-avatar-alice').querySelector('img')).toHaveAttribute('src', expectedPath);
  });

  it('keeps every directional pose foot anchor within one scene pixel', () => {
    const movementPoses = avatarPoseKeys.filter((pose): pose is MovementAvatarPoseName => /^(walk|carry)(Up|Down|Left|Right)$/.test(pose));
    const sceneAnchor = { x: 850, y: 510 };
    const renderSize = officeLayout.assetAnchors.avatars.movementRecommendedRenderSize;
    for (const assets of Object.values(officeLayout.assetAnchors.avatars.byActor)) {
      for (const pose of movementPoses) {
        const asset = assets[pose];
        const placement = calculateScenePlacement({ sceneAnchor, sourceAnchor: asset.visualFootShadowCenterSource, renderSize, sourceCanvas: officeLayout.assetAnchors.sourceCanvas });
        const reconstructed = {
          x: placement.left + asset.visualFootShadowCenterSource.x * renderSize.width / officeLayout.assetAnchors.sourceCanvas.width,
          y: placement.top + asset.visualFootShadowCenterSource.y * renderSize.height / officeLayout.assetAnchors.sourceCanvas.height,
        };
        expect(Math.abs(reconstructed.x - sceneAnchor.x), `${asset.path} x anchor`).toBeLessThanOrEqual(1);
        expect(Math.abs(reconstructed.y - sceneAnchor.y), `${asset.path} y anchor`).toBeLessThanOrEqual(1);
      }
    }
  });
});
