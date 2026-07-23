import { officeLayout, toPublicAssetPath } from '../../data/officeLayout';
import { hubArtifactCounts, type HubArtifactCount } from '../../data/demoScenario';
import type { Selection } from '../../types/selection';
import { calculateScenePlacement, sourceRectToAssetRelativeStyle, toSceneRelativeStyle } from '../../utils/scenePlacement';

type ArtifactHubProps = {
  onSelect: (selection: Selection) => void;
  counts?: readonly HubArtifactCount[];
};

export function ArtifactHub({ counts = hubArtifactCounts, onSelect }: ArtifactHubProps) {
  const asset = officeLayout.assetAnchors.furniture.artifactHub;
  const position = calculateScenePlacement({
    sceneAnchor: officeLayout.artifactHub.hubAnchor,
    sourceAnchor: asset.visualBottomCenterSource,
    renderSize: asset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });
  const screenStyle = sourceRectToAssetRelativeStyle(asset.screenRectSource!, officeLayout.assetAnchors.sourceCanvas);

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
      <div aria-hidden="true" className="artifact-hub__metrics" data-count-column="2ch" data-testid="artifact-hub-screen" style={{ ...screenStyle, overflow: 'hidden' }}>
        {counts.map(({ category, count, label }) => (
          <span className="artifact-hub__metric" key={category}>
            <span className="artifact-hub__metric-label">{label.slice(0, -1)}</span>
            <strong className="artifact-hub__metric-count">{count}</strong>
          </span>
        ))}
      </div>
    </button>
  );
}
