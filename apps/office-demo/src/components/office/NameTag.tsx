import { officeLayout } from '../../data/officeLayout';
import { scenePointToRelativeStyle } from '../../utils/scenePlacement';
import { contrastTextForBackground } from '../../utils/colorContrast';

type NameTagProps = {
  desk: (typeof officeLayout.desks)[number];
};

export function NameTag({ desk }: NameTagProps) {
  const backgroundColor = desk.online ? desk.occupant.nameTagColor : 'var(--offline-tag-background)';

  return (
    <span
      className={`office-name-tag${desk.online ? '' : ' office-name-tag--offline'}`}
      data-testid={`name-tag-${desk.id}`}
      style={{
        backgroundColor,
        color: desk.online ? contrastTextForBackground(desk.occupant.nameTagColor) : 'var(--offline-tag-text)',
        ...scenePointToRelativeStyle(desk.nameTagAnchor, officeLayout.scene),
      }}
    >
      {desk.occupant.displayName}
    </span>
  );
}
