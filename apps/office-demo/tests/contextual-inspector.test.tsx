import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('contextual Inspector and map selection', () => {
  it('shows the default office summary and its required aggregates', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Office Summary' })).toBeInTheDocument();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
    expect(screen.getByText('PRDs Submitted')).toBeInTheDocument();
    expect(screen.getByText('Features In Progress')).toBeInTheDocument();
    expect(screen.getByText('Test Reports')).toBeInTheDocument();
    expect(screen.getAllByTestId('handoff-row')).toHaveLength(3);
  });

  it('switches all six selection kinds through accessible map and Inspector controls', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Dev Office overview' }));
    expect(screen.getByRole('heading', { name: 'Dev Office Overview' })).toBeInTheDocument();
    expect(screen.getByText('Developers Online 3 / 4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Alice detail' }));
    expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Mia offline desk detail' }));
    expect(screen.getByRole('heading', { name: 'Mia' })).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('Not active')).toBeInTheDocument();
    expect(screen.queryByText(/absence reason/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/last active/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Artifact Hub overview' }));
    expect(screen.getByRole('heading', { name: 'Artifact Hub' })).toBeInTheDocument();
    expect(screen.getByText('Stored Artifacts Today')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show Office Summary' }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    fireEvent.click(screen.getByRole('button', { name: 'PRDs Submitted' }));
    fireEvent.click(screen.getByRole('button', { name: 'Login Requirement PRD v1.0' }));
    expect(screen.getByRole('heading', { name: 'Login Requirement PRD v1.0' })).toBeInTheDocument();
    expect(screen.getByText('Submitted By')).toBeInTheDocument();
    expect(screen.queryByText(/^Type$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Source$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Target$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Version$/)).not.toBeInTheDocument();
  });

  it('exposes map objects as keyboard-focusable buttons', () => {
    render(<App />);

    const avatarControl = screen.getByRole('button', { name: 'Open Alice detail' });
    avatarControl.focus();

    expect(avatarControl).toHaveFocus();
    expect(avatarControl.tagName).toBe('BUTTON');
  });
});
