import type { RenderSize, ScenePoint, SourceRect } from '../data/officeLayout';

type ScenePlacementInput = {
  sceneAnchor: ScenePoint;
  sourceAnchor: ScenePoint;
  renderSize: RenderSize;
  sourceCanvas: RenderSize;
};

type SceneRelativeStyleInput = {
  placement: ReturnType<typeof calculateScenePlacement>;
  renderSize: RenderSize;
  sceneSize: RenderSize;
};

export function calculateScenePlacement({
  sceneAnchor,
  sourceAnchor,
  renderSize,
  sourceCanvas,
}: ScenePlacementInput) {
  return {
    left: Math.round(sceneAnchor.x - (sourceAnchor.x * renderSize.width) / sourceCanvas.width),
    top: Math.round(sceneAnchor.y - (sourceAnchor.y * renderSize.height) / sourceCanvas.height),
  };
}

export function toSceneRelativeStyle({ placement, renderSize, sceneSize }: SceneRelativeStyleInput) {
  return {
    height: `${(renderSize.height / sceneSize.height) * 100}%`,
    left: `${(placement.left / sceneSize.width) * 100}%`,
    top: `${(placement.top / sceneSize.height) * 100}%`,
    width: `${(renderSize.width / sceneSize.width) * 100}%`,
  };
}

export function scenePointToRelativeStyle(point: ScenePoint, sceneSize: RenderSize) {
  return {
    left: `${(point.x / sceneSize.width) * 100}%`,
    top: `${(point.y / sceneSize.height) * 100}%`,
  };
}

export function sceneRectToRelativeStyle(rect: ScenePoint & RenderSize, sceneSize: RenderSize) {
  return {
    height: `${(rect.height / sceneSize.height) * 100}%`,
    left: `${(rect.x / sceneSize.width) * 100}%`,
    top: `${(rect.y / sceneSize.height) * 100}%`,
    width: `${(rect.width / sceneSize.width) * 100}%`,
  };
}

export function sourceRectToAssetRelativeStyle(sourceRect: SourceRect, sourceCanvas: RenderSize) {
  return {
    height: `${(sourceRect.height / sourceCanvas.height) * 100}%`,
    left: `${(sourceRect.x / sourceCanvas.width) * 100}%`,
    top: `${(sourceRect.y / sourceCanvas.height) * 100}%`,
    width: `${(sourceRect.width / sourceCanvas.width) * 100}%`,
  };
}
