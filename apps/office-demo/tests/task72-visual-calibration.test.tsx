import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { ArtifactHub } from '../src/components/office/ArtifactHub';
import { DeskStation } from '../src/components/office/DeskStation';
import { officeLayout } from '../src/data/officeLayout';
import { calculateScenePlacement } from '../src/utils/scenePlacement';
import '../src/styles/app.css';

const repositoryRoot = resolve(process.cwd(), '../..');

function sha256(relativePath: string) {
  return createHash('sha256').update(readFileSync(resolve(repositoryRoot, relativePath))).digest('hex');
}

function overlaps(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

async function loadAvatarBoundsModule() {
  const modulePath = '../src/utils/avatarVisualBounds';
  return import(/* @vite-ignore */ modulePath).catch(() => null);
}

describe('Task 7.2 clean furniture promotion', () => {
  it('publishes byte-identical audited layers at production furniture paths', () => {
    const productionAssets = [
      ['images/furniture/desk-back.png', 'ab0acab0d9da7bb6837b284e982b9c259e9cc93913ad4a1fbb4826d9e05434f0'],
      ['images/furniture/desk-chair-back.png', '4837cb422d90a22293263a01c268cb57bb248b3f72c4f0cb6f9b1b773ef902c0'],
      ['images/furniture/desk-foreground.png', '4760a064f01579d158d9cbaeb10a9745b2394d4f5b54c46d4480401e4be2c2e5'],
    ] as const;

    for (const [path, hash] of productionAssets) {
      expect(existsSync(resolve(repositoryRoot, path)), path).toBe(true);
      if (existsSync(resolve(repositoryRoot, path))) expect(sha256(path), path).toBe(hash);
    }

    expect(officeLayout.assetAnchors.furniture.deskBack.path).toBe('images/furniture/desk-back.png');
    expect(officeLayout.assetAnchors.furniture.deskChairBack.path).toBe('images/furniture/desk-chair-back.png');
    expect(officeLayout.assetAnchors.furniture.deskForeground.path).toBe('images/furniture/desk-foreground.png');
    expect(sha256('images/furniture/desk-chair-back.png')).toBe('4837cb422d90a22293263a01c268cb57bb248b3f72c4f0cb6f9b1b773ef902c0');
    expect(officeLayout.assetAnchors.furniture.deskBack.sourceAlphaBounds).toEqual({ x: 261, y: 279, width: 738, height: 480 });
    expect(officeLayout.assetAnchors.furniture.deskForeground.sourceAlphaBounds).toEqual({ x: 262, y: 740, width: 737, height: 93 });
    expect(officeLayout.assetAnchors.furniture.deskChairBack.sourceAlphaBounds).toEqual({ x: 476, y: 655, width: 289, height: 291 });
  });
});

describe('Task 7.2 avatar visible-bound placement', () => {
  it('registers and renders the audited workstation as independent back, chair, and foreground layers', () => {
    const furniture = officeLayout.assetAnchors.furniture as unknown as Record<string, {
      path: string;
      recommendedRenderSize: { width: number; height: number };
    }>;
    expect(furniture.deskBack?.path).toBe('images/furniture/desk-back.png');
    expect(furniture.deskForeground?.path).toBe('images/furniture/desk-foreground.png');
    expect(furniture.deskChairBack.recommendedRenderSize).toEqual({ width: 260, height: 260 });

    const alice = officeLayout.desks.find((desk) => desk.id === 'pm-alice')!;
    const { rerender } = render(<DeskStation desk={alice} layer={'deskBack' as never} onSelect={vi.fn()} />);
    expect(screen.getByTestId('desk-back-pm-alice')).toHaveAttribute('src', '/furniture/desk-back.png');

    rerender(<DeskStation desk={alice} layer={'deskForeground' as never} onSelect={vi.fn()} />);
    expect(screen.getByTestId('desk-foreground-pm-alice')).toHaveAttribute('src', '/furniture/desk-foreground.png');
  });

  it('places every seated employee label above visible hair and every orb 10px beyond the visible right edge', async () => {
    const bounds = await loadAvatarBoundsModule();
    expect(bounds).not.toBeNull();
    if (!bounds) return;

    for (const desk of officeLayout.desks.filter((item) => item.online && item.occupant.avatarKey)) {
      const avatarAsset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey!].seatedWorkingBack;
      const deskBack = officeLayout.assetAnchors.furniture.deskBack as typeof officeLayout.assetAnchors.furniture.deskBack & {
        decorationAvoidanceRectsSource?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
      };
      expect(deskBack.decorationAvoidanceRectsSource, `${desk.id} decoration avoidance metadata`).toHaveLength(2);
      const deskBackPlacement = calculateScenePlacement({
        sceneAnchor: desk.deskAnchor,
        sourceAnchor: deskBack.visualBottomCenterSource,
        renderSize: deskBack.recommendedRenderSize,
        sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
      });
      const avoidanceBounds = (deskBack.decorationAvoidanceRectsSource ?? []).map((rect) => bounds.calculateRenderedVisualBounds(
        deskBackPlacement,
        rect,
        deskBack.recommendedRenderSize,
        officeLayout.assetAnchors.sourceCanvas,
      ));
      const calculate = bounds.calculateSeatedAvatarPresentation as (input: Record<string, unknown>) => {
        visibleBounds: { x: number; y: number; width: number; height: number };
        chairVisibleBounds: { x: number; y: number; width: number; height: number };
        nameTagBounds?: { x: number; y: number; width: number; height: number };
        orbVisibleBounds?: { x: number; y: number; width: number; height: number };
        decorationAnchors: { nameTag: { x: number; y: number }; orb: { x: number; y: number } };
      };
      const orbAsset = officeLayout.assetAnchors.orbs.gray;
      const result = calculate({
        avatarAnchor: desk.seatedBackAnchor,
        chairAnchor: desk.chairBackAnchor,
        avatarAsset,
        avatarRenderSize: officeLayout.assetAnchors.avatars.seatedRecommendedRenderSize,
        chairAsset: officeLayout.assetAnchors.furniture.deskChairBack,
        chairRenderSize: officeLayout.assetAnchors.furniture.deskChairBack.recommendedRenderSize,
        orbAsset,
        orbRenderSize: orbAsset.recommendedRenderSize,
        avoidanceBounds,
        sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
      });

      expect(result.nameTagBounds, `${desk.id} name-tag bounds`).toBeDefined();
      expect(result.orbVisibleBounds, `${desk.id} orb bounds`).toBeDefined();
      if (!result.nameTagBounds || !result.orbVisibleBounds) continue;

      const avatarCenter = result.visibleBounds.x + result.visibleBounds.width / 2;
      const chairCenter = result.chairVisibleBounds.x + result.chairVisibleBounds.width / 2;
      expect(Math.abs(avatarCenter - chairCenter), `${desk.id} chair centering`).toBeLessThanOrEqual(1);
      expect(result.visibleBounds.y - (result.nameTagBounds.y + result.nameTagBounds.height), `${desk.id} label gap`).toBeCloseTo(10, 6);
      const orbGap = result.orbVisibleBounds.x - (result.visibleBounds.x + result.visibleBounds.width);
      expect(orbGap, `${desk.id} orb gap minimum`).toBeGreaterThanOrEqual(8);
      expect(orbGap, `${desk.id} orb gap maximum`).toBeLessThanOrEqual(12);
      expect(result.visibleBounds.y + result.visibleBounds.height, `${desk.id} seated bottom`).toBeLessThanOrEqual(result.chairVisibleBounds.y + result.chairVisibleBounds.height + 0.001);
      expect(avoidanceBounds.some((boundsRect) => overlaps(result.nameTagBounds!, boundsRect)), `${desk.id} label avoids desk controls`).toBe(false);
      expect(overlaps(result.nameTagBounds, result.orbVisibleBounds), `${desk.id} label avoids orb`).toBe(false);
    }
  });

  it('uses the same visible-edge semantics for all eight moving poses of every online employee', async () => {
    const bounds = await loadAvatarBoundsModule();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    const sceneAnchor = { x: 850, y: 510 };
    const poseNames = ['walkUp', 'walkDown', 'walkLeft', 'walkRight', 'carryUp', 'carryDown', 'carryLeft', 'carryRight'] as const;
    const orbAsset = officeLayout.assetAnchors.orbs.gray;

    for (const desk of officeLayout.desks.filter((item) => item.online && item.occupant.avatarKey)) {
      for (const poseName of poseNames) {
        const asset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey!][poseName];
        const result = bounds.calculateMovingAvatarPresentation({
          sceneAnchor,
          asset,
          renderSize: officeLayout.assetAnchors.avatars.movementRecommendedRenderSize,
          orbAsset,
          orbRenderSize: orbAsset.recommendedRenderSize,
          sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
        });
        expect(result.nameTagBounds, `${desk.id} ${poseName} name-tag bounds`).toBeDefined();
        expect(result.orbVisibleBounds, `${desk.id} ${poseName} orb bounds`).toBeDefined();
        if (!result.nameTagBounds || !result.orbVisibleBounds) continue;
        expect(result.visibleBounds.y - (result.nameTagBounds.y + result.nameTagBounds.height), `${desk.id} ${poseName} label gap`).toBeCloseTo(10, 6);
        const orbGap = result.orbVisibleBounds.x - (result.visibleBounds.x + result.visibleBounds.width);
        expect(orbGap, `${desk.id} ${poseName} orb gap minimum`).toBeGreaterThanOrEqual(8);
        expect(orbGap, `${desk.id} ${poseName} orb gap maximum`).toBeLessThanOrEqual(12);
      }
    }
  });

  it('keeps the 10px visible-edge orb gap for blue, gray, and yellow assets', async () => {
    const bounds = await loadAvatarBoundsModule();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    const calculateDecorationLayout = bounds.calculateAvatarDecorationLayout as undefined | ((input: Record<string, unknown>) => {
      orbVisibleBounds: { x: number; y: number; width: number; height: number };
    });
    expect(calculateDecorationLayout).toBeTypeOf('function');
    if (!calculateDecorationLayout) return;
    const avatarVisibleBounds = { x: 100, y: 200, width: 48, height: 84 };

    for (const state of ['blue', 'gray', 'yellow'] as const) {
      const result = calculateDecorationLayout({
        avatarVisibleBounds,
        orbAsset: officeLayout.assetAnchors.orbs[state],
        orbRenderSize: officeLayout.assetAnchors.orbs[state].recommendedRenderSize,
        sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
      });
      const orbGap = result.orbVisibleBounds.x - 148;
      expect(orbGap, `${state} orb gap minimum`).toBeGreaterThanOrEqual(8);
      expect(orbGap, `${state} orb gap maximum`).toBeLessThanOrEqual(12);
    }
  });

  it('keeps an offline name near its empty desk without an avatar anchor', async () => {
    const bounds = await loadAvatarBoundsModule();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    const desk = officeLayout.desks.find((item) => item.id === 'pm-cindy')!;

    expect(bounds.calculateOfflineNameTagAnchor(desk.deskAnchor)).toEqual({ x: desk.deskAnchor.x, y: desk.deskAnchor.y - 76 });
  });

  it('keeps the production workstation layers in strict visual order', () => {
    render(<App />);
    const selectors = [
      '.office-scene__layer--desk-backs',
      '.office-scene__layer--chairs',
      '.office-scene__layer--avatars',
      '.office-scene__layer--furniture',
      '.office-scene__layer--labels',
    ];
    const layers = selectors.map((selector) => document.querySelector(selector) as HTMLElement);
    expect(layers.every(Boolean)).toBe(true);
    expect(layers.map((layer) => getComputedStyle(layer).zIndex)).toEqual(['4', '5', '10', '20', '40']);
    for (let index = 1; index < layers.length; index += 1) {
      expect(layers[index - 1].compareDocumentPosition(layers[index]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});

describe('Task 7.2 Artifact Hub metrics', () => {
  it('renders fixed label and count columns for 0, 9, and 12', () => {
    render(<ArtifactHub counts={[
      { category: 'prd', label: 'PRDs', count: 0 },
      { category: 'feature', label: 'Features', count: 9 },
      { category: 'report', label: 'Reports', count: 12 },
    ]} onSelect={vi.fn()} />);

    expect(screen.getByTestId('artifact-hub-screen')).toHaveAttribute('data-count-column', '2ch');
    expect(screen.getByText('PRD').parentElement).toHaveClass('artifact-hub__metric');
    expect(screen.getByText('Feature')).toHaveClass('artifact-hub__metric-label');
    expect(screen.getByText('12')).toHaveClass('artifact-hub__metric-count');
  });
});
