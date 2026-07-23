import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createOfficeState } from '../src/backend/officeDomain';
import { EventConsole } from '../src/components/inspector/EventConsole';

function renderConsole() {
  render(<EventConsole
    metadataFactory={() => ({ eventId: 'task10-console', occurredAt: '2026-07-22T06:00:00.000Z' })}
    onReset={vi.fn(async () => undefined)}
    onSubmit={vi.fn(async () => undefined)}
    scenario={createOfficeState().scenario}
    suffixFactory={() => 'fixed'}
  />);
}

describe('Task 10 structured Event Console evidence', () => {
  it('builds structured PRD evidence in the v1 preview', () => {
    renderConsole();
    fireEvent.change(screen.getByRole('textbox', { name: 'Artifact Title' }), { target: { value: 'Secure Sign-in PRD' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Evidence Summary' }), { target: { value: 'Defines secure sign-in.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Scope' }), { target: { value: 'Email sign-in\nSession expiry' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'User Stories' }), { target: { value: 'A user can sign in.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Acceptance Criteria' }), { target: { value: 'Valid credentials open the dashboard.' } });

    expect(screen.getByTestId('event-preview')).toHaveTextContent('"evidence"');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"kind": "prd"');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"priority": "P1"');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"id": "US-1"');
    expect(screen.getByRole('button', { name: 'Submit and Assign' })).toBeEnabled();
  });

  it('clears category-specific fields when switching from PRD to Feature', () => {
    renderConsole();
    fireEvent.change(screen.getByRole('textbox', { name: 'Evidence Summary' }), { target: { value: 'Old PRD summary' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Scope' }), { target: { value: 'Old scope' } });

    fireEvent.change(screen.getByRole('combobox', { name: 'Artifact Category' }), { target: { value: 'feature' } });

    expect(screen.queryByRole('textbox', { name: 'Scope' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Commit SHA' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Evidence Summary' })).toHaveValue('');
    expect(screen.getByTestId('event-preview')).toHaveTextContent('"kind": "feature"');
    expect(screen.getByTestId('event-preview')).not.toHaveTextContent('Old PRD summary');
    expect(screen.getByTestId('event-preview')).not.toHaveTextContent('Old scope');
  });

  it('shows structured Test Report fields without a JSON editor', () => {
    renderConsole();
    fireEvent.change(screen.getByRole('combobox', { name: 'Artifact Category' }), { target: { value: 'report' } });

    expect(screen.getByRole('spinbutton', { name: 'Total Tests' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Passed Tests' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Failed Tests' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Regression' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/JSON/i)).not.toBeInTheDocument();
  });
});
