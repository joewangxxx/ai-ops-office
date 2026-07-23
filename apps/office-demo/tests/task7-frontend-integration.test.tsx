import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MotionCompletedSignal } from '../src/backend/businessEvents';
import { applyBusinessEvent, createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { InspectorContent } from '../src/components/inspector/InspectorContent';
import { OfficeScene } from '../src/components/office/OfficeScene';
import { getHubArtifactCounts } from '../src/data/demoScenario';
import { officeLayout } from '../src/data/officeLayout';
import { useOfficeBackend } from '../src/hooks/useOfficeBackend';
import { useOfficeMotionRunner } from '../src/hooks/useOfficeMotionRunner';
import { calculateScenePlacement, toSceneRelativeStyle } from '../src/utils/scenePlacement';
import { acceptArtifact, completeActiveMotion } from './helpers/officeEventTestUtils';

const submission = {
  eventId: 'task7-submission',
  eventType: 'artifact.submitted' as const,
  schemaVersion: '1.0' as const,
  occurredAt: '2026-07-22T06:00:00.000Z',
  correlationId: 'task7-submission',
  source: { system: 'task7-test', actorId: 'pm-alice' },
  payload: {
    artifact: { id: 'search-prd-v1', category: 'prd' as const, title: 'Search PRD v1.0', evidence: { kind: 'prd' as const, summary: 'Defines search.', priority: 'P1' as const, scope: ['Search'], userStories: [{ id: 'US-1', statement: 'A user can search.' }], acceptanceCriteria: ['Relevant results appear.'] } },
    producerDeskId: 'pm-alice',
    assigneeDeskId: 'dev-jack',
  },
};

const jsonResponse = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body }) as Response;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Task 7 backend snapshot hook', () => {
  it('uses the 5s fallback poll interval and refreshes immediately after posting an event', async () => {
    vi.useFakeTimers();
    const initial = toOfficeSnapshot(createOfficeState());
    const afterEvent = toOfficeSnapshot(applyBusinessEvent(createOfficeState(), submission));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(initial))
      .mockResolvedValueOnce(jsonResponse(initial))
      .mockResolvedValueOnce(jsonResponse({ status: 'accepted', eventId: submission.eventId, revision: afterEvent.revision, snapshot: afterEvent }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useOfficeBackend());
    await act(async () => { await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/office-state', expect.objectContaining({ signal: expect.any(AbortSignal) }));

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => { await result.current.postBusinessEvent(submission); });
    expect(fetchMock).toHaveBeenLastCalledWith('/api/business-events', expect.objectContaining({ method: 'POST' }));
    expect(result.current.snapshot.revision).toBe(1);
  });

  it('keeps a newer POST snapshot when an older poll resolves afterward', async () => {
    const initial = toOfficeSnapshot(createOfficeState());
    const afterEvent = toOfficeSnapshot(applyBusinessEvent(createOfficeState(), submission));
    const oldPoll = deferred<Response>();
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => oldPoll.promise)
      .mockResolvedValueOnce(jsonResponse({ status: 'accepted', eventId: submission.eventId, revision: afterEvent.revision, snapshot: afterEvent }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useOfficeBackend());
    await act(async () => { await result.current.postBusinessEvent(submission); });
    expect(result.current.snapshot.revision).toBe(1);

    await act(async () => { oldPoll.resolve(jsonResponse(initial)); await Promise.resolve(); });
    expect(result.current.snapshot.revision).toBe(1);
  });

  it('accepts a later snapshot from a new reset epoch even though its revision returns to zero', async () => {
    const afterEvent = toOfficeSnapshot(applyBusinessEvent(createOfficeState(), submission));
    const reset = toOfficeSnapshot(createOfficeState(1));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(afterEvent))
      .mockResolvedValueOnce(jsonResponse(reset));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useOfficeBackend());
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await result.current.refresh(); });

    expect(result.current.snapshot).toMatchObject({ epoch: 1, revision: 0, activeMotion: null });
  });

  it('tracks overlapping accepts independently', async () => {
    const initial = toOfficeSnapshot(createOfficeState());
    const first = deferred<Response>();
    const second = deferred<Response>();
    const acceptedResponse = { status: 'accepted', eventId: 'accepted', revision: 0, snapshot: initial };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(initial))
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useOfficeBackend());
    await act(async () => { await Promise.resolve(); });
    let firstAccept!: Promise<unknown>;
    let secondAccept!: Promise<unknown>;
    act(() => {
      firstAccept = result.current.postBusinessEvent({
        eventId: 'accept-first', eventType: 'artifact.accepted', schemaVersion: '1.0', occurredAt: '2026-07-22T06:00:00.000Z',
        correlationId: 'first', causationId: 'first:delivered', source: { system: 'test' }, payload: { artifactId: 'first', assigneeDeskId: 'dev-jack' },
      });
      secondAccept = result.current.postBusinessEvent({
        eventId: 'accept-second', eventType: 'artifact.accepted', schemaVersion: '1.0', occurredAt: '2026-07-22T06:00:01.000Z',
        correlationId: 'second', causationId: 'second:delivered', source: { system: 'test' }, payload: { artifactId: 'second', assigneeDeskId: 'dev-jack' },
      });
    });
    expect(result.current.pendingArtifactIds).toEqual(new Set(['first', 'second']));

    await act(async () => { first.resolve(jsonResponse({ ...acceptedResponse, eventId: 'accept-first' })); await firstAccept; });
    expect(result.current.pendingArtifactIds).toEqual(new Set(['second']));
    await act(async () => { second.resolve(jsonResponse({ ...acceptedResponse, eventId: 'accept-second' })); await secondAccept; });
  });
});

describe('Task 7 motion runner', () => {
  it('advances all waypoints and reports completion exactly once', async () => {
    vi.useFakeTimers();
    const state = applyBusinessEvent(createOfficeState(), submission);
    const postEvent = vi.fn(async (_event: MotionCompletedSignal) => state);
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
    const state = applyBusinessEvent(createOfficeState(), submission);
    const postEvent = vi.fn(async (_event: MotionCompletedSignal) => state);
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

  it('retries a failed motion confirmation until the API accepts it', async () => {
    vi.useFakeTimers();
    const state = applyBusinessEvent(createOfficeState(), submission);
    const postEvent = vi.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(state);
    renderHook(() => useOfficeMotionRunner(state.activeMotion, postEvent, true));

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(postEvent).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(postEvent).toHaveBeenCalledTimes(2);
  });
});

describe('Task 7 Inspector acceptance', () => {
  it('shows Accept only for the assigned employee and disables it while pending', async () => {
    let state = applyBusinessEvent(createOfficeState(), submission);
    state = completeActiveMotion(state);
    const onAccept = vi.fn(async () => undefined);
    const hubCounts = getHubArtifactCounts({ prd: state.scenario.hubArtifactIds.prd.length, feature: 2, report: 1 });

    const { rerender } = render(
      <InspectorContent
        hubCounts={hubCounts}
        notifications={state.notifications}
        onAccept={onAccept}
        onSelectionChange={vi.fn()}
        pendingArtifactIds={new Set()}
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
        pendingArtifactIds={new Set(['search-prd-v1'])}
        scenario={state.scenario}
        selection={{ kind: 'avatar', deskId: 'dev-jack' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Accept Search PRD v1.0' })).toBeDisabled();
  });

  it('handles a rejected Accept request without an unhandled promise', async () => {
    let state = applyBusinessEvent(createOfficeState(), submission);
    state = completeActiveMotion(state);
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

describe('Task 7 runtime delivery completion', () => {
  it('keeps an artifact out of the map after it reaches a desk', () => {
    let state = applyBusinessEvent(createOfficeState(), submission);
    while (state.activeMotion?.phase.startsWith('producer-')) state = completeActiveMotion(state);
    state = acceptArtifact(state, 'search-prd-v1', 'dev-jack');
    while (state.activeMotion) state = completeActiveMotion(state);

    render(<OfficeScene motion={null} onSelectionChange={vi.fn()} snapshot={toOfficeSnapshot(state)} />);

    expect(screen.queryByTestId('runtime-artifact-search-prd-v1')).not.toBeInTheDocument();
  });
});

describe('Task 7 inspector active work', () => {
  it('shows each active work and links artifact-backed work to its detail', () => {
    const scenario = structuredClone(createOfficeState().scenario);
    const jack = scenario.people.find((person) => person.deskId === 'dev-jack')!;
    jack.activeWorks = [
      { id: 'work-1', title: 'Working on Search PRD', sourceArtifactId: 'login-requirement-prd-v1', status: 'active' },
      { id: 'work-2', title: 'Reviewing UI copy', status: 'waiting_human' },
    ];
    const select = vi.fn();

    render(<InspectorContent hubCounts={getHubArtifactCounts()} onSelectionChange={select} pendingArtifactIds={new Set()} scenario={scenario} selection={{ kind: 'avatar', deskId: 'dev-jack' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Working on Search PRD' }));
    expect(screen.getByText('Reviewing UI copy')).toBeInTheDocument();
    expect(select).toHaveBeenCalledWith({ kind: 'artifact', artifactId: 'login-requirement-prd-v1' });
  });

  it('does not render Current Queue in a workspace overview', () => {
    render(<InspectorContent hubCounts={getHubArtifactCounts()} onSelectionChange={vi.fn()} pendingArtifactIds={new Set()} scenario={createOfficeState().scenario} selection={{ kind: 'workspace', workspaceId: 'dev-office' }} />);

    expect(screen.queryByText('Current Queue')).not.toBeInTheDocument();
  });
});

describe('Task 7 real office scene projection', () => {
  it('renders the active directional pose and keeps its independent foot anchor stable', () => {
    const state = applyBusinessEvent(createOfficeState(), submission);
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
    expect(moving).toHaveAttribute('data-runtime-actor', 'alice');
    expect(moving).not.toHaveAttribute('data-story-actor');
    expect(moving.querySelector('img')).toHaveAttribute('src', '/avatars/Alice/carry-up.png');
    expect(moving).toHaveStyle(toSceneRelativeStyle({ placement, renderSize, sceneSize: officeLayout.scene }));
    expect(moving.style.transform).toBe('');
    expect(screen.queryByTestId('avatar-pm-alice')).not.toBeInTheDocument();
    expect(screen.getByTestId('avatar-dev-jack')).toHaveAttribute('data-avatar-pose', 'seatedWorkingBack');
    expect(screen.getByTestId('runtime-artifact-search-prd-v1')).toHaveClass('office-sprite--runtime-artifact');
    expect(screen.getByTestId('runtime-artifact-search-prd-v1')).toHaveAttribute('data-artifact-location', 'carrier');
  });
});
