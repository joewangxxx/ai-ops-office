import { useEffect, useMemo, useRef, useState } from 'react';
import type { OfficeEvent, OfficeMotion } from '../backend/officeDomain';
import { directionBetween, type MovementDirection } from '../utils/avatarPresentation';

export type MotionPresentation = {
  motionId: string;
  deskId: string;
  pose: 'walk' | 'carry';
  coordinate: { x: number; y: number };
  direction: MovementDirection;
  transitionDurationMs: number;
};

export function useOfficeMotionRunner(
  motion: OfficeMotion | null,
  postEvent: (event: OfficeEvent) => Promise<unknown>,
  reducedMotion: boolean,
): MotionPresentation | null {
  const [progress, setProgress] = useState<{ motionId: string | null; waypointIndex: number }>({ motionId: null, waypointIndex: 0 });
  const completedMotionIds = useRef(new Set<string>());
  const postEventRef = useRef(postEvent);
  const motionId = motion?.id ?? null;
  const transitionDurationMs = motion?.transitionDurationMs ?? 0;
  const waypointCount = motion?.waypoints.length ?? 0;
  const waypointIndex = progress.motionId === motionId ? progress.waypointIndex : 0;

  useEffect(() => {
    postEventRef.current = postEvent;
  }, [postEvent]);

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

    if (reducedMotion) {
      setProgress({ motionId, waypointIndex: lastIndex });
      if (!completedMotionIds.current.has(motionId)) {
        completedMotionIds.current.add(motionId);
        void postEventRef.current({ type: 'motion.completed', motionId }).catch(() => undefined);
      }
      return undefined;
    }

    if (waypointIndex < lastIndex) {
      const delay = waypointIndex === 0 ? 16 : transitionDurationMs;
      const timer = window.setTimeout(() => {
        setProgress({ motionId, waypointIndex: waypointIndex + 1 });
      }, delay);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      if (completedMotionIds.current.has(motionId)) return;
      completedMotionIds.current.add(motionId);
      void postEventRef.current({ type: 'motion.completed', motionId }).catch(() => undefined);
    }, transitionDurationMs);
    return () => window.clearTimeout(timer);
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
