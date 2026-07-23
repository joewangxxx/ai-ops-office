import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { applyBusinessEvent, createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { submittedEvent } from './helpers/officeEventTestUtils';

const submission = submittedEvent({ id: 'task8-integration-prd', title: 'Task 8 Integration PRD' });

const jsonResponse = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body }) as Response;

afterEach(() => vi.restoreAllMocks());

describe('Task 8 Inspector integration', () => {
  it('defaults to Inspect and keeps Event Console open while map selection changes', async () => {
    const initial = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(initial)));
    render(<App />);

    expect(screen.getByRole('tab', { name: 'Inspect' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Event Console' }));
    expect(screen.getByRole('heading', { name: 'Event Console' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Alice detail' }));
    expect(screen.getByRole('heading', { name: 'Event Console' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Inspect' }));
    expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
  });

  it('does not interrupt an active motion while switching Inspector views', async () => {
    const moving = toOfficeSnapshot(applyBusinessEvent(createOfficeState(), submission));
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(moving)));
    render(<App />);

    const actor = await screen.findByTestId('moving-avatar-alice');
    fireEvent.click(screen.getByRole('tab', { name: 'Event Console' }));
    expect(screen.getByTestId('moving-avatar-alice')).toBe(actor);
    fireEvent.click(screen.getByRole('tab', { name: 'Inspect' }));
    expect(screen.getByTestId('moving-avatar-alice')).toBe(actor);
  });

  it('connects Submit and Assign to the v1 business event API', async () => {
    const initial = toOfficeSnapshot(createOfficeState());
    const accepted = toOfficeSnapshot(applyBusinessEvent(createOfficeState(), submission));
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/business-events') return jsonResponse({
        status: 'accepted', eventId: 'task8-integration', revision: accepted.revision, snapshot: accepted,
      });
      return jsonResponse(initial);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Event Console' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Artifact Title' }), { target: { value: 'Task 8 Integration PRD' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Evidence Summary' }), { target: { value: 'Integration evidence.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Scope' }), { target: { value: 'Integration' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'User Stories' }), { target: { value: 'A user completes the flow.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Acceptance Criteria' }), { target: { value: 'The flow succeeds.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit and Assign' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/business-events', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"eventType":"artifact.submitted"'),
    })));
    expect(await screen.findByText('Business event received: Task 8 Integration PRD')).toBeInTheDocument();
  });
});
