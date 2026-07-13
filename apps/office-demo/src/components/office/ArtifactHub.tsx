import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import { hubArtifactCounts } from '../../data/demoScenario';
import type { Selection } from '../../types/selection';
import { calculateScenePlacement, toSceneRelativeStyle } from '../../utils/scenePlacement';

type ArtifactHubProps = {
  onSelect: (selection: Selection) => void;
};

export function ArtifactHub({ onSelect }: ArtifactHubProps) {
  const asset = officeLayout.assetAnchors.furniture.artifactHub;
  const position = calculateScenePlacement({
    sceneAnchor: officeLayout.artifactHub.hubAnchor,
    sourceAnchor: asset.visualBottomCenterSource,
    renderSize: asset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });

  return (
    <button
      aria-label="Open Artifact Hub overview"
      className="artifact-hub office-object-button"
      data-testid="artifact-hub"
      onClick={() => onSelect({ kind: 'hub' })}
      style={toSceneRelativeStyle({
        placement: position,
        renderSize: asset.recommendedRenderSize,
        sceneSize: officeLayout.scene,
      })}
      type="button"
    >
      <img alt="" aria-hidden="true" className="office-sprite__image" draggable={false} src={toPublicAssetPath(asset.path)} />
      <div aria-hidden="true" className="artifact-hub__metrics">
        {hubArtifactCounts.map(({ category, count, label }) => <span key={category}>{`${label.slice(0, -1)} ${count}`}</span>)}
      </div>
    </button>
  );
}
