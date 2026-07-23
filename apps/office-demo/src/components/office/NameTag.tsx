import { officeLayout, type ScenePoint } from '../../data/officeLayout';
import { scenePointToRelativeStyle } from '../../utils/scenePlacement';
import { contrastTextForBackground } from '../../utils/colorContrast';

type NameTagProps = {
  desk: (typeof officeLayout.desks)[number];
  anchor?: ScenePoint;
  transitionDurationMs?: number;
};

export function NameTag({ anchor, desk, transitionDurationMs = 0 }: NameTagProps) {
  const backgroundColor = desk.online ? desk.occupant.nameTagColor : 'var(--offline-tag-background)';

  return (
    <span
      className={`office-name-tag${desk.online ? '' : ' office-name-tag--offline'}${transitionDurationMs > 0 ? ' office-name-tag--moving' : ''}`}
      data-testid={`name-tag-${desk.id}`}
      style={{
        backgroundColor,
        color: desk.online ? contrastTextForBackground(desk.occupant.nameTagColor) : 'var(--offline-tag-text)',
        ...scenePointToRelativeStyle(anchor ?? desk.nameTagAnchor, officeLayout.scene),
        transitionDuration: `${transitionDurationMs}ms`,
      }}
    >
      {desk.occupant.displayName}
    </span>
  );
}
