import type { ScenePoint } from '../data/officeLayout';

export type SeatedAvatarPoseName = 'seatedIdleBack' | 'seatedWorkingBack';
export type MovementDirection = 'up' | 'down' | 'left' | 'right';
export type MovementAvatarPoseName =
  | 'walkUp'
  | 'walkDown'
  | 'walkLeft'
  | 'walkRight'
  | 'carryUp'
  | 'carryDown'
  | 'carryLeft'
  | 'carryRight';

export function resolveSeatedPose(): SeatedAvatarPoseName {
  return 'seatedWorkingBack';
}

export function directionBetween(from: ScenePoint, to: ScenePoint): MovementDirection | null {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;

  if (deltaX === 0 && deltaY === 0) return null;
  if (Math.abs(deltaY) <= Math.abs(deltaX)) return deltaX < 0 ? 'left' : 'right';
  return deltaY < 0 ? 'up' : 'down';
}

export function resolveMovementPose(
  pose: 'walk' | 'carry',
  direction: MovementDirection,
): MovementAvatarPoseName {
  const suffix = `${direction[0].toUpperCase()}${direction.slice(1)}` as Capitalize<MovementDirection>;
  return `${pose}${suffix}` as MovementAvatarPoseName;
}
