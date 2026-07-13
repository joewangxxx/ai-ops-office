import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import type { Selection } from '../../types/selection';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';

type DeskStationProps = {
  desk: (typeof officeLayout.desks)[number];
  onSelect: (selection: Selection) => void;
};

export function DeskStation({ desk, onSelect }: DeskStationProps) {
  const asset = officeLayout.assetAnchors.furniture.deskStandard;
  const position = calculateScenePlacement({
    sceneAnchor: desk.deskAnchor,
    sourceAnchor: asset.visualBottomCenterSource,
    renderSize: asset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });

  return (
    <button
      aria-label={desk.online ? `Open ${desk.occupant.displayName} detail` : `Open ${desk.occupant.displayName} offline desk detail`}
      className="office-object-button office-sprite office-sprite--desk"
      data-desk-id={desk.id}
      data-testid="desk-station"
      onClick={() => onSelect(desk.online ? { kind: 'avatar', deskId: desk.id } : { kind: 'offlineDesk', deskId: desk.id })}
      style={toSceneRelativeStyle({
        placement: position,
        renderSize: asset.recommendedRenderSize,
        sceneSize: officeLayout.scene,
      })}
      type="button"
    >
      <img alt="" aria-hidden="true" className="office-sprite__image" draggable={false} src={toPublicAssetPath(asset.path)} />
    </button>
  );
}
