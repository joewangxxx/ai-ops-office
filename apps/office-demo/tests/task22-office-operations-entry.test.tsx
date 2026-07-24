import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { completeActiveMotion, submitArtifact, submittedEvent } from './helpers/officeEventTestUtils';

const runtimeWindow = window as Window & { __OFFICE_CONFIG__?: { operationsConsoleEnabled?: boolean } };

afterEach(() => {
  window.history.replaceState({}, '', '/');
  delete runtimeWindow.__OFFICE_CONFIG__;
  vi.restoreAllMocks();
});

describe('Task 22 Office Operations entry', () => {
  it('shows the native Operations Console entry only when the single runtime flag enables it', () => {
    window.history.replaceState({}, '', '/office');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);

    expect(screen.getByRole('link', { name: 'Open Operations Console' })).toHaveAttribute('href', '/ops');
    expect(screen.getByRole('link', { name: 'Open Operations Console' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Open Operations Console' })).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getByRole('link', { name: 'Open Operations Console' })).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('does not expose the Operations Console entry in public mode', () => {
    window.history.replaceState({}, '', '/office');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: false };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);

    expect(screen.queryByRole('link', { name: 'Open Operations Console' })).not.toBeInTheDocument();
  });

  it('keeps the enabled Office Summary available to the mobile Inspector so its native entry remains usable', () => {
    window.history.replaceState({}, '', '/office');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);

    expect(screen.getByRole('complementary', { name: 'Office Summary' })).toHaveAttribute('data-mobile-open', 'true');
  });

  it('renders the Hub handoff count from the shared projection status after a dispatched PRD arrives', async () => {
    window.history.replaceState({}, '', '/ops');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const submitted = submitArtifact(createOfficeState(), submittedEvent({ id: 'task22-hub-prd', title: 'Task 22 Hub PRD' }));
    const snapshot = toOfficeSnapshot(completeActiveMotion(submitted));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);

    await waitFor(() => expect(within(screen.getByLabelText('Handoff Status')).getByText('Awaiting Acceptance').parentElement).toHaveTextContent('Awaiting Acceptance1'));
  });
});
