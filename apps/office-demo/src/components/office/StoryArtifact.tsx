import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import type { StoryArtifact as StoryArtifactData } from '../../story/prdHandoffStory';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';
import { usePausedScenePlacement } from '../../hooks/usePausedScenePlacement';

type StoryArtifactProps = {
  artifacts: readonly StoryArtifactData[];
  transitionDurationMs: number;
  isPaused: boolean;
};

function StoryArtifactSprite({ artifact, isPaused, transitionDurationMs }: { artifact: StoryArtifactData; isPaused: boolean; transitionDurationMs: number }) {
  const asset = officeLayout.assetAnchors.artifacts[artifact.assetKey];
  const placement = calculateScenePlacement({
    sceneAnchor: artifact.anchor,
    sourceAnchor: asset.visualBottomCenterSource,
    renderSize: asset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });
  const pausedPlacement = usePausedScenePlacement<HTMLImageElement>(
    toSceneRelativeStyle({ placement, renderSize: asset.recommendedRenderSize, sceneSize: officeLayout.scene }),
    isPaused,
    transitionDurationMs,
  );

  return (
    <img
      alt=""
      aria-hidden="true"
      className="office-sprite office-sprite--story-artifact"
      data-story-artifact-location={artifact.location}
      data-testid={`story-artifact-${artifact.id}`}
      draggable={false}
      ref={pausedPlacement.ref}
      src={toPublicAssetPath(asset.path)}
      style={pausedPlacement.style}
    />
  );
}

export function StoryArtifact({ artifacts, isPaused, transitionDurationMs }: StoryArtifactProps) {
  return artifacts.map((artifact) => <StoryArtifactSprite artifact={artifact} isPaused={isPaused} key={artifact.id} transitionDurationMs={transitionDurationMs} />);
}
