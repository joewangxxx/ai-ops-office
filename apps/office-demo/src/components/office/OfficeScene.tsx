import type { OfficeSnapshot } from '../../backend/officeDomain';
import { getHubArtifactCounts } from '../../data/demoScenario';
import { officeLayout, officeScenePath } from '../../data/officeLayout';
import type { MotionPresentation } from '../../hooks/useOfficeMotionRunner';
import type { Selection } from '../../types/selection';
import { resolveMovementPose, resolveSeatedPose } from '../../utils/avatarPresentation';
import { calculateMovingAvatarPresentation, calculateOfflineNameTagAnchor, calculateRenderedVisualBounds, calculateSeatedAvatarPresentation } from '../../utils/avatarVisualBounds';
import { calculateScenePlacement, sceneRectToRelativeStyle } from '../../utils/scenePlacement';
import { AgentOrb } from './AgentOrb';
import { ArtifactHub } from './ArtifactHub';
import { AvatarSprite } from './AvatarSprite';
import { DeskStation } from './DeskStation';
import { NameTag } from './NameTag';
import { RuntimeActorSprite } from './RuntimeActorSprite';
import { RuntimeArtifactSprite } from './RuntimeArtifactSprite';

type OfficeSceneProps = {
  motion: MotionPresentation | null;
  onSelectionChange: (selection: Selection) => void;
  snapshot: OfficeSnapshot;
};

function decorationAnchorsForDesk(desk: (typeof officeLayout.desks)[number], motion: MotionPresentation | null) {
  const orbAsset = officeLayout.assetAnchors.orbs.gray;
  if (motion?.deskId === desk.id && desk.occupant.avatarKey) {
    const pose = resolveMovementPose(motion.pose, motion.direction);
    const asset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey][pose];
    return calculateMovingAvatarPresentation({
      sceneAnchor: motion.coordinate,
      asset,
      orbAsset,
      orbRenderSize: orbAsset.recommendedRenderSize,
      renderSize: officeLayout.assetAnchors.avatars.movementRecommendedRenderSize,
      sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
    }).decorationAnchors;
  }
  if (!desk.online || !desk.occupant.avatarKey) {
    return { nameTag: calculateOfflineNameTagAnchor(desk.deskAnchor), orb: desk.orbAnchor };
  }
  const pose = resolveSeatedPose();
  const asset = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey][pose];
  const deskBack = officeLayout.assetAnchors.furniture.deskBack;
  const deskBackPlacement = calculateScenePlacement({
    sceneAnchor: desk.deskAnchor,
    sourceAnchor: deskBack.visualBottomCenterSource,
    renderSize: deskBack.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  });
  const avoidanceBounds = (deskBack.decorationAvoidanceRectsSource ?? []).map((rect) => calculateRenderedVisualBounds(
    deskBackPlacement,
    rect,
    deskBack.recommendedRenderSize,
    officeLayout.assetAnchors.sourceCanvas,
  ));
  return calculateSeatedAvatarPresentation({
    avatarAnchor: desk.seatedBackAnchor,
    avatarAsset: asset,
    avatarRenderSize: officeLayout.assetAnchors.avatars.seatedRecommendedRenderSize,
    chairAsset: officeLayout.assetAnchors.furniture.deskChairBack,
    chairAnchor: desk.chairBackAnchor,
    chairRenderSize: officeLayout.assetAnchors.furniture.deskChairBack.recommendedRenderSize,
    avoidanceBounds,
    orbAsset,
    orbRenderSize: orbAsset.recommendedRenderSize,
    sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
  }).decorationAnchors;
}

export function OfficeScene({ motion, onSelectionChange, snapshot }: OfficeSceneProps) {
  const { height, width } = officeLayout.scene;
  const counts = getHubArtifactCounts({
    prd: snapshot.scenario.hubArtifactIds.prd.length,
    feature: snapshot.scenario.hubArtifactIds.feature.length,
    report: snapshot.scenario.hubArtifactIds.report.length,
  });
  const movingDesk = motion ? officeLayout.desks.find((desk) => desk.id === motion.deskId) : undefined;

  return (
    <section aria-label="Office scene" className="office-scene" data-logical-height={height} data-logical-width={width} data-testid="office-scene" style={{ aspectRatio: `${width} / ${height}` }}>
      <div className="office-scene__canvas" style={{ height: '100%', width: '100%' }}>
        <img alt="Office scene" className="office-scene__background" draggable={false} src={officeScenePath} />
        <button aria-label="Show Office Summary" className="office-scene__reset-target" onClick={() => onSelectionChange({ kind: 'office' })} type="button" />
        <div aria-label="Workspace selection areas" className="office-scene__workspace-targets">
          {officeLayout.workspaces.map((workspace) => <button aria-label={`Open ${workspace.name} overview`} className="office-workspace-target" key={workspace.id} onClick={() => onSelectionChange({ kind: 'workspace', workspaceId: workspace.id })} style={sceneRectToRelativeStyle(workspace.bounds, officeLayout.scene)} type="button" />)}
        </div>
        <div className="office-scene__layer office-scene__layer--desk-backs">
          {officeLayout.desks.map((desk) => <DeskStation desk={desk} key={desk.id} layer="deskBack" onSelect={onSelectionChange} />)}
        </div>
        <div className="office-scene__layer office-scene__layer--chairs">
          {officeLayout.desks.map((desk) => <DeskStation desk={desk} key={desk.id} layer="chairBack" onSelect={onSelectionChange} />)}
        </div>
        <div className="office-scene__layer office-scene__layer--avatars">
          {officeLayout.desks.map((desk) => <AvatarSprite desk={desk} key={desk.id} onSelect={onSelectionChange} visible={desk.id !== motion?.deskId} />)}
          {motion && movingDesk ? <RuntimeActorSprite actor={{ id: movingDesk.occupant.id, deskId: motion.deskId, pose: motion.pose, direction: motion.direction }} position={motion.coordinate} transitionDurationMs={motion.transitionDurationMs} /> : null}
        </div>
        <div className="office-scene__layer office-scene__layer--furniture">
          {officeLayout.desks.map((desk) => <DeskStation desk={desk} key={desk.id} layer="deskForeground" onSelect={onSelectionChange} />)}
          <ArtifactHub counts={counts} onSelect={onSelectionChange} />
        </div>
        <div className="office-scene__layer office-scene__layer--runtime-artifact"><RuntimeArtifactSprite motion={motion} snapshot={snapshot} /></div>
        <div className="office-scene__layer office-scene__layer--labels">
          {officeLayout.desks.map((desk) => {
            const moving = motion?.deskId === desk.id;
            const anchors = decorationAnchorsForDesk(desk, moving ? motion : null);
            return <NameTag anchor={anchors.nameTag} desk={desk} key={desk.id} transitionDurationMs={moving ? motion.transitionDurationMs : 0} />;
          })}
          {officeLayout.desks.map((desk) => {
            const moving = motion?.deskId === desk.id;
            const anchors = decorationAnchorsForDesk(desk, moving ? motion : null);
            return <AgentOrb anchor={anchors.orb} desk={desk} key={desk.id} state="gray" transitionDurationMs={moving ? motion.transitionDurationMs : 0} />;
          })}
        </div>
      </div>
    </section>
  );
}
