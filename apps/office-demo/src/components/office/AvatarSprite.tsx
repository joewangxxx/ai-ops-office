import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';

type AvatarSpriteProps = {
  desk: (typeof officeLayout.desks)[number];
};

export function AvatarSprite({ desk }: AvatarSpriteProps) {
  if (!desk.online || !desk.occupant.avatarKey) {
    return null;
  }

  const asset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey].atDesk;
  const renderSize = officeLayout.assetAnchors.avatars.recommendedRenderSize;
  const position = calculateScenePlacement({
    sceneAnchor: desk.avatarAnchor,
    sourceAnchor: asset.visualFootShadowCenterSource,
    renderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });

  return (
    <img
      alt=""
      aria-hidden="true"
      className="office-sprite office-sprite--avatar"
      data-testid={`avatar-${desk.id}`}
      draggable={false}
      src={toPublicAssetPath(asset.path)}
      style={toSceneRelativeStyle({ placement: position, renderSize, sceneSize: officeLayout.scene })}
    />
  );
}
