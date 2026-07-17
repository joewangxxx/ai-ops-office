export type SeatedAvatarPoseName = 'seatedIdleBack' | 'seatedWorkingBack';

export function resolveSeatedPose(hasActiveWork: boolean): SeatedAvatarPoseName {
  return hasActiveWork ? 'seatedWorkingBack' : 'seatedIdleBack';
}
