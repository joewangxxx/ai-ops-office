import { officeLayout, officeScenePath, type ScenePoint } from '../../data/officeLayout';
import type { StoryActor, StoryFrame } from '../../story/prdHandoffStory';
import type { Selection } from '../../types/selection';
import { sceneRectToRelativeStyle } from '../../utils/scenePlacement';
import { AgentOrb } from './AgentOrb';
import { ArtifactHub } from './ArtifactHub';
import { AvatarSprite } from './AvatarSprite';
import { DeskStation } from './DeskStation';
import { NameTag } from './NameTag';
import { StoryActorSprite } from './StoryActorSprite';
import { StoryArtifact } from './StoryArtifact';
import { StorySignals } from './StorySignals';

type OfficeSceneProps = {
  onSelectionChange: (selection: Selection) => void;
  story: StoryFrame;
  prefersReducedMotion: boolean;
};

function offsetFromDesk(point: ScenePoint, desk: (typeof officeLayout.desks)[number], source: ScenePoint) {
  return {
    x: point.x + source.x - desk.avatarAnchor.x,
    y: point.y + source.y - desk.avatarAnchor.y,
  };
}

function actorForDesk(actors: readonly StoryActor[], deskId: string) {
  return actors.find((actor) => actor.deskId === deskId);
}

export function OfficeScene({ onSelectionChange, prefersReducedMotion, story }: OfficeSceneProps) {
  const { height, width } = officeLayout.scene;
  const transitionDurationMs = prefersReducedMotion ? 0 : story.motion?.transitionDurationMs ?? 0;
  const isMotionPaused = story.playbackStatus === 'paused';

  return (
    <section
      aria-label="Office scene"
      className="office-scene"
      data-logical-height={height}
      data-logical-width={width}
      data-testid="office-scene"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div className="office-scene__canvas" style={{ height: '100%', width: '100%' }}>
        <img alt="Office scene" className="office-scene__background" draggable={false} src={officeScenePath} />
        <button aria-label="Show Office Summary" className="office-scene__reset-target" onClick={() => onSelectionChange({ kind: 'office' })} type="button" />
        <div aria-label="Workspace selection areas" className="office-scene__workspace-targets">
          {officeLayout.workspaces.map((workspace) => (
            <button
              aria-label={`Open ${workspace.name} overview`}
              className="office-workspace-target"
              key={workspace.id}
              onClick={() => onSelectionChange({ kind: 'workspace', workspaceId: workspace.id })}
              style={sceneRectToRelativeStyle(workspace.bounds, officeLayout.scene)}
              type="button"
            />
          ))}
        </div>
        <div className="office-scene__layer office-scene__layer--chairs">
          {officeLayout.desks.map((desk) => <DeskStation desk={desk} key={desk.id} layer="chairBack" onSelect={onSelectionChange} />)}
        </div>
        <div className="office-scene__layer office-scene__layer--avatars">
          {officeLayout.desks.map((desk) => {
            const actor = actorForDesk(story.actors, desk.id);
            return <AvatarSprite desk={desk} key={desk.id} onSelect={onSelectionChange} visible={actor?.pose === 'atDesk' || !actor} />;
          })}
          {story.actors.map((actor) => <StoryActorSprite actor={actor} isPaused={isMotionPaused} key={actor.id} position={actor.coordinate} transitionDurationMs={transitionDurationMs} />)}
        </div>
        <div className="office-scene__layer office-scene__layer--furniture">
          {officeLayout.desks.map((desk) => <DeskStation desk={desk} key={desk.id} layer="front" onSelect={onSelectionChange} />)}
          <ArtifactHub counts={story.hub.counts} onSelect={onSelectionChange} />
        </div>
        <div className="office-scene__layer office-scene__layer--story-artifact"><StoryArtifact artifacts={story.artifacts} isPaused={isMotionPaused} transitionDurationMs={transitionDurationMs} /></div>
        <div className="office-scene__layer office-scene__layer--labels">
          {officeLayout.desks.map((desk) => {
            const actor = actorForDesk(story.actors, desk.id);
            const moving = actor?.pose !== 'atDesk';
            const nameAnchor = moving && actor ? offsetFromDesk(actor.coordinate, desk, desk.nameTagAnchor) : undefined;
            return <NameTag anchor={nameAnchor} desk={desk} isPaused={moving && isMotionPaused} key={desk.id} transitionDurationMs={moving ? transitionDurationMs : 0} />;
          })}
          {officeLayout.desks.map((desk) => {
            const actor = actorForDesk(story.actors, desk.id);
            const moving = actor?.pose !== 'atDesk';
            const orbAnchor = moving && actor ? offsetFromDesk(actor.coordinate, desk, desk.orbAnchor) : undefined;
            return <AgentOrb anchor={orbAnchor} desk={desk} isPaused={moving && isMotionPaused} key={desk.id} state={actor ? story.orbs[actor.id] : 'gray'} transitionDurationMs={moving ? transitionDurationMs : 0} />;
          })}
          <StorySignals signals={story.signals} />
        </div>
      </div>
    </section>
  );
}
