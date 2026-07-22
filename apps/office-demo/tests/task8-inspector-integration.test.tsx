import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { applyOfficeEvent, createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';

const completion = {
  type: 'artifact.completed' as const,
  artifact: { id: 'task8-integration-prd', category: 'prd' as const, title: 'Task 8 Integration PRD' },
  producerDeskId: 'pm-alice',
  assigneeDeskId: 'dev-jack',
};

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
    const moving = toOfficeSnapshot(applyOfficeEvent(createOfficeState(), completion));
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(moving)));
    render(<App />);

    const actor = await screen.findByTestId('moving-avatar-alice');
    fireEvent.click(screen.getByRole('tab', { name: 'Event Console' }));
    expect(screen.getByTestId('moving-avatar-alice')).toBe(actor);
    fireEvent.click(screen.getByRole('tab', { name: 'Inspect' }));
    expect(screen.getByTestId('moving-avatar-alice')).toBe(actor);
  });

  it('connects Complete and Assign to the existing office event API', async () => {
    const initial = toOfficeSnapshot(createOfficeState());
    const accepted = toOfficeSnapshot(applyOfficeEvent(createOfficeState(), completion));
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/office-events') return jsonResponse(accepted);
      return jsonResponse(initial);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Event Console' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Artifact Title' }), { target: { value: 'Task 8 Integration PRD' } });
    fireEvent.click(screen.getByRole('button', { name: 'Complete and Assign' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/office-events', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"type":"artifact.completed"'),
    })));
    expect(await screen.findByText('Business event received: Task 8 Integration PRD')).toBeInTheDocument();
  });
});
