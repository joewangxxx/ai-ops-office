import { officeLayout, officeScenePath } from '../../data/officeLayout';
import { AgentOrb } from './AgentOrb';
import { ArtifactHub } from './ArtifactHub';
import { AvatarSprite } from './AvatarSprite';
import { DeskStation } from './DeskStation';
import { NameTag } from './NameTag';
import type { Selection } from '../../types/selection';
import { sceneRectToRelativeStyle } from '../../utils/scenePlacement';

type OfficeSceneProps = {
  onSelectionChange: (selection: Selection) => void;
};

export function OfficeScene({ onSelectionChange }: OfficeSceneProps) {
  const { height, width } = officeLayout.scene;

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
        <button
          aria-label="Show Office Summary"
          className="office-scene__reset-target"
          onClick={() => onSelectionChange({ kind: 'office' })}
          type="button"
        />
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
        <div className="office-scene__layer office-scene__layer--avatars">
          {officeLayout.desks.map((desk) => <AvatarSprite desk={desk} key={desk.id} />)}
        </div>
        <div className="office-scene__layer office-scene__layer--furniture">
          {officeLayout.desks.map((desk) => <DeskStation desk={desk} key={desk.id} onSelect={onSelectionChange} />)}
          <ArtifactHub onSelect={onSelectionChange} />
        </div>
        <div className="office-scene__layer office-scene__layer--labels">
          {officeLayout.desks.map((desk) => <NameTag desk={desk} key={desk.id} />)}
          {officeLayout.desks.map((desk) => <AgentOrb desk={desk} key={desk.id} />)}
        </div>
      </div>
    </section>
  );
}
