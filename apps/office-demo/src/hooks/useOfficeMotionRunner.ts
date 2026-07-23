import { useEffect, useMemo, useRef, useState } from 'react';
import type { MotionCompletedSignal } from '../backend/businessEvents';
import type { OfficeMotion } from '../backend/officeDomain';
import { directionBetween, type MovementDirection } from '../utils/avatarPresentation';

export type MotionPresentation = {
  motionId: string;
  deskId: string;
  pose: 'walk' | 'carry';
  coordinate: { x: number; y: number };
  direction: MovementDirection;
  transitionDurationMs: number;
};

const MOTION_CONFIRM_RETRY_MS = 500;

export function useOfficeMotionRunner(
  motion: OfficeMotion | null,
  postRuntimeEvent: (event: MotionCompletedSignal) => Promise<unknown>,
  reducedMotion: boolean,
): MotionPresentation | null {
  const [progress, setProgress] = useState<{ motionId: string | null; waypointIndex: number }>({ motionId: null, waypointIndex: 0 });
  const completedMotionIds = useRef(new Set<string>());
  const postRuntimeEventRef = useRef(postRuntimeEvent);
  const motionId = motion?.id ?? null;
  const transitionDurationMs = motion?.transitionDurationMs ?? 0;
  const waypointCount = motion?.waypoints.length ?? 0;
  const waypointIndex = progress.motionId === motionId ? progress.waypointIndex : 0;

  useEffect(() => {
    postRuntimeEventRef.current = postRuntimeEvent;
  }, [postRuntimeEvent]);

  useEffect(() => {
    if (!motionId) {
      setProgress({ motionId: null, waypointIndex: 0 });
      return;
    }
    setProgress((current) => current.motionId === motionId ? current : { motionId, waypointIndex: 0 });
  }, [motionId]);

  useEffect(() => {
    if (!motionId || progress.motionId !== motionId) return undefined;
    const lastIndex = waypointCount - 1;
    if (lastIndex < 1) return undefined;

    let retryTimer: number | undefined;
    let cancelled = false;
    const confirmMotion = () => {
      if (completedMotionIds.current.has(motionId)) return;
      void postRuntimeEventRef.current({ type: 'motion.completed', motionId })
        .then(() => { completedMotionIds.current.add(motionId); })
        .catch(() => {
          if (!cancelled) retryTimer = window.setTimeout(confirmMotion, MOTION_CONFIRM_RETRY_MS);
        });
    };

    if (reducedMotion) {
      if (waypointIndex < lastIndex) {
        setProgress({ motionId, waypointIndex: lastIndex });
        return undefined;
      }
      confirmMotion();
      return () => { cancelled = true; if (retryTimer !== undefined) window.clearTimeout(retryTimer); };
    }

    if (waypointIndex < lastIndex) {
      const delay = waypointIndex === 0 ? 16 : transitionDurationMs;
      const timer = window.setTimeout(() => {
        setProgress({ motionId, waypointIndex: waypointIndex + 1 });
      }, delay);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      confirmMotion();
    }, transitionDurationMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [motionId, progress.motionId, reducedMotion, transitionDurationMs, waypointCount, waypointIndex]);

  return useMemo(() => {
    if (!motion || motion.waypoints.length < 2) return null;
    const index = Math.min(waypointIndex, motion.waypoints.length - 1);
    const from = motion.waypoints[Math.max(0, index - 1)]!;
    const to = index === 0 ? motion.waypoints[1]! : motion.waypoints[index]!;
    const direction = directionBetween(from, to);
    if (!direction) return null;
    return {
      motionId: motion.id,
      deskId: motion.deskId,
      pose: motion.pose,
      coordinate: motion.waypoints[index]!,
      direction,
      transitionDurationMs: reducedMotion ? 0 : motion.transitionDurationMs,
    };
  }, [motion, reducedMotion, waypointIndex]);
}
