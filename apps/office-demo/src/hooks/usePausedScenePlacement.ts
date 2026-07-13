import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

type FrozenPosition = Pick<CSSProperties, 'left' | 'top'>;

type PausedScenePlacement<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  style: CSSProperties;
};

export function usePausedScenePlacement<T extends HTMLElement>(baseStyle: CSSProperties, isPaused: boolean, transitionDurationMs: number): PausedScenePlacement<T> {
  const ref = useRef<T>(null);
  const wasPaused = useRef(false);
  const [frozenPosition, setFrozenPosition] = useState<FrozenPosition | null>(null);

  useLayoutEffect(() => {
    if (isPaused && !wasPaused.current && ref.current) {
      const computed = window.getComputedStyle(ref.current);
      if (computed.left && computed.top) setFrozenPosition({ left: computed.left, top: computed.top });
    }
    if (!isPaused && wasPaused.current) setFrozenPosition(null);
    wasPaused.current = isPaused;
  }, [isPaused]);

  return {
    ref,
    style: {
      ...baseStyle,
      ...frozenPosition,
      transitionDuration: `${isPaused ? 0 : transitionDurationMs}ms`,
    },
  };
}
