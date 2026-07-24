import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';

const runtimeWindow = window as Window & { __OFFICE_CONFIG__?: { operationsConsoleEnabled?: boolean } };

afterEach(() => {
  window.history.replaceState({}, '', '/');
  delete runtimeWindow.__OFFICE_CONFIG__;
  vi.restoreAllMocks();
});

describe('Task 16 Dispatch Center', () => {
  it('accepts only valid route query prefill and permits an offline downstream assignee', () => {
    window.history.replaceState({}, '', '/ops/dispatch?producerDeskId=pm-alice&category=prd&assigneeDeskId=dev-mia');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);

    expect(screen.getByRole('combobox', { name: 'Artifact Category' })).toHaveValue('prd');
    expect(screen.getByRole('combobox', { name: 'Producer' })).toHaveValue('pm-alice');
    expect(screen.getByRole('combobox', { name: 'Assignee' })).toHaveValue('dev-mia');
  });

  it('submits a structured artifact.submitted event without exposing reset controls', async () => {
    window.history.replaceState({}, '', '/ops/dispatch');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/business-events') return { ok: true, status: 200, json: async () => ({ status: 'accepted', eventId: 'dispatch-event', revision: 1, snapshot }) } as Response;
      return { ok: true, status: 200, json: async () => snapshot } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Artifact Title' }), { target: { value: 'Dispatch PRD' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Evidence Summary' }), { target: { value: 'Dispatch evidence.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Scope' }), { target: { value: 'Dispatch' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'User Stories' }), { target: { value: 'A PM dispatches work.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Acceptance Criteria' }), { target: { value: 'The PRD reaches the hub.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit and Assign' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/business-events', expect.objectContaining({ method: 'POST' })));
    expect(screen.queryByRole('button', { name: 'Reset Projection' })).not.toBeInTheDocument();
  });
});
