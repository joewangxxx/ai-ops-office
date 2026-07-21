import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyOfficeEvent, createOfficeState, toOfficeSnapshot, type OfficeEvent } from '../src/backend/officeDomain';
import { InspectorContent } from '../src/components/inspector/InspectorContent';
import { OfficeScene } from '../src/components/office/OfficeScene';
import { getHubArtifactCounts } from '../src/data/demoScenario';
import { officeLayout } from '../src/data/officeLayout';
import { useOfficeBackend } from '../src/hooks/useOfficeBackend';
import { useOfficeMotionRunner } from '../src/hooks/useOfficeMotionRunner';
import { calculateScenePlacement, toSceneRelativeStyle } from '../src/utils/scenePlacement';

const completion = {
  type: 'artifact.completed' as const,
  artifact: { id: 'search-prd-v1', category: 'prd' as const, title: 'Search PRD v1.0' },
  producerDeskId: 'pm-alice',
  assigneeDeskId: 'dev-jack',
};

const jsonResponse = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body }) as Response;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Task 7 backend snapshot hook', () => {
  it('polls every 500ms and refreshes immediately after posting an event', async () => {
    vi.useFakeTimers();
    const initial = toOfficeSnapshot(createOfficeState());
    const afterEvent = toOfficeSnapshot(applyOfficeEvent(createOfficeState(), completion));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(initial))
      .mockResolvedValueOnce(jsonResponse(initial))
      .mockResolvedValueOnce(jsonResponse(afterEvent));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useOfficeBackend());
    await act(async () => { await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/office-state', expect.objectContaining({ signal: expect.any(AbortSignal) }));

    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => { await result.current.postEvent(completion); });
    expect(fetchMock).toHaveBeenLastCalledWith('/api/office-events', expect.objectContaining({ method: 'POST' }));
    expect(result.current.snapshot.revision).toBe(1);
  });
});

describe('Task 7 motion runner', () => {
  it('advances all waypoints and reports completion exactly once', async () => {
    vi.useFakeTimers();
    const state = applyOfficeEvent(createOfficeState(), completion);
    const postEvent = vi.fn(async (_event: OfficeEvent) => state);
    const { result } = renderHook(() => useOfficeMotionRunner(state.activeMotion, postEvent, false));

    expect(result.current).toMatchObject({ deskId: 'pm-alice', pose: 'carry', direction: 'up' });
    await act(async () => { await vi.advanceTimersByTimeAsync(16); });
    await act(async () => { await vi.advanceTimersByTimeAsync(340); });
    await act(async () => { await vi.advanceTimersByTimeAsync(340); });
    await act(async () => { await vi.advanceTimersByTimeAsync(340); });

    expect(postEvent).toHaveBeenCalledTimes(1);
    expect(postEvent).toHaveBeenCalledWith({ type: 'motion.completed', motionId: state.activeMotion!.id });
  });

  it('does not restart a waypoint deadline when polling returns the same motion', async () => {
    vi.useFakeTimers();
    const state = applyOfficeEvent(createOfficeState(), completion);
    const postEvent = vi.fn(async (_event: OfficeEvent) => state);
    const { result, rerender } = renderHook(
      ({ motion }) => useOfficeMotionRunner(motion, postEvent, false),
      { initialProps: { motion: state.activeMotion } },
    );

    await act(async () => { await vi.advanceTimersByTimeAsync(16); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    rerender({ motion: structuredClone(state.activeMotion) });
    await act(async () => { await vi.advanceTimersByTimeAsync(240); });

    expect(result.current?.coordinate).toEqual(state.activeMotion!.waypoints[2]);
  });
});

describe('Task 7 Inspector acceptance', () => {
  it('shows Accept only for the assigned employee and disables it while pending', async () => {
    let state = applyOfficeEvent(createOfficeState(), completion);
    state = applyOfficeEvent(state, { type: 'motion.completed', motionId: state.activeMotion!.id });
    const onAccept = vi.fn(async () => undefined);
    const hubCounts = getHubArtifactCounts({ prd: state.scenario.hubArtifactIds.prd.length, feature: 2, report: 1 });

    const { rerender } = render(
      <InspectorContent
        hubCounts={hubCounts}
        notifications={state.notifications}
        onAccept={onAccept}
        onSelectionChange={vi.fn()}
        pendingArtifactId={null}
        scenario={state.scenario}
        selection={{ kind: 'avatar', deskId: 'dev-jack' }}
      />,
    );

    const button = screen.getByRole('button', { name: 'Accept Search PRD v1.0' });
    fireEvent.click(button);
    await waitFor(() => expect(onAccept).toHaveBeenCalledWith('search-prd-v1', 'dev-jack'));

    rerender(
      <InspectorContent
        hubCounts={hubCounts}
        notifications={state.notifications}
        onAccept={onAccept}
        onSelectionChange={vi.fn()}
        pendingArtifactId="search-prd-v1"
        scenario={state.scenario}
        selection={{ kind: 'avatar', deskId: 'dev-jack' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Accept Search PRD v1.0' })).toBeDisabled();
  });

  it('handles a rejected Accept request without an unhandled promise', async () => {
    let state = applyOfficeEvent(createOfficeState(), completion);
    state = applyOfficeEvent(state, { type: 'motion.completed', motionId: state.activeMotion!.id });
    const onAccept = vi.fn(async () => { throw new Error('Office API is unavailable'); });

    render(
      <InspectorContent
        hubCounts={getHubArtifactCounts({ prd: 1, feature: 2, report: 1 })}
        notifications={state.notifications}
        onAccept={onAccept}
        onSelectionChange={vi.fn()}
        scenario={state.scenario}
        selection={{ kind: 'avatar', deskId: 'dev-jack' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accept Search PRD v1.0' }));
    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
  });
});

describe('Task 7 real office scene projection', () => {
  it('renders the active directional pose and keeps its independent foot anchor stable', () => {
    const state = applyOfficeEvent(createOfficeState(), completion);
    const coordinate = state.activeMotion!.waypoints[1]!;
    const asset = officeLayout.assetAnchors.avatars.byActor.Alice.carryUp;
    const renderSize = officeLayout.assetAnchors.avatars.movementRecommendedRenderSize;
    const placement = calculateScenePlacement({
      sceneAnchor: coordinate,
      sourceAnchor: asset.visualFootShadowCenterSource,
      renderSize,
      sourceCanvas: officeLayout.assetAnchors.sourceCanvas,
    });

    render(
      <OfficeScene
        motion={{
          motionId: state.activeMotion!.id,
          deskId: 'pm-alice',
          pose: 'carry',
          coordinate,
          direction: 'up',
          transitionDurationMs: 340,
        }}
        onSelectionChange={vi.fn()}
        snapshot={toOfficeSnapshot(state)}
      />,
    );

    const moving = screen.getByTestId('moving-avatar-alice');
    expect(moving.querySelector('img')).toHaveAttribute('src', '/avatars/Alice/carry-up.png');
    expect(moving).toHaveStyle(toSceneRelativeStyle({ placement, renderSize, sceneSize: officeLayout.scene }));
    expect(moving.style.transform).toBe('');
    expect(screen.queryByTestId('avatar-pm-alice')).not.toBeInTheDocument();
    expect(screen.getByTestId('avatar-dev-jack')).toHaveAttribute('data-avatar-pose', 'seatedWorkingBack');
    expect(screen.getByTestId('runtime-artifact-search-prd-v1')).toHaveAttribute('data-artifact-location', 'carrier');
  });
});
