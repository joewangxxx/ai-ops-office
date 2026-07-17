import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AvatarSprite } from '../src/components/office/AvatarSprite';
import { officeLayout, type RenderSize, type ScenePoint, type SourceRect } from '../src/data/officeLayout';
import { resolveSeatedPose } from '../src/utils/avatarPresentation';
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
  'carryUp',
  'carryDown',
] as const;

const newlyRegisteredPoseFiles = {
  seatedIdleBack: 'seated-idle-back.png',
  seatedWorkingBack: 'seated-working-back.png',
  walkUp: 'walk-up.png',
  walkDown: 'walk-down.png',
  carryUp: 'carry-up.png',
  carryDown: 'carry-down.png',
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
  it('registers ten anchored, unique assets for each of the seven actors', () => {
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

    expect(allPaths).toHaveLength(70);
    expect(new Set(allPaths)).toHaveProperty('size', 70);
    expect(newPaths).toHaveLength(42);
    expect(new Set(newPaths)).toHaveProperty('size', 42);
  });

  it('provides a finite seated-back anchor for every desk', () => {
    expect(officeLayout.desks).toHaveLength(10);
    for (const desk of officeLayout.desks) {
      expectFinitePoint(desk.seatedBackAnchor);
    }
  });
});

describe('seated avatar selection', () => {
  it('selects idle without Active Work and working with Active Work', () => {
    expect(resolveSeatedPose(false)).toBe('seatedIdleBack');
    expect(resolveSeatedPose(true)).toBe('seatedWorkingBack');
  });

  it('renders only the selected 150px seated asset at the seated-back anchor', () => {
    const desk = officeLayout.desks.find((item) => item.id === 'pm-alice')!;
    const onSelect = vi.fn();
    const renderSize: RenderSize = { width: 150, height: 150 };
    const expectedStyleFor = (pose: 'seatedIdleBack' | 'seatedWorkingBack') => {
      const placement = calculateScenePlacement({
        sceneAnchor: desk.seatedBackAnchor,
        sourceAnchor: officeLayout.assetAnchors.avatars.byActor.Alice[pose].visualSeatedBaseCenterSource,
        renderSize,
        sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
      });
      return toSceneRelativeStyle({ placement, renderSize, sceneSize: officeLayout.scene });
    };

    const { rerender } = render(<AvatarSprite desk={desk} hasActiveWork={false} onSelect={onSelect} />);
    const avatar = screen.getByTestId('avatar-pm-alice');

    expect(avatar).toHaveAttribute('data-avatar-pose', 'seatedIdleBack');
    expect(avatar).toHaveStyle(expectedStyleFor('seatedIdleBack'));
    expect(avatar.querySelector('img')).toHaveAttribute('src', '/avatars/Alice/seated-idle-back.png');
    expect(avatar.innerHTML).not.toContain('at-desk.png');
    expect(avatar.innerHTML).not.toContain('seated-working-back.png');

    rerender(<AvatarSprite desk={desk} hasActiveWork onSelect={onSelect} />);

    expect(avatar).toHaveAttribute('data-avatar-pose', 'seatedWorkingBack');
    expect(avatar).toHaveStyle(expectedStyleFor('seatedWorkingBack'));
    expect(avatar.querySelector('img')).toHaveAttribute('src', '/avatars/Alice/seated-working-back.png');
    expect(avatar.innerHTML).not.toContain('at-desk.png');
    expect(avatar.innerHTML).not.toContain('seated-idle-back.png');
  });
});
