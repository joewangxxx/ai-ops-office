import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/app/App'

afterEach(() => {
  window.history.replaceState({}, '', '/')
  vi.restoreAllMocks()
})

describe('Task 20 Office cleanup', () => {
  it('keeps the Office Inspector inspect-only', () => {
    window.history.replaceState({}, '', '/office')
    render(<App />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Event Console' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Diagnostics' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reset Projection/i })).not.toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Office Summary' })).toBeInTheDocument()
  })
})
