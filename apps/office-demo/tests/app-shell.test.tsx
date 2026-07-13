import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('App shell', () => {
  it('renders the scene, Inspector, and Story Controller shells', () => {
    render(<App />);

    expect(screen.getByTestId('office-scene')).toHaveStyle({ aspectRatio: '1672 / 941' });
    expect(screen.getByRole('img', { name: 'Office scene' })).toHaveAttribute(
      'src',
      '/scene/office-shell.png',
    );
    expect(screen.getByRole('complementary', { name: 'Office Summary' })).toBeInTheDocument();
    expect(screen.getByLabelText('Story controller')).toBeInTheDocument();
  });
});
