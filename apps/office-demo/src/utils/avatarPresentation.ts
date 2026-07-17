import type { ScenePoint } from '../data/officeLayout';

export type SeatedAvatarPoseName = 'seatedIdleBack' | 'seatedWorkingBack';
export type MovementDirection = 'up' | 'down' | 'horizontal';
export type MovementAvatarPoseName = 'walk' | 'carry' | 'walkUp' | 'walkDown' | 'carryUp' | 'carryDown';

export function resolveSeatedPose(hasActiveWork: boolean): SeatedAvatarPoseName {
  return hasActiveWork ? 'seatedWorkingBack' : 'seatedIdleBack';
}

export function directionBetween(from: ScenePoint, to: ScenePoint): MovementDirection {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;

  if (Math.abs(deltaY) <= Math.abs(deltaX)) return 'horizontal';
  return deltaY < 0 ? 'up' : 'down';
}

export function resolveMovementPose(
  pose: 'walk' | 'carry',
  direction: MovementDirection,
): MovementAvatarPoseName {
  if (direction === 'horizontal') return pose;
  if (pose === 'walk') return direction === 'up' ? 'walkUp' : 'walkDown';
  return direction === 'up' ? 'carryUp' : 'carryDown';
}
