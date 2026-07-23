import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';

const runtimeWindow = window as typeof window & { __OFFICE_CONFIG__?: { eventConsoleEnabled: boolean } };

afterEach(() => {
  delete runtimeWindow.__OFFICE_CONFIG__;
  vi.restoreAllMocks();
});

describe('Task 13 public runtime configuration', () => {
  it('hides the Event Console without disabling Inspect or business acceptance UI', async () => {
    runtimeWindow.__OFFICE_CONFIG__ = { eventConsoleEnabled: false };
    const snapshot = toOfficeSnapshot(createOfficeState());
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response));

    render(<App />);

    expect(screen.getByRole('tab', { name: 'Inspect' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Event Console' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Office Summary' })).toBeInTheDocument();
  });
});
