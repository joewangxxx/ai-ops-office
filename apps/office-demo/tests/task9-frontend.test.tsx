import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createOfficeState } from '../src/backend/officeDomain';
import { EventConsole } from '../src/components/inspector/EventConsole';

describe('Task 9 Event Console contract', () => {
  it('previews and submits a complete v1 artifact.submitted envelope', async () => {
    const onSubmit = vi.fn(async () => undefined);
    const props = {
      scenario: createOfficeState().scenario,
      onSubmit,
      onReset: vi.fn(async () => undefined),
      suffixFactory: () => 'fixed-001',
      metadataFactory: () => ({
        eventId: 'evt-console-submit',
        occurredAt: '2026-07-22T06:00:00.000Z',
      }),
    } as React.ComponentProps<typeof EventConsole>;
    render(<EventConsole {...props} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Artifact Title' }), { target: { value: 'Console Contract PRD' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Evidence Summary' }), { target: { value: 'Defines the console contract.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Scope' }), { target: { value: 'Console' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'User Stories' }), { target: { value: 'A user submits a PRD.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Acceptance Criteria' }), { target: { value: 'The PRD reaches the Hub.' } });
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"eventType": "artifact.submitted"');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"schemaVersion": "1.0"');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"eventId": "evt-console-submit"');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"correlationId": "evt-console-submit"');
    expect(screen.getByTestId('event-preview')).not.toHaveTextContent('artifact.completed');
    expect(screen.getByTestId('event-preview')).not.toHaveTextContent('motion.completed');

    fireEvent.click(screen.getByRole('button', { name: 'Submit and Assign' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'evt-console-submit',
      eventType: 'artifact.submitted',
      schemaVersion: '1.0',
      occurredAt: '2026-07-22T06:00:00.000Z',
      correlationId: 'evt-console-submit',
      source: { system: 'event-console', actorId: 'pm-alice' },
      payload: expect.objectContaining({
        producerDeskId: 'pm-alice',
        assigneeDeskId: 'dev-jack',
      }),
    })));
  });
});
