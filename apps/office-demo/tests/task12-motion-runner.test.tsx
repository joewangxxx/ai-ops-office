import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOfficeMotionRunner } from '../src/hooks/useOfficeMotionRunner';
import type { OfficeMotion } from '../src/backend/officeDomain';

afterEach(() => vi.useRealTimers());

describe('Task 12 motion runner reconnect compatibility', () => {
  it('does not restart or confirm the same motion twice when an equal SSE snapshot rerenders', async () => {
    vi.useFakeTimers();
    const motion: OfficeMotion = { id: 'same-motion', phase: 'producer-to-hub', deskId: 'pm-alice', artifactId: 'prd', pose: 'carry', waypoints: [{ x: 0, y: 0 }, { x: 1, y: 1 }], transitionDurationMs: 10, causationEventId: 'submit', correlationId: 'submit' };
    const postRuntimeEvent = vi.fn(async () => undefined);
    const { rerender } = renderHook(({ value }) => useOfficeMotionRunner(value, postRuntimeEvent, false), { initialProps: { value: motion } });
    rerender({ value: structuredClone(motion) });
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    rerender({ value: structuredClone(motion) });
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    expect(postRuntimeEvent).toHaveBeenCalledTimes(1);
  });
});
