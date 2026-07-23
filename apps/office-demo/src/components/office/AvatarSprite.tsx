import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import type { Selection } from '../../types/selection';
import { resolveSeatedPose } from '../../utils/avatarPresentation';
import { calculateSeatedAvatarPresentation } from '../../utils/avatarVisualBounds';
import { toSceneRelativeStyle } from '../../utils/scenePlacement';

type AvatarSpriteProps = {
  desk: (typeof officeLayout.desks)[number];
  onSelect: (selection: Selection) => void;
  visible?: boolean;
};

export function AvatarSprite({ desk, onSelect, visible = true }: AvatarSpriteProps) {
  if (!visible || !desk.online || !desk.occupant.avatarKey) {
    return null;
  }

  const pose = resolveSeatedPose();
  const asset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey][pose];
  const renderSize = officeLayout.assetAnchors.avatars.seatedRecommendedRenderSize;
  const orbAsset = officeLayout.assetAnchors.orbs.gray;
  const position = calculateSeatedAvatarPresentation({
    avatarAnchor: desk.seatedBackAnchor,
    avatarAsset: asset,
    avatarRenderSize: renderSize,
    chairAsset: officeLayout.assetAnchors.furniture.deskChairBack,
    chairAnchor: desk.chairBackAnchor,
    chairRenderSize: officeLayout.assetAnchors.furniture.deskChairBack.recommendedRenderSize,
    orbAsset,
    orbRenderSize: orbAsset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  }).placement;

  return (
    <button
      aria-label={`Open ${desk.occupant.displayName} detail`}
      className="office-object-button office-sprite office-sprite--avatar"
      data-avatar-pose={pose}
      data-testid={`avatar-${desk.id}`}
      onClick={() => onSelect({ kind: 'avatar', deskId: desk.id })}
      style={toSceneRelativeStyle({ placement: position, renderSize, sceneSize: officeLayout.scene })}
      type="button"
    >
      <img alt="" aria-hidden="true" className="office-sprite__image" draggable={false} src={toPublicAssetPath(asset.path)} />
    </button>
  );
}
