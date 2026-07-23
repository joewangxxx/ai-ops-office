import type { FurnitureAsset, MovementAvatarPoseAsset, OrbAsset, RenderSize, ScenePoint, SeatedAvatarPoseAsset, SourceRect } from '../data/officeLayout';
import { calculateScenePlacement } from './scenePlacement';

type Placement = { left: number; top: number };

type DecorationAnchors = {
  nameTag: ScenePoint;
  orb: ScenePoint;
};

export const NAME_TAG_VISIBLE_GAP = 10;
export const ORB_VISIBLE_GAP = 10;
export const NAME_TAG_RENDER_SIZE: RenderSize = { width: 68, height: 24 };
const DECORATION_AVOIDANCE_GAP = 4;

export function calculateRenderedVisualBounds(
  placement: Placement,
  sourceAlphaBounds: SourceRect,
  renderSize: RenderSize,
  sourceCanvas: RenderSize,
): SourceRect {
  const scaleX = renderSize.width / sourceCanvas.width;
  const scaleY = renderSize.height / sourceCanvas.height;
  return {
    x: placement.left + sourceAlphaBounds.x * scaleX,
    y: placement.top + sourceAlphaBounds.y * scaleY,
    width: sourceAlphaBounds.width * scaleX,
    height: sourceAlphaBounds.height * scaleY,
  };
}

function overlaps(first: SourceRect, second: SourceRect) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function nameTagBoundsAt(anchor: ScenePoint): SourceRect {
  return {
    x: anchor.x - NAME_TAG_RENDER_SIZE.width / 2,
    y: anchor.y - NAME_TAG_RENDER_SIZE.height,
    ...NAME_TAG_RENDER_SIZE,
  };
}

function avoidHorizontalCollisions(preferredAnchor: ScenePoint, obstacles: SourceRect[]) {
  const preferredBounds = nameTagBoundsAt(preferredAnchor);
  if (!obstacles.some((obstacle) => overlaps(preferredBounds, obstacle))) return preferredAnchor;

  const candidateXs = obstacles.flatMap((obstacle) => [
    obstacle.x - DECORATION_AVOIDANCE_GAP - NAME_TAG_RENDER_SIZE.width / 2,
    obstacle.x + obstacle.width + DECORATION_AVOIDANCE_GAP + NAME_TAG_RENDER_SIZE.width / 2,
  ]);
  const safeCandidates = candidateXs
    .map((x) => ({ x, y: preferredAnchor.y }))
    .filter((candidate) => !obstacles.some((obstacle) => overlaps(nameTagBoundsAt(candidate), obstacle)))
    .sort((first, second) => {
      const firstDistance = Math.abs(first.x - preferredAnchor.x);
      const secondDistance = Math.abs(second.x - preferredAnchor.x);
      return firstDistance - secondDistance || second.x - first.x;
    });

  return safeCandidates[0] ?? preferredAnchor;
}

export function calculateAvatarDecorationLayout({
  avatarVisibleBounds,
  avoidanceBounds = [],
  orbAsset,
  orbRenderSize,
  sourceCanvas,
}: {
  avatarVisibleBounds: SourceRect;
  avoidanceBounds?: SourceRect[];
  orbAsset: OrbAsset;
  orbRenderSize: RenderSize;
  sourceCanvas: RenderSize;
}) {
  const orbScaleX = orbRenderSize.width / sourceCanvas.width;
  const orbScaleY = orbRenderSize.height / sourceCanvas.height;
  const targetOrbVisibleLeft = avatarVisibleBounds.x + avatarVisibleBounds.width + ORB_VISIBLE_GAP;
  const targetOrbVisibleCenterY = avatarVisibleBounds.y + Math.min(24, avatarVisibleBounds.height * 0.32);
  const orbVisibleCenterSourceY = orbAsset.sourceAlphaBounds.y + orbAsset.sourceAlphaBounds.height / 2;
  const orbAnchor = {
    x: targetOrbVisibleLeft + (orbAsset.visualCenterSource.x - orbAsset.sourceAlphaBounds.x) * orbScaleX,
    y: targetOrbVisibleCenterY + (orbAsset.visualCenterSource.y - orbVisibleCenterSourceY) * orbScaleY,
  };
  const orbPlacement = calculateScenePlacement({
    sceneAnchor: orbAnchor,
    sourceAnchor: orbAsset.visualCenterSource,
    renderSize: orbRenderSize,
    sourceCanvas,
  });
  const orbVisibleBounds = calculateRenderedVisualBounds(
    orbPlacement,
    orbAsset.sourceAlphaBounds,
    orbRenderSize,
    sourceCanvas,
  );
  const preferredNameTagAnchor = {
    x: avatarVisibleBounds.x + avatarVisibleBounds.width / 2,
    y: avatarVisibleBounds.y - NAME_TAG_VISIBLE_GAP,
  };
  const nameTagAnchor = avoidHorizontalCollisions(preferredNameTagAnchor, [...avoidanceBounds, orbVisibleBounds]);

  return {
    decorationAnchors: { nameTag: nameTagAnchor, orb: orbAnchor } satisfies DecorationAnchors,
    nameTagBounds: nameTagBoundsAt(nameTagAnchor),
    orbVisibleBounds,
  };
}

export function calculateSeatedAvatarPresentation({
  avatarAsset,
  avatarAnchor,
  avatarRenderSize,
  chairAsset,
  chairAnchor,
  chairRenderSize,
  avoidanceBounds,
  orbAsset,
  orbRenderSize,
  sourceCanvas,
}: {
  avatarAsset: SeatedAvatarPoseAsset;
  avatarAnchor: ScenePoint;
  avatarRenderSize: RenderSize;
  chairAsset: FurnitureAsset;
  chairAnchor: ScenePoint;
  chairRenderSize: RenderSize;
  avoidanceBounds?: SourceRect[];
  orbAsset: OrbAsset;
  orbRenderSize: RenderSize;
  sourceCanvas: RenderSize;
}) {
  if (!chairAsset.sourceAlphaBounds) throw new Error('Chair sourceAlphaBounds are required for seated placement');
  const chairPlacement = calculateScenePlacement({
    sceneAnchor: chairAnchor,
    sourceAnchor: chairAsset.visualBottomCenterSource,
    renderSize: chairRenderSize,
    sourceCanvas,
  });
  const chairVisibleBounds = calculateRenderedVisualBounds(chairPlacement, chairAsset.sourceAlphaBounds, chairRenderSize, sourceCanvas);
  const placement = calculateScenePlacement({
    sceneAnchor: avatarAnchor,
    sourceAnchor: avatarAsset.visualSeatedBaseCenterSource,
    renderSize: avatarRenderSize,
    sourceCanvas,
  });
  const visibleBounds = calculateRenderedVisualBounds(placement, avatarAsset.sourceAlphaBounds, avatarRenderSize, sourceCanvas);
  const decorationLayout = calculateAvatarDecorationLayout({
    avatarVisibleBounds: visibleBounds,
    avoidanceBounds,
    orbAsset,
    orbRenderSize,
    sourceCanvas,
  });
  return {
    placement,
    visibleBounds,
    chairVisibleBounds,
    ...decorationLayout,
  };
}

export function calculateMovingAvatarPresentation({
  asset,
  orbAsset,
  orbRenderSize,
  renderSize,
  sceneAnchor,
  sourceCanvas,
}: {
  asset: MovementAvatarPoseAsset;
  orbAsset: OrbAsset;
  orbRenderSize: RenderSize;
  renderSize: RenderSize;
  sceneAnchor: ScenePoint;
  sourceCanvas: RenderSize;
}) {
  const placement = calculateScenePlacement({
    sceneAnchor,
    sourceAnchor: asset.visualFootShadowCenterSource,
    renderSize,
    sourceCanvas,
  });
  const visibleBounds = calculateRenderedVisualBounds(placement, asset.sourceAlphaBounds, renderSize, sourceCanvas);
  const decorationLayout = calculateAvatarDecorationLayout({
    avatarVisibleBounds: visibleBounds,
    orbAsset,
    orbRenderSize,
    sourceCanvas,
  });
  return {
    placement,
    visibleBounds,
    ...decorationLayout,
  };
}

export function calculateOfflineNameTagAnchor(deskAnchor: ScenePoint): ScenePoint {
  return { x: deskAnchor.x, y: deskAnchor.y - 76 };
}
