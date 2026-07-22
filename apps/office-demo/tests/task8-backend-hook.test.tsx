import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyOfficeEvent, createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { OfficeApiError, useOfficeBackend } from '../src/hooks/useOfficeBackend';

const completion = {
  type: 'artifact.completed' as const,
  artifact: { id: 'task8-hook-prd', category: 'prd' as const, title: 'Task 8 Hook PRD' },
  producerDeskId: 'pm-alice',
  assigneeDeskId: 'dev-jack',
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
    const reset = toOfficeSnapshot(createOfficeState());
    const stale = toOfficeSnapshot(applyOfficeEvent(createOfficeState(), completion));
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => oldPoll.promise)
      .mockResolvedValueOnce(jsonResponse(reset));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useOfficeBackend());

    await act(async () => { await result.current.resetProjection(); });
    expect(fetchMock).toHaveBeenLastCalledWith('/api/office-reset', expect.objectContaining({ method: 'POST' }));
    expect(result.current.snapshot).toMatchObject({ revision: 0, artifacts: {} });

    await act(async () => { oldPoll.resolve(jsonResponse(stale)); await Promise.resolve(); });
    expect(result.current.snapshot).toMatchObject({ revision: 0, artifacts: {} });
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
      try { await result.current.postEvent(completion); } catch (error) { caught = error; }
    });

    expect(caught).toBeInstanceOf(OfficeApiError);
    expect(caught).toMatchObject({ status: 409, message: 'Invalid prd route' });
    expect(result.current.snapshot).toEqual(initial);
  });
});
