import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';

const runtimeWindow = window as Window & { __OFFICE_CONFIG__?: { operationsConsoleEnabled?: boolean } };

afterEach(() => {
  window.history.replaceState({}, '', '/');
  delete runtimeWindow.__OFFICE_CONFIG__;
  vi.restoreAllMocks();
});

describe('Task 15 Operations routes', () => {
  it('renders the enabled Operations Console overview at /ops with an accessible primary navigation', () => {
    window.history.replaceState({}, '', '/ops');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Operations' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dispatch' })).toHaveAttribute('href', '/ops/dispatch');
    expect(document.title).toContain('Overview');
  });

  it('keeps Operations routes undiscoverable in public mode', () => {
    window.history.replaceState({}, '', '/ops/people');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: false };

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Operations' })).not.toBeInTheDocument();
  });
});
