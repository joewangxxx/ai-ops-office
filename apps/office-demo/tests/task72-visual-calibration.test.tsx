import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArtifactHub } from '../src/components/office/ArtifactHub';
import { DeskStation } from '../src/components/office/DeskStation';
import { officeLayout } from '../src/data/officeLayout';

const repositoryRoot = resolve(process.cwd(), '../..');

function sha256(relativePath: string) {
  return createHash('sha256').update(readFileSync(resolve(repositoryRoot, relativePath))).digest('hex');
}

async function loadAvatarBoundsModule() {
  const modulePath = '../src/utils/avatarVisualBounds';
  return import(/* @vite-ignore */ modulePath).catch(() => null);
}

describe('Task 7.2 clean furniture promotion', () => {
  it('promotes only the audited clean furniture candidates', () => {
    expect(sha256('images/furniture/desk-front.png')).toBe('549379fcf2dcdd87c154e6a82efcade0a5f5ecacf1107c31810ac868824df293');
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
    expect(furniture.deskBack?.path).toBe('images/derived/alice-desk-back-clean-sample.png');
    expect(furniture.deskForeground?.path).toBe('images/derived/alice-desk-foreground-clean-sample.png');
    expect(furniture.deskChairBack.recommendedRenderSize).toEqual({ width: 260, height: 260 });

    const alice = officeLayout.desks.find((desk) => desk.id === 'pm-alice')!;
    const { rerender } = render(<DeskStation desk={alice} layer={'deskBack' as never} onSelect={vi.fn()} />);
    expect(screen.getByTestId('desk-back-pm-alice')).toHaveAttribute('src', '/derived/alice-desk-back-clean-sample.png');

    rerender(<DeskStation desk={alice} layer={'deskForeground' as never} onSelect={vi.fn()} />);
    expect(screen.getByTestId('desk-foreground-pm-alice')).toHaveAttribute('src', '/derived/alice-desk-foreground-clean-sample.png');
  });

  it('centers each seated employee in the chair without extending below it', async () => {
    const bounds = await loadAvatarBoundsModule();
    expect(bounds).not.toBeNull();
    if (!bounds) return;

    for (const desk of officeLayout.desks.filter((item) => item.online && item.occupant.avatarKey)) {
      const avatarAsset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey!].seatedWorkingBack;
      const calculate = bounds.calculateSeatedAvatarPresentation as (input: Record<string, unknown>) => {
        visibleBounds: { x: number; y: number; width: number; height: number };
        chairVisibleBounds: { x: number; y: number; width: number; height: number };
        combinedBounds?: { x: number; y: number; width: number; height: number };
        decorationAnchors: { nameTag: { x: number; y: number }; orb: { x: number; y: number } };
      };
      const result = calculate({
        deskAnchor: desk.deskAnchor,
        avatarAnchor: desk.seatedBackAnchor,
        chairAnchor: desk.chairBackAnchor,
        avatarAsset,
        avatarRenderSize: officeLayout.assetAnchors.avatars.seatedRecommendedRenderSize,
        chairAsset: officeLayout.assetAnchors.furniture.deskChairBack,
        chairRenderSize: officeLayout.assetAnchors.furniture.deskChairBack.recommendedRenderSize,
        sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
      });

      expect(Math.abs(result.visibleBounds.x + result.visibleBounds.width / 2 - desk.seatedBackAnchor.x), desk.id).toBeLessThanOrEqual(1);
      expect(result.combinedBounds, desk.id).toBeDefined();
      const combinedBottom = result.combinedBounds!.y + result.combinedBounds!.height;
      expect(result.decorationAnchors.nameTag.y, desk.id).toBe(combinedBottom + 8);
      expect(result.decorationAnchors.nameTag.y, desk.id).toBeGreaterThan(result.visibleBounds.y + result.visibleBounds.height);
      expect(result.decorationAnchors.orb.x, desk.id).toBe(result.visibleBounds.x + result.visibleBounds.width + 13);
    }
  });

  it('uses the active directional asset bounds for moving labels and orbs', async () => {
    const bounds = await loadAvatarBoundsModule();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    const sceneAnchor = { x: 850, y: 510 };
    const asset = officeLayout.assetAnchors.avatars.byActor.Alice.carryRight;
    const result = bounds.calculateMovingAvatarPresentation({
      sceneAnchor,
      asset,
      renderSize: officeLayout.assetAnchors.avatars.movementRecommendedRenderSize,
      sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
    });
    const alice = officeLayout.desks.find((desk) => desk.id === 'pm-alice')!;
    const legacyNameTagAnchor = {
      x: sceneAnchor.x + alice.nameTagAnchor.x - alice.avatarAnchor.x,
      y: sceneAnchor.y + alice.nameTagAnchor.y - alice.avatarAnchor.y,
    };

    expect(result.decorationAnchors.nameTag.y).toBe(result.visibleBounds.y - 12);
    expect(result.decorationAnchors.orb.x).toBe(result.visibleBounds.x + result.visibleBounds.width + 13);
    expect(result.decorationAnchors.nameTag).not.toEqual(legacyNameTagAnchor);
  });

  it('keeps an offline name near its empty desk without an avatar anchor', async () => {
    const bounds = await loadAvatarBoundsModule();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    const desk = officeLayout.desks.find((item) => item.id === 'pm-cindy')!;

    expect(bounds.calculateOfflineNameTagAnchor(desk.deskAnchor)).toEqual({ x: desk.deskAnchor.x, y: desk.deskAnchor.y - 88 });
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
