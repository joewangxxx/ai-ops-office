import { officeLayout, toPublicAssetPath, type ScenePoint } from '../../data/officeLayout';
import type { OrbState } from '../../types/officePresentation';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';

type AgentOrbProps = {
  desk: (typeof officeLayout.desks)[number];
  anchor?: ScenePoint;
  state?: OrbState;
  transitionDurationMs?: number;
};

export function AgentOrb({ anchor, desk, state = 'gray', transitionDurationMs = 0 }: AgentOrbProps) {
  const asset = officeLayout.assetAnchors.orbs[state];
  const position = calculateScenePlacement({
    sceneAnchor: anchor ?? desk.orbAnchor,
    sourceAnchor: asset.visualCenterSource,
    renderSize: asset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });
  if (!desk.online) return null;

  return (
    <img
      alt={`${desk.occupant.displayName} agent ${asset.meaning}`}
      className={`office-sprite office-sprite--orb${transitionDurationMs > 0 ? ' office-sprite--orb-moving' : ''}`}
      data-testid={`orb-${desk.id}`}
      draggable={false}
      src={toPublicAssetPath(asset.path)}
      style={{
        ...toSceneRelativeStyle({ placement: position, renderSize: asset.recommendedRenderSize, sceneSize: officeLayout.scene }),
        transitionDuration: `${transitionDurationMs}ms`,
      }}
    />
  );
}
