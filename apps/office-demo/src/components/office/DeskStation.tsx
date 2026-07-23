import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import type { Selection } from '../../types/selection';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';

type DeskStationProps = {
  desk: (typeof officeLayout.desks)[number];
  layer: 'deskBack' | 'chairBack' | 'deskForeground';
  onSelect: (selection: Selection) => void;
};

export function DeskStation({ desk, layer, onSelect }: DeskStationProps) {
  const asset = layer === 'deskBack'
    ? officeLayout.assetAnchors.furniture.deskBack
    : layer === 'chairBack'
      ? officeLayout.assetAnchors.furniture.deskChairBack
      : officeLayout.assetAnchors.furniture.deskForeground;
  const position = calculateScenePlacement({
    sceneAnchor: layer === 'chairBack' ? desk.chairBackAnchor : desk.deskAnchor,
    sourceAnchor: asset.visualBottomCenterSource,
    renderSize: asset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });

  if (layer === 'deskBack') {
    return (
      <img
        alt=""
        aria-hidden="true"
        className="office-sprite office-sprite--desk-back"
        data-testid={`desk-back-${desk.id}`}
        draggable={false}
        src={toPublicAssetPath(asset.path)}
        style={toSceneRelativeStyle({ placement: position, renderSize: asset.recommendedRenderSize, sceneSize: officeLayout.scene })}
      />
    );
  }

  if (layer === 'chairBack') {
    return (
      <img
        alt=""
        aria-hidden="true"
        className="office-sprite office-sprite--desk-chair"
        data-testid={`desk-chair-${desk.id}`}
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

  const style = toSceneRelativeStyle({
    placement: position,
    renderSize: asset.recommendedRenderSize,
    sceneSize: officeLayout.scene,
  });

  if (desk.online) {
    return (
      <span aria-hidden="true" className="office-sprite office-sprite--desk" data-desk-id={desk.id} data-testid="desk-station" style={style}>
        <img alt="" className="office-sprite__image" data-testid={`desk-foreground-${desk.id}`} draggable={false} src={toPublicAssetPath(asset.path)} />
      </span>
    );
  }

  return (
    <button
      aria-label={`Open ${desk.occupant.displayName} offline desk detail`}
      className="office-object-button office-sprite office-sprite--desk"
      data-desk-id={desk.id}
      data-testid="desk-station"
      onClick={() => onSelect({ kind: 'offlineDesk', deskId: desk.id })}
      style={style}
      type="button"
    >
      <img alt="" aria-hidden="true" className="office-sprite__image" data-testid={`desk-foreground-${desk.id}`} draggable={false} src={toPublicAssetPath(asset.path)} />
    </button>
  );
}
