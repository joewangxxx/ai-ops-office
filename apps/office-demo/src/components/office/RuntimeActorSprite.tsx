import { officeLayout, toPublicAssetPath, type ScenePoint } from '../../data/officeLayout';
import { resolveMovementPose, type MovementDirection } from '../../utils/avatarPresentation';
import { calculateMovingAvatarPresentation } from '../../utils/avatarVisualBounds';
import { toSceneRelativeStyle } from '../../utils/scenePlacement';

type RuntimeActorSpriteProps = {
  actor: { id: string; deskId: string; pose: 'walk' | 'carry'; direction: MovementDirection };
  position: ScenePoint;
  transitionDurationMs: number;
};

export function RuntimeActorSprite({ actor, position, transitionDurationMs }: RuntimeActorSpriteProps) {
  const desk = officeLayout.desks.find((item) => item.id === actor.deskId)!;
  const actorKey = desk.occupant.avatarKey!;
  const presentationPose = resolveMovementPose(actor.pose, actor.direction);
  const asset = officeLayout.assetAnchors.avatars.byActor[actorKey][presentationPose];
  const renderSize = officeLayout.assetAnchors.avatars.movementRecommendedRenderSize;
  const orbAsset = officeLayout.assetAnchors.orbs.gray;
  const placement = calculateMovingAvatarPresentation({
    sceneAnchor: position,
    asset,
    orbAsset,
    orbRenderSize: orbAsset.recommendedRenderSize,
    renderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  }).placement;
  return (
    <span
      aria-hidden="true"
      className="office-sprite office-sprite--moving-avatar"
      data-runtime-actor={actor.id}
      data-movement-direction={actor.direction}
      data-testid={`moving-avatar-${actor.id}`}
      style={{
        ...toSceneRelativeStyle({ placement, renderSize, sceneSize: officeLayout.scene }),
        transitionDuration: `${transitionDurationMs}ms`,
      }}
    >
      <img alt="" className="office-sprite__image" draggable={false} src={toPublicAssetPath(asset.path)} />
    </span>
  );
}
