import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { useOfficeBackend, type OfficeEventSource } from '../src/hooks/useOfficeBackend';

class MockEventSource implements OfficeEventSource {
  static instances: MockEventSource[] = [];
  onerror: ((event: Event) => void) | null = null;
  readonly listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>();
  closed = false;
  constructor(public readonly url: string) { MockEventSource.instances.push(this); }
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    const values = this.listeners.get(type) ?? new Set(); values.add(listener); this.listeners.set(type, values);
  }
  close() { this.closed = true; }
  emit(message: unknown) { for (const listener of this.listeners.get('snapshot') ?? []) listener({ data: JSON.stringify(message) } as MessageEvent<string>); }
  fail() { this.onerror?.(new Event('error')); }
}

const streamMessage = (epoch: number, revision: number) => {
  const snapshot = toOfficeSnapshot(createOfficeState(epoch)); snapshot.revision = revision;
  return { epoch, revision, sequence: revision, snapshot };
};

afterEach(() => { MockEventSource.instances = []; vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Task 12 EventSource-first backend hook', () => {
  it('uses SSE without steady polling and ignores duplicate, stale-revision, and stale-epoch snapshots', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useOfficeBackend(undefined, { eventSourceFactory: (url) => new MockEventSource(url) }));
    const source = MockEventSource.instances[0]!;
    await act(async () => source.emit(streamMessage(0, 2)));
    expect(result.current.snapshot.revision).toBe(2);
    expect(result.current.connectionState).toMatchObject({ mode: 'sse' });
    await act(async () => { source.emit(streamMessage(0, 2)); source.emit(streamMessage(0, 1)); source.emit(streamMessage(-1, 99)); });
    expect(result.current.snapshot).toMatchObject({ epoch: 0, revision: 2 });
    expect(fetchMock).not.toHaveBeenCalledWith('/api/office-state', expect.anything());
  });

  it('falls back after three failures, then stops polling when SSE recovers', async () => {
    vi.useFakeTimers();
    const pollSnapshot = streamMessage(0, 1).snapshot;
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => pollSnapshot }) as Response);
    vi.stubGlobal('fetch', fetchMock);
    const { result, unmount } = renderHook(() => useOfficeBackend(undefined, {
      eventSourceFactory: (url) => new MockEventSource(url), pollIntervalMs: 50, reconnectIntervalMs: 50, initialSnapshotTimeoutMs: 1_000,
    }));
    for (let index = 0; index < 2; index += 1) {
      act(() => MockEventSource.instances.at(-1)!.fail());
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    }
    act(() => MockEventSource.instances.at(-1)!.fail());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.connectionState).toMatchObject({ mode: 'polling', failures: 3 });
    expect(fetchMock).toHaveBeenCalledWith('/api/office-state', expect.anything());

    await act(async () => { vi.advanceTimersByTime(50); await Promise.resolve(); });
    const recovered = MockEventSource.instances.at(-1)!;
    await act(async () => recovered.emit(streamMessage(0, 2)));
    expect(result.current.connectionState).toMatchObject({ mode: 'sse', failures: 0 });
    const polls = fetchMock.mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(200); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(polls);
    unmount();
    expect(recovered.closed).toBe(true);
  });
});
