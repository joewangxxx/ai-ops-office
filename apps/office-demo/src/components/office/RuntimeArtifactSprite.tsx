import type { MotionPresentation } from '../../hooks/useOfficeMotionRunner';
import type { OfficeSnapshot } from '../../backend/officeDomain';
import { officeLayout, toPublicAssetPath, type ScenePoint } from '../../data/officeLayout';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';

const artifactAssetByCategory = { prd: 'prdBlue', feature: 'featureGreen', report: 'reportPurple' } as const;

function artifactAnchor(artifact: OfficeSnapshot['artifacts'][string], motion: MotionPresentation | null): ScenePoint {
  if (artifact.location === 'carrier' && motion) return { x: motion.coordinate.x + 40, y: motion.coordinate.y - 50 };
  if (artifact.location === 'hub') return officeLayout.handoffAnchors.hubDropPoint;
  const desk = artifact.deskId ? officeLayout.desks.find((item) => item.id === artifact.deskId) : undefined;
  return desk ? { x: desk.deskAnchor.x + 30, y: desk.deskAnchor.y - 70 } : officeLayout.handoffAnchors.hubDropPoint;
}

export function RuntimeArtifactSprite({ motion, snapshot }: { motion: MotionPresentation | null; snapshot: OfficeSnapshot }) {
  return Object.values(snapshot.artifacts).map((artifact) => {
    const asset = officeLayout.assetAnchors.artifacts[artifactAssetByCategory[artifact.category]];
    const placement = calculateScenePlacement({
      sceneAnchor: artifactAnchor(artifact, motion?.motionId === snapshot.activeMotion?.id && snapshot.activeMotion?.artifactId === artifact.id ? motion : null),
      sourceAnchor: asset.visualBottomCenterSource,
      renderSize: asset.recommendedRenderSize,
      sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
    });
    return <img
      alt=""
      aria-hidden="true"
      className="office-sprite office-sprite--story-artifact"
      data-artifact-location={artifact.location}
      data-testid={`runtime-artifact-${artifact.id}`}
      draggable={false}
      key={artifact.id}
      src={toPublicAssetPath(asset.path)}
      style={{
        ...toSceneRelativeStyle({ placement, renderSize: asset.recommendedRenderSize, sceneSize: officeLayout.scene }),
        transitionDuration: `${motion?.transitionDurationMs ?? 0}ms`,
      }}
    />;
  });
}
