import type { FurnitureAsset, MovementAvatarPoseAsset, RenderSize, ScenePoint, SeatedAvatarPoseAsset, SourceRect } from '../data/officeLayout';
import { calculateScenePlacement } from './scenePlacement';

type Placement = { left: number; top: number };

type DecorationAnchors = {
  nameTag: ScenePoint;
  orb: ScenePoint;
};

const NAME_TAG_GAP = 12;
const SEATED_NAME_TAG_GAP = 8;
const ORB_GAP = 13;

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

export function calculateAvatarDecorationAnchors(visibleBounds: SourceRect): DecorationAnchors {
  return {
    nameTag: {
      x: visibleBounds.x + visibleBounds.width / 2,
      y: visibleBounds.y - NAME_TAG_GAP,
    },
    orb: {
      x: visibleBounds.x + visibleBounds.width + ORB_GAP,
      y: visibleBounds.y + Math.min(24, visibleBounds.height * 0.32),
    },
  };
}

function unionBounds(first: SourceRect, second: SourceRect): SourceRect {
  const x = Math.min(first.x, second.x);
  const y = Math.min(first.y, second.y);
  const right = Math.max(first.x + first.width, second.x + second.width);
  const bottom = Math.max(first.y + first.height, second.y + second.height);
  return { x, y, width: right - x, height: bottom - y };
}

function calculateSeatedDecorationAnchors(avatarBounds: SourceRect, combinedBounds: SourceRect): DecorationAnchors {
  return {
    nameTag: {
      x: avatarBounds.x + avatarBounds.width / 2,
      y: combinedBounds.y + combinedBounds.height + SEATED_NAME_TAG_GAP,
    },
    orb: calculateAvatarDecorationAnchors(avatarBounds).orb,
  };
}

export function calculateSeatedAvatarPresentation({
  avatarAsset,
  avatarAnchor,
  avatarRenderSize,
  chairAsset,
  chairAnchor,
  chairRenderSize,
  sourceCanvas,
}: {
  avatarAsset: SeatedAvatarPoseAsset;
  avatarAnchor: ScenePoint;
  avatarRenderSize: RenderSize;
  chairAsset: FurnitureAsset;
  chairAnchor: ScenePoint;
  chairRenderSize: RenderSize;
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
  const combinedBounds = unionBounds(visibleBounds, chairVisibleBounds);
  return {
    placement,
    visibleBounds,
    chairVisibleBounds,
    combinedBounds,
    decorationAnchors: calculateSeatedDecorationAnchors(visibleBounds, combinedBounds),
  };
}

export function calculateMovingAvatarPresentation({
  asset,
  renderSize,
  sceneAnchor,
  sourceCanvas,
}: {
  asset: MovementAvatarPoseAsset;
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
  return {
    placement,
    visibleBounds,
    decorationAnchors: calculateAvatarDecorationAnchors(visibleBounds),
  };
}

export function calculateOfflineNameTagAnchor(deskAnchor: ScenePoint): ScenePoint {
  return { x: deskAnchor.x, y: deskAnchor.y - 88 };
}
