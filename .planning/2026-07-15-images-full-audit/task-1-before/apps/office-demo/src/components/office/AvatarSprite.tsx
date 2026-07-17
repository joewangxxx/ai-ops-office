import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import type { Selection } from '../../types/selection';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';

type AvatarSpriteProps = {
  desk: (typeof officeLayout.desks)[number];
  onSelect: (selection: Selection) => void;
  visible?: boolean;
};

export function AvatarSprite({ desk, onSelect, visible = true }: AvatarSpriteProps) {
  if (!visible || !desk.online || !desk.occupant.avatarKey) {
    return null;
  }

  const asset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey].atDesk;
  const renderSize = officeLayout.assetAnchors.avatars.recommendedRenderSize;
  const position = calculateScenePlacement({
    sceneAnchor: desk.seatAnchor,
    sourceAnchor: asset.visualSeatCenterSource,
    renderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });

  return (
    <button
      aria-label={`Open ${desk.occupant.displayName} detail`}
      className="office-object-button office-sprite office-sprite--avatar"
      data-testid={`avatar-${desk.id}`}
      onClick={() => onSelect({ kind: 'avatar', deskId: desk.id })}
      style={toSceneRelativeStyle({ placement: position, renderSize, sceneSize: officeLayout.scene })}
      type="button"
    >
      <img alt="" aria-hidden="true" className="office-sprite__image" draggable={false} src={toPublicAssetPath(asset.path)} />
    </button>
  );
}
