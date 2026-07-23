import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { applyBusinessEvent, createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { DiagnosticsPanel } from '../src/components/inspector/DiagnosticsPanel';
import type { ProjectionConnectionState } from '../src/hooks/useOfficeBackend';
import { submittedEvent } from './helpers/officeEventTestUtils';

const runtimeWindow = window as typeof window & { __OFFICE_CONFIG__?: { eventConsoleEnabled: boolean; diagnosticsEnabled?: boolean } };
const snapshot = toOfficeSnapshot(createOfficeState());
const diagnostics = {
  health: { overall: 'healthy', gateway: 'up', ledger: 'writable', projection: 'ready', epoch: 0, revision: 0, lastSequence: 0, activeMotionCount: 0, motionQueueCount: 0, updatedAt: '2026-07-22T12:00:00.000Z' },
  runtime: { pendingDeliveryCount: 0, awaitingAcceptanceCount: 0, collectingCount: 0, activeWorkCount: 3 },
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, headers: new Headers({ 'Content-Type': 'application/json' }), json: async () => body, text: async () => JSON.stringify(body), blob: async () => new Blob([JSON.stringify(body)]) } as Response;
}

afterEach(() => {
  delete runtimeWindow.__OFFICE_CONFIG__;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Task 14 Diagnostics UI', () => {
  it.each([
    [{ mode: 'sse', failures: 0, sseState: 'connected', lastSnapshotAt: '2026-07-22T12:00:00.000Z', reconnectCount: 1, pollingFallback: false }, 'SSE', 'Connected'],
    [{ mode: 'polling', failures: 3, reason: 'SSE failed', sseState: 'reconnecting', lastSnapshotAt: null, reconnectCount: 3, pollingFallback: true }, 'Polling', 'Reconnecting'],
    [{ mode: 'offline', failures: 4, reason: 'API offline', sseState: 'reconnecting', lastSnapshotAt: null, reconnectCount: 4, pollingFallback: true }, 'Offline', 'Reconnecting'],
  ] as const)('renders %s connection state with textual labels', async (connection, modeLabel, sseLabel) => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(diagnostics)));
    render(<DiagnosticsPanel connectionState={connection as ProjectionConnectionState} />);
    expect(await screen.findByText(modeLabel, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(sseLabel, { exact: true })).toBeInTheDocument();
  });

  it('shows the third tab only in internal mode and keeps a live motion mounted while switching views', async () => {
    runtimeWindow.__OFFICE_CONFIG__ = { eventConsoleEnabled: true, diagnosticsEnabled: true };
    const submission = submittedEvent({ id: 'diagnostic-motion', title: 'Diagnostic Motion' });
    const moving = toOfficeSnapshot(applyBusinessEvent(createOfficeState(), submission));
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).includes('/api/internal/') ? jsonResponse(diagnostics) : jsonResponse(moving)));
    render(<App />);

    const actor = await screen.findByTestId('moving-avatar-alice');
    fireEvent.click(screen.getByRole('tab', { name: 'Diagnostics' }));
    expect(await screen.findByRole('heading', { name: 'Diagnostics' })).toBeInTheDocument();
    expect(screen.getByTestId('moving-avatar-alice')).toBe(actor);
    fireEvent.click(screen.getByRole('tab', { name: 'Inspect' }));
    expect(screen.getByTestId('moving-avatar-alice')).toBe(actor);
    expect(screen.getByRole('heading', { name: 'Office Summary' })).toBeInTheDocument();
  });

  it('isolates diagnostics request failures from Inspect, Event Console, and the Office Map', async () => {
    runtimeWindow.__OFFICE_CONFIG__ = { eventConsoleEnabled: true, diagnosticsEnabled: true };
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).includes('/api/internal/') ? jsonResponse({ error: 'diagnostics unavailable' }, false, 503) : jsonResponse(snapshot)));
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Diagnostics' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/diagnostics unavailable/i);
    expect(screen.getByTestId('office-scene')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Inspect' }));
    expect(screen.getByRole('heading', { name: 'Office Summary' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Event Console' }));
    expect(screen.getByRole('heading', { name: 'Event Console' })).toBeInTheDocument();
  });

  it('refreshes health every five seconds without exposing employee-monitoring fields', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => jsonResponse(diagnostics));
    vi.stubGlobal('fetch', fetchMock);
    render(<DiagnosticsPanel connectionState={{ mode: 'sse', failures: 0, sseState: 'connected', lastSnapshotAt: '2026-07-22T12:00:00.000Z', reconnectCount: 0, pollingFallback: false }} />);
    await act(async () => { await Promise.resolve(); });
    const initialCalls = fetchMock.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(initialCalls);
    expect(document.body.textContent).not.toMatch(/online duration|offline reason|keystroke|prompt|chat|tool call|screen content/i);
  });
});
