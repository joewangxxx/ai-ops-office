import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';

const runtimeWindow = window as Window & { __OFFICE_CONFIG__?: { operationsConsoleEnabled?: boolean } };

afterEach(() => { window.history.replaceState({}, '', '/'); delete runtimeWindow.__OFFICE_CONFIG__; vi.restoreAllMocks(); });

describe('Task 18 Artifact Registry', () => {
  it('renders searchable projection-derived artifacts and a baseline detail timeline', async () => {
    window.history.replaceState({}, '', '/ops/artifacts?query=login');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);
    expect(await screen.findByRole('table', { name: 'Artifact registry' })).toBeInTheDocument();
    expect(screen.getByText('Login Requirement PRD v1.0')).toBeInTheDocument();
    expect(screen.queryByText('Account Security PRD v1.0')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Login Requirement PRD v1.0 details' }));
    expect(screen.getByRole('dialog', { name: 'Login Requirement PRD v1.0 details' })).toHaveTextContent(/Baseline state loaded/i);
  });

  it('restores registry filters and page size from the URL', async () => {
    window.history.replaceState({}, '', '/ops/artifacts?workspaceId=qa-lab&sort=title&limit=25');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);
    expect(await screen.findByRole('combobox', { name: 'Workspace filter' })).toHaveValue('qa-lab');
    expect(screen.getByRole('combobox', { name: 'Artifact sort' })).toHaveValue('title');
    expect(screen.getByRole('combobox', { name: 'Results per page' })).toHaveValue('25');
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(4));
  });

  it('confirms a legal artifact acceptance through the standard command path', async () => {
    window.history.replaceState({}, '', '/ops/artifacts?artifactId=login-requirement-prd-v1');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const state = createOfficeState();
    state.artifacts['login-requirement-prd-v1'] = { id: 'login-requirement-prd-v1', category: 'prd', title: 'Login Requirement PRD v1.0', producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack', location: 'hub', status: 'Awaiting Acceptance' };
    state.notifications.push({ id: 'available-login', artifactId: 'login-requirement-prd-v1', assigneeDeskId: 'dev-jack', message: 'Ready for Jack.', canAccept: true, status: 'available', correlationId: 'corr-login', causationEventId: 'delivered-login' });
    state.revision = 1;
    const snapshot = toOfficeSnapshot(state);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => String(input) === '/api/business-events'
      ? ({ ok: true, status: 202, json: async () => ({ status: 'accepted', eventId: 'accept-login', revision: 1, snapshot }) } as Response)
      : ({ ok: true, status: 200, json: async () => snapshot } as Response));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Accept as Jack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm acceptance' }));
    await screen.findByText(/Accept request submitted/i);
    expect(fetchMock).toHaveBeenCalledWith('/api/business-events', expect.objectContaining({ method: 'POST', body: expect.stringContaining('"eventType":"artifact.accepted"') }));
  });
});
