import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

describe('Task 6 playback UI', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('freezes an in-flight actor waypoint on Pause and resumes without returning to the route start', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Next story state' }));
    const actor = screen.getByTestId('moving-avatar-alice');
    const initialLeft = actor.style.left;
    const initialTop = actor.style.top;

    fireEvent.click(screen.getByRole('button', { name: 'Pause demo' }));
    act(() => vi.advanceTimersByTime(1200));

    expect(screen.getByTestId('playback-status')).toHaveTextContent('paused');
    expect(screen.getByTestId('story-state')).toHaveTextContent('pm-delivering');
    expect(actor).toHaveStyle({ transitionDuration: '0ms' });
    expect(actor.style.left).toBe(initialLeft);
    expect(actor.style.top).toBe(initialTop);

    fireEvent.click(screen.getByRole('button', { name: 'Play demo' }));
    act(() => vi.advanceTimersByTime(340));

    expect(screen.getByTestId('playback-status')).toHaveTextContent('playing');
    expect(actor.style.left === initialLeft && actor.style.top === initialTop).toBe(false);
  });
});
