import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';
import { officeLayout } from '../src/data/officeLayout';
import { resolveSeatedPose } from '../src/utils/avatarPresentation';

describe('static office map', () => {
  it('renders the complete initial office state from the layout data', () => {
    render(<App />);

    expect(screen.getByTestId('office-scene').querySelector('.office-scene__canvas')).toHaveStyle({
      height: '100%',
      width: '100%',
    });
    expect(screen.getAllByTestId('desk-station')).toHaveLength(10);
    expect(document.querySelectorAll('.office-sprite--avatar')).toHaveLength(7);
    expect(document.querySelectorAll('.office-sprite--orb')).toHaveLength(7);
    expect(document.querySelectorAll('.office-name-tag')).toHaveLength(10);
    expect(screen.getByTestId('desk-foreground-dev-jack').closest('button')).toBeNull();
    expect(screen.getByTestId('desk-foreground-dev-mia').closest('button')).toHaveAttribute('aria-label', 'Open Mia offline desk detail');

    for (const desk of officeLayout.desks.filter((item) => !item.online)) {
      expect(screen.queryByTestId(`avatar-${desk.id}`)).not.toBeInTheDocument();
      expect(screen.queryByTestId(`orb-${desk.id}`)).not.toBeInTheDocument();
      expect(screen.getByTestId(`name-tag-${desk.id}`)).toHaveTextContent(desk.occupant.displayName);
    }

    const hub = screen.getByTestId('artifact-hub');
    expect(screen.getAllByTestId('artifact-hub')).toHaveLength(1);
    expect(within(hub).getByText('PRD').parentElement).toHaveTextContent('PRD1');
    expect(within(hub).getByText('Feature')).toBeInTheDocument();
    expect(within(hub).getByText('Report')).toBeInTheDocument();
    expect(within(hub).getByText('2')).toBeInTheDocument();

    const renderedSources = Array.from(document.querySelectorAll('img')).map((image) => image.getAttribute('src'));
    expect(renderedSources).toContain(`/${officeLayout.assetAnchors.furniture.deskBack.path.replace(/^images\//, '')}`);
    expect(renderedSources).toContain(`/${officeLayout.assetAnchors.furniture.deskChairBack.path.replace(/^images\//, '')}`);
    expect(renderedSources).toContain(`/${officeLayout.assetAnchors.furniture.deskForeground.path.replace(/^images\//, '')}`);
    expect(renderedSources).toContain(`/${officeLayout.assetAnchors.furniture.artifactHub.path.replace(/^images\//, '')}`);
    expect(renderedSources).toContain(`/${officeLayout.assetAnchors.orbs.gray.path.replace(/^images\//, '')}`);

    for (const desk of officeLayout.desks.filter((item) => item.online)) {
      const pose = resolveSeatedPose();
      const avatar = officeLayout.assetAnchors.avatars.byActor[desk.occupant.avatarKey!][pose];
      expect(renderedSources).toContain(`/${avatar.path.replace(/^images\//, '')}`);
      expect(screen.getByTestId(`avatar-${desk.id}`)).toHaveAttribute('data-avatar-pose', pose);
    }
    expect(renderedSources.some((source) => source?.endsWith('/at-desk.png'))).toBe(false);
  });
});
