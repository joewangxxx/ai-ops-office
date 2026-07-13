import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import {
  getStoryFrame,
  nextStoryState,
  previousStoryState,
  prdHandoffStateOrder,
} from '../src/story/prdHandoffStory';

describe('Task 5 PRD handoff story compatibility', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    })));
  });

  it('preserves the PM to Dev states before the new Dev to QA sequence', () => {
    expect(prdHandoffStateOrder.slice(0, 9)).toEqual([
      'ready',
      'pm-delivering',
      'prd-stored',
      'pm-returning',
      'dev-notified',
      'dev-collecting',
      'dev-returning',
      'dev-received',
      'dev-coding',
    ]);
    expect(nextStoryState('ready')).toBe('pm-delivering');
    expect(nextStoryState('dev-coding')).toBe('feature-ready');
    expect(previousStoryState('dev-received')).toBe('dev-returning');
    expect(previousStoryState('ready')).toBe('ready');
  });

  it('projects the PRD across Alice, Hub, Jack, and Jack desk while Hub count changes only after storage', () => {
    const prdAt = (state: (typeof prdHandoffStateOrder)[number]) => getStoryFrame(state).artifacts.find((artifact) => artifact.id === 'login-requirement-prd-v1')!;

    expect(prdAt('ready')).toMatchObject({ location: 'desk', deskId: 'pm-alice' });
    expect(prdAt('pm-delivering')).toMatchObject({ location: 'carrier', carrierId: 'alice' });
    expect(prdAt('prd-stored')).toMatchObject({ location: 'hub' });
    expect(prdAt('dev-collecting')).toMatchObject({ location: 'hub' });
    expect(prdAt('dev-returning')).toMatchObject({ location: 'carrier', carrierId: 'jack' });
    expect(prdAt('dev-received')).toMatchObject({ location: 'desk', deskId: 'dev-jack' });

    expect(getStoryFrame('ready').hub.prdCount).toBe(1);
    expect(getStoryFrame('pm-delivering').hub.prdCount).toBe(1);
    expect(getStoryFrame('prd-stored').hub.prdCount).toBe(2);
    expect(getStoryFrame('dev-coding').hub.prdCount).toBe(2);
  });

  it('keeps the PRD notification and Coding status label limited to their named states', () => {
    for (const state of prdHandoffStateOrder) {
      const signals = getStoryFrame(state).signals;
      expect(signals.some((signal) => signal.kind === 'receiptBubble' && signal.text === '收到 PRD')).toBe(state === 'dev-notified');
      expect(signals.some((signal) => signal.kind === 'statusLabel' && signal.text === 'Coding...')).toBe(state === 'dev-coding');
    }
  });

  it('replaces Alice’s static seated sprite while she is moving and replays to the initial Hub data', () => {
    render(<App />);

    expect(screen.getByTestId('avatar-pm-alice')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next story state' }));
    expect(screen.queryByTestId('avatar-pm-alice')).not.toBeInTheDocument();
    expect(screen.getByTestId('moving-avatar-alice')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-story-actor="alice"]')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Replay story' }));
    expect(screen.getByTestId('story-state')).toHaveTextContent('ready');
    expect(screen.getByTestId('playback-status')).toHaveTextContent('idle');
    expect(screen.getByTestId('artifact-hub-screen')).toHaveTextContent('PRD1');
    fireEvent.click(screen.getByRole('button', { name: 'Next story state' }));
    expect(screen.getByTestId('story-state')).toHaveTextContent('pm-delivering');
  });

  it('uses a zero-duration movement transition when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn(),
    })));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Next story state' }));

    expect(screen.getByTestId('moving-avatar-alice')).toHaveStyle({ transitionDuration: '0ms' });
  });
});
