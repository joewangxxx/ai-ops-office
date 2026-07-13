import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';

type AgentOrbProps = {
  desk: (typeof officeLayout.desks)[number];
};

export function AgentOrb({ desk }: AgentOrbProps) {
  if (!desk.online) {
    return null;
  }

  const asset = officeLayout.assetAnchors.orbs.gray;
  const position = calculateScenePlacement({
    sceneAnchor: desk.orbAnchor,
    sourceAnchor: asset.visualCenterSource,
    renderSize: asset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });

  return (
    <img
      alt={`${desk.occupant.displayName} agent available`}
      className="office-sprite office-sprite--orb"
      data-testid={`orb-${desk.id}`}
      draggable={false}
      src={toPublicAssetPath(asset.path)}
      style={toSceneRelativeStyle({
        placement: position,
        renderSize: asset.recommendedRenderSize,
        sceneSize: officeLayout.scene,
      })}
    />
  );
}
