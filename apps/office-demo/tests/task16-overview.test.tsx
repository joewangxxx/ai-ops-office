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

describe('Task 16 Operations overview', () => {
  it('renders organization and handoff aggregates derived from the current projection', () => {
    window.history.replaceState({}, '', '/ops');
    runtimeWindow.__OFFICE_CONFIG__ = { operationsConsoleEnabled: true };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);

    expect(screen.getByText('People Online')).toBeInTheDocument();
    expect(screen.getByText('PRDs Submitted Today')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Acceptance')).toBeInTheDocument();
    expect(screen.getByText('System Summary')).toBeInTheDocument();
  });
});
