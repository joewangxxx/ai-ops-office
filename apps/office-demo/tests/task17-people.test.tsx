import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';

const runtimeWindow = window as Window & { __OFFICE_CONFIG__?: { operationsConsoleEnabled?: boolean } };

afterEach(() => { window.history.replaceState({}, '', '/'); delete runtimeWindow.__OFFICE_CONFIG__; vi.restoreAllMocks(); });

describe('Task 17 People directory', () => {
  it('shows a legal pending assignment and confirms an artifact.accepted command', async () => {
    window.history.replaceState({}, '', '/ops/people');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const state = createOfficeState();
    state.notifications.push({ id: 'pending-jack', artifactId: 'login-requirement-prd-v1', assigneeDeskId: 'dev-jack', message: 'A pending assignment.', canAccept: true, status: 'available', correlationId: 'corr-jack', causationEventId: 'delivered-jack' });
    state.revision = 1;
    const snapshot = toOfficeSnapshot(state);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => String(input) === '/api/business-events'
      ? ({ ok: true, status: 202, json: async () => ({ status: 'accepted', eventId: 'accepted-jack', revision: 1, snapshot }) } as Response)
      : ({ ok: true, status: 200, json: async () => snapshot } as Response));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Jack details' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Simulate Accept as Jack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm acceptance' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/business-events', expect.objectContaining({ method: 'POST', body: expect.stringContaining('"eventType":"artifact.accepted"') })));
  });

  it('derives all people from the projection and filters by workspace without exposing monitoring data', () => {
    window.history.replaceState({}, '', '/ops/people');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);
    expect(screen.getByRole('table', { name: 'People directory' })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Mia')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Workspace filter' }), { target: { value: 'dev-office' } });
    expect(screen.getByText('Jack')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText(/screen|mouse|prompt/i)).not.toBeInTheDocument();
  });

  it('closes a person detail with Escape and restores focus to its trigger', async () => {
    window.history.replaceState({}, '', '/ops/people');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);
    const trigger = await screen.findByRole('button', { name: 'Open Jack details' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Jack details' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Jack details' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
