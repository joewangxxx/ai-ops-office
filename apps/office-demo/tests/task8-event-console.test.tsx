import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createOfficeState } from '../src/backend/officeDomain';
import { EventConsole } from '../src/components/inspector/EventConsole';
import { OfficeApiError } from '../src/hooks/useOfficeBackend';

const scenario = createOfficeState().scenario;

function renderConsole(overrides: Partial<React.ComponentProps<typeof EventConsole>> = {}) {
  const props: React.ComponentProps<typeof EventConsole> = {
    scenario,
    onSubmit: vi.fn(async () => undefined),
    onReset: vi.fn(async () => undefined),
    suffixFactory: () => 'fixed-001',
    metadataFactory: () => ({ eventId: 'task8-console-event', occurredAt: '2026-07-22T06:00:00.000Z' }),
    ...overrides,
  };
  render(<EventConsole {...props} />);
  return props;
}

const optionLabels = (name: string) => within(screen.getByRole('combobox', { name })).getAllByRole('option').map((option) => option.textContent);

function fillPrdEvidence() {
  fireEvent.change(screen.getByRole('textbox', { name: 'Evidence Summary' }), { target: { value: 'Defines the login requirement.' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Scope' }), { target: { value: 'Login' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'User Stories' }), { target: { value: 'A user can sign in.' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Acceptance Criteria' }), { target: { value: 'Valid credentials succeed.' } });
}

describe('Task 8 Event Console', () => {
  it('filters online producers and assignees by the selected Artifact route', () => {
    renderConsole();

    expect(optionLabels('Producer')).toEqual(['Alice', 'Bob']);
    expect(optionLabels('Assignee')).toEqual(['Jack', 'Kara', 'Leo']);
    expect(screen.queryByRole('option', { name: /Cindy|Mia|Tina/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Artifact Category' }), { target: { value: 'feature' } });
    expect(optionLabels('Producer')).toEqual(['Jack', 'Kara', 'Leo']);
    expect(optionLabels('Assignee')).toEqual(['Quinn', 'Rita']);

    fireEvent.change(screen.getByRole('combobox', { name: 'Artifact Category' }), { target: { value: 'report' } });
    expect(optionLabels('Producer')).toEqual(['Quinn', 'Rita']);
    expect(optionLabels('Assignee')).toEqual(['Alice', 'Bob']);
  });

  it('generates a stable read-only ID and submits the exact v1 submitted event', async () => {
    const onSubmit = vi.fn(async () => undefined);
    renderConsole({ onSubmit });

    fireEvent.change(screen.getByRole('textbox', { name: 'Artifact Title' }), { target: { value: 'Login Requirement PRD v2.0' } });
    fillPrdEvidence();
    expect(screen.getByRole('textbox', { name: 'Generated Artifact ID' })).toHaveValue('prd-login-requirement-prd-v2-0-fixed-001');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"eventType": "artifact.submitted"');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"schemaVersion": "1.0"');
    expect(screen.getByTestId('event-preview')).not.toHaveTextContent('motion.completed');
    expect(screen.getByTestId('event-preview')).not.toHaveTextContent('artifact.accepted');

    fireEvent.click(screen.getByRole('button', { name: 'Submit and Assign' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      eventId: 'task8-console-event',
      eventType: 'artifact.submitted',
      schemaVersion: '1.0',
      occurredAt: '2026-07-22T06:00:00.000Z',
      correlationId: 'task8-console-event',
      source: { system: 'event-console', actorId: 'pm-alice' },
      payload: {
        artifact: { id: 'prd-login-requirement-prd-v2-0-fixed-001', category: 'prd', title: 'Login Requirement PRD v2.0', evidence: { kind: 'prd', summary: 'Defines the login requirement.', priority: 'P1', scope: ['Login'], userStories: [{ id: 'US-1', statement: 'A user can sign in.' }], acceptanceCriteria: ['Valid credentials succeed.'] } },
        producerDeskId: 'pm-alice',
        assigneeDeskId: 'dev-jack',
      },
    }));
    expect(screen.getByText('Business event received: Login Requirement PRD v2.0')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Artifact Title' })).toHaveValue('');
  });

  it('disables submission and ignores a synchronous double click', async () => {
    let finish!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    renderConsole({ onSubmit });
    fireEvent.change(screen.getByRole('textbox', { name: 'Artifact Title' }), { target: { value: 'Double Click PRD' } });
    fillPrdEvidence();
    const submit = screen.getByRole('button', { name: 'Submit and Assign' });

    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();
    await act(async () => { finish(); });
  });

  it('shows API errors inside the Console and preserves all user input', async () => {
    const onSubmit = vi.fn(async () => { throw new OfficeApiError(409, 'Artifact already exists: duplicate'); });
    renderConsole({ onSubmit });
    fireEvent.change(screen.getByRole('textbox', { name: 'Artifact Title' }), { target: { value: 'Duplicate PRD' } });
    fillPrdEvidence();
    fireEvent.change(screen.getByRole('combobox', { name: 'Producer' }), { target: { value: 'pm-bob' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Assignee' }), { target: { value: 'dev-kara' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit and Assign' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Artifact already exists: duplicate');
    expect(screen.getByRole('textbox', { name: 'Artifact Title' })).toHaveValue('Duplicate PRD');
    expect(screen.getByRole('combobox', { name: 'Producer' })).toHaveValue('pm-bob');
    expect(screen.getByRole('combobox', { name: 'Assignee' })).toHaveValue('dev-kara');
  });

  it('requires an inline confirmation before resetting the projection', async () => {
    const onReset = vi.fn(async () => undefined);
    renderConsole({ onReset });

    fireEvent.click(screen.getByRole('button', { name: 'Reset Projection' }));
    expect(screen.getByText('Reset the live projection?')).toBeInTheDocument();
    expect(onReset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Reset' }));
    await waitFor(() => expect(onReset).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText('Reset the live projection?')).not.toBeInTheDocument());
  });
});
