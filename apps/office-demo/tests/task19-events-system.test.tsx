import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';

const runtimeWindow = window as Window & { __OFFICE_CONFIG__?: { operationsConsoleEnabled?: boolean } };
afterEach(() => { window.history.replaceState({}, '', '/'); delete runtimeWindow.__OFFICE_CONFIG__; vi.restoreAllMocks(); });

describe('Task 19 Events and System', () => {
  it('shows a sanitized Events table with URL-backed result filters', async () => {
    window.history.replaceState({}, '', '/ops/events?result=accepted'); runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).startsWith('/api/internal/events')
      ? ({ ok: true, json: async () => ({ items: [{ timestamp: '2026-07-24T10:00:00.000Z', eventId: 'accepted-1', eventType: 'artifact.submitted', sourceSystem: 'operations-dispatch', correlationId: 'chain-1', result: 'accepted' }], nextCursor: null, total: 1 }) } as Response)
      : ({ ok: true, json: async () => snapshot } as Response)));
    render(<App />);
    expect(await screen.findByRole('table', { name: 'Event outcomes' })).toHaveTextContent('accepted-1');
    expect(screen.getByRole('combobox', { name: 'Event result filter' })).toHaveValue('accepted');
    expect(screen.queryByText(/payload|authorization|api key/i)).not.toBeInTheDocument();
  });

  it('requires RESET before submitting the standard projection.reset command', async () => {
    window.history.replaceState({}, '', '/ops/system'); runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => String(input) === '/api/business-events'
      ? ({ ok: true, status: 202, json: async () => ({ status: 'accepted', eventId: 'reset-1', revision: 1, snapshot }) } as Response)
      : String(input) === '/api/internal/diagnostics'
        ? ({ ok: true, json: async () => ({ health: { overall: 'healthy', gateway: 'up', ledger: 'writable', projection: 'ready', epoch: 0, revision: 0, lastSequence: 0, activeMotionCount: 0, motionQueueCount: 0 }, runtime: { pendingDeliveryCount: 0, awaitingAcceptanceCount: 0, collectingCount: 0, activeWorkCount: 0 } }) } as Response)
        : ({ ok: true, json: async () => snapshot } as Response));
    vi.stubGlobal('fetch', fetchMock); render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reset Projection' }));
    expect(screen.getByRole('dialog', { name: 'Confirm projection reset' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Type RESET to confirm' }), { target: { value: 'RESET' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Reset' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/business-events', expect.objectContaining({ body: expect.stringContaining('"eventType":"projection.reset"') }));
  });
});
