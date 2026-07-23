import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyBusinessEvent, createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { OfficeApiError, useOfficeBackend } from '../src/hooks/useOfficeBackend';

const submission = {
  eventId: 'task8-hook-submission',
  eventType: 'artifact.submitted' as const,
  schemaVersion: '1.0' as const,
  occurredAt: '2026-07-22T06:00:00.000Z',
  correlationId: 'task8-hook-submission',
  source: { system: 'task8-test', actorId: 'pm-alice' },
  payload: {
    artifact: { id: 'task8-hook-prd', category: 'prd' as const, title: 'Task 8 Hook PRD', evidence: { kind: 'prd' as const, summary: 'Defines the backend hook flow.', priority: 'P1' as const, scope: ['Backend hook'], userStories: [{ id: 'US-1', statement: 'A user submits an artifact.' }], acceptanceCriteria: ['The snapshot updates.'] } },
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
  vi.restoreAllMocks();
});

describe('Task 8 backend hook', () => {
  it('commits a Reset response and ignores an older in-flight poll', async () => {
    const oldPoll = deferred<Response>();
    const reset = toOfficeSnapshot(createOfficeState(1));
    reset.revision = 1;
    const stale = toOfficeSnapshot(applyBusinessEvent(createOfficeState(), submission));
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => oldPoll.promise)
      .mockResolvedValueOnce(jsonResponse({ status: 'accepted', eventId: 'task8-reset-event', revision: 1, snapshot: reset }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useOfficeBackend(() => ({ eventId: 'task8-reset-event', occurredAt: '2026-07-22T06:00:00.000Z' })));

    await act(async () => { await result.current.resetProjection(); });
    expect(fetchMock).toHaveBeenLastCalledWith('/api/business-events', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"eventType":"projection.reset"'),
    }));
    expect(result.current.snapshot).toMatchObject({ epoch: 1, revision: 1, artifacts: {} });

    await act(async () => { oldPoll.resolve(jsonResponse(stale)); await Promise.resolve(); });
    expect(result.current.snapshot).toMatchObject({ epoch: 1, revision: 1, artifacts: {} });
  });

  it('throws an OfficeApiError with status while retaining the last snapshot', async () => {
    const initial = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse(initial))
      .mockResolvedValueOnce(jsonResponse({ error: 'Invalid prd route' }, false, 409)));
    const { result } = renderHook(() => useOfficeBackend());
    await act(async () => { await Promise.resolve(); });

    let caught: unknown;
    await act(async () => {
      try { await result.current.postBusinessEvent(submission); } catch (error) { caught = error; }
    });

    expect(caught).toBeInstanceOf(OfficeApiError);
    expect(caught).toMatchObject({ status: 409, message: 'Invalid prd route' });
    expect(result.current.snapshot).toEqual(initial);
  });
});
