import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

afterEach(() => {
  window.history.replaceState({}, '', '/office');
});

function openReportFromSummary() {
  fireEvent.click(screen.getByRole('button', { name: 'Test Reports' }));
  const trigger = screen.getByRole('button', { name: 'Login Regression Report v1.0' });
  fireEvent.click(trigger);
  return trigger;
}

describe('Task 21 Inspector parent navigation', () => {
  it('returns a report to its still-expanded Office Summary metric and restores the trigger focus', () => {
    render(<App />);

    openReportFromSummary();
    expect(screen.getByRole('button', { name: 'Back to Test Reports' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Test Reports' }));
    const trigger = screen.getByRole('button', { name: 'Login Regression Report v1.0' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('returns artifact details to the originating Workspace, Hub, and Avatar frames', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open QA Lab overview' }));
    fireEvent.click(screen.getByRole('button', { name: /Test Reports 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Login Regression Report v1.0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to Test Reports' }));
    expect(screen.getByRole('heading', { name: 'QA Lab Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Test Reports 1/ })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Open Artifact Hub overview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reports 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Login Regression Report v1.0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to Artifact Hub' }));
    expect(screen.getByRole('heading', { name: 'Artifact Hub' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reports 1' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Open Jack detail' }));
    fireEvent.click(screen.getByRole('button', { name: 'Implementing login flow' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to Jack' }));
    expect(screen.getByRole('heading', { name: 'Jack' })).toBeInTheDocument();
  });

  it('only exposes Back for Inspector history and clears it for a new map selection, Close, and Show Office Summary', () => {
    render(<App />);

    expect(screen.queryByRole('button', { name: /^Back to / })).not.toBeInTheDocument();
    openReportFromSummary();
    fireEvent.click(screen.getByRole('button', { name: 'Open Dev Office overview' }));
    expect(screen.queryByRole('button', { name: /^Back to / })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show Office Summary' }));
    openReportFromSummary();
    fireEvent.click(screen.getByRole('button', { name: 'Close Inspector' }));
    expect(screen.getByRole('heading', { name: 'Office Summary' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Back to / })).not.toBeInTheDocument();
  });
});
