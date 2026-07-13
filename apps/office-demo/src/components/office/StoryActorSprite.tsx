import { officeLayout, toPublicAssetPath, type ScenePoint } from '../../data/officeLayout';
import type { StoryActor } from '../../story/prdHandoffStory';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';
import { usePausedScenePlacement } from '../../hooks/usePausedScenePlacement';

type StoryActorSpriteProps = {
  actor: StoryActor;
  position: ScenePoint;
  transitionDurationMs: number;
  isPaused: boolean;
};

export function StoryActorSprite({ actor, isPaused, position, transitionDurationMs }: StoryActorSpriteProps) {
  const desk = officeLayout.desks.find((item) => item.id === actor.deskId)!;
  const actorKey = desk.occupant.avatarKey!;
  const asset = officeLayout.assetAnchors.avatars.byActor[actorKey][actor.pose];
  const renderSize = officeLayout.assetAnchors.avatars.recommendedRenderSize;
  const placement = calculateScenePlacement({
    sceneAnchor: position,
    sourceAnchor: asset.visualFootShadowCenterSource,
    renderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });
  const pausedPlacement = usePausedScenePlacement<HTMLSpanElement>(
    toSceneRelativeStyle({ placement, renderSize, sceneSize: officeLayout.scene }),
    isPaused,
    transitionDurationMs,
  );

  if (actor.pose === 'atDesk') return null;

  return (
    <span
      aria-hidden="true"
      className="office-sprite office-sprite--moving-avatar"
      data-story-actor={actor.id}
      data-testid={`moving-avatar-${actor.id}`}
      ref={pausedPlacement.ref}
      style={pausedPlacement.style}
    >
      <img alt="" className="office-sprite__image" draggable={false} src={toPublicAssetPath(asset.path)} />
    </span>
  );
}
