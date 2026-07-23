import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('App shell', () => {
  it('declares an embedded favicon so the browser console stays free of 404 errors', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('<link rel="icon" href="data:image/svg+xml,');
  });

  it('renders the event-driven scene and Inspector without the legacy Story Controller', () => {
    render(<App />);

    expect(screen.getByTestId('office-scene')).toHaveStyle({ aspectRatio: '1672 / 941' });
    expect(screen.getByRole('img', { name: 'Office scene' })).toHaveAttribute(
      'src',
      '/scene/office-shell.png',
    );
    expect(screen.getByRole('complementary', { name: 'Office Summary' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Story controller')).not.toBeInTheDocument();
  });
});
