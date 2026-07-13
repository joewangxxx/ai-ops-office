import { useEffect, useState } from 'react';
import type { ScenePoint } from '../data/officeLayout';
import type { StoryActor, StoryMotion } from '../story/prdHandoffStory';

function pointKey(point: ScenePoint) {
  return `${point.x}-${point.y}`;
}

export function useStoryActorPosition(actor: StoryActor, motion: StoryMotion | undefined, isPaused: boolean, prefersReducedMotion: boolean) {
  const actorMotion = motion?.actorId === actor.id ? motion : undefined;
  const motionKey = actorMotion
    ? `${actor.id}-${actorMotion.waypoints.map(pointKey).join(':')}`
    : `${actor.id}-${actor.pose}-${pointKey(actor.coordinate)}`;
  const initialPoint = actorMotion && !prefersReducedMotion ? actorMotion.waypoints[0] : actorMotion?.waypoints.at(-1) ?? actor.coordinate;
  const [position, setPosition] = useState<ScenePoint>(initialPoint);
  const [waypointIndex, setWaypointIndex] = useState(0);

  useEffect(() => {
    setWaypointIndex(0);
    setPosition(actorMotion && !prefersReducedMotion ? actorMotion.waypoints[0] : actorMotion?.waypoints.at(-1) ?? actor.coordinate);
  }, [actorMotion, actor.coordinate, motionKey, prefersReducedMotion]);

  useEffect(() => {
    if (!actorMotion || prefersReducedMotion || isPaused || waypointIndex >= actorMotion.waypoints.length - 1) return undefined;
    const timeout = window.setTimeout(() => {
      const nextWaypoint = waypointIndex + 1;
      setWaypointIndex(nextWaypoint);
      setPosition(actorMotion.waypoints[nextWaypoint]);
    }, actorMotion.transitionDurationMs);
    return () => window.clearTimeout(timeout);
  }, [actorMotion, isPaused, motionKey, prefersReducedMotion, waypointIndex]);

  return position;
}
