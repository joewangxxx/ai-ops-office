import { demoScenario, type ArtifactCategory, type DemoScenario } from '../data/demoScenario';
import { officeLayout, type ScenePoint } from '../data/officeLayout';

export type ArtifactCompletedEvent = {
  type: 'artifact.completed';
  artifact: { id: string; category: ArtifactCategory; title: string };
  producerDeskId: string;
  assigneeDeskId: string;
};

export type ArtifactAcceptedEvent = {
  type: 'artifact.accepted';
  artifactId: string;
  assigneeDeskId: string;
};

export type MotionCompletedEvent = { type: 'motion.completed'; motionId: string };
export type OfficeEvent = ArtifactCompletedEvent | ArtifactAcceptedEvent | MotionCompletedEvent;
export type BusinessPose = 'atDesk' | 'walk' | 'carry';
export type MotionPhase = 'producer-to-hub' | 'assignee-to-hub' | 'assignee-to-desk';

export type OfficeActorState = {
  deskId: string;
  pose: BusinessPose;
  coordinate: ScenePoint;
};

export type OfficeMotion = {
  id: string;
  phase: MotionPhase;
  deskId: string;
  artifactId: string;
  pose: Exclude<BusinessPose, 'atDesk'>;
  waypoints: ScenePoint[];
  transitionDurationMs: number;
};

export type OfficeNotification = {
  id: string;
  artifactId: string;
  assigneeDeskId: string;
  message: string;
  canAccept: boolean;
  status: 'pending_delivery' | 'available' | 'accepted' | 'completed';
};

export type RuntimeArtifact = {
  id: string;
  category: ArtifactCategory;
  title: string;
  producerDeskId: string;
  assigneeDeskId: string;
  location: 'carrier' | 'hub' | 'desk';
  status: string;
  deskId?: string;
};

export type OfficeState = {
  revision: number;
  scenario: DemoScenario;
  actors: Record<string, OfficeActorState>;
  artifacts: Record<string, RuntimeArtifact>;
  notifications: OfficeNotification[];
  activeMotion: OfficeMotion | null;
  motionQueue: OfficeMotion[];
  nextMotionSequence: number;
};

export type OfficeSnapshot = Omit<OfficeState, 'nextMotionSequence'>;

export class OfficeDomainError extends Error {
  constructor(public readonly status: 400 | 404 | 409, message: string) {
    super(message);
    this.name = 'OfficeDomainError';
  }
}

const clone = <T,>(value: T): T => structuredClone(value);

function onlineDesk(deskId: string) {
  const desk = officeLayout.desks.find((item) => item.id === deskId);
  if (!desk) throw new OfficeDomainError(404, `Unknown desk: ${deskId}`);
  if (!desk.online || !desk.occupant.avatarKey) throw new OfficeDomainError(409, `Desk is offline: ${deskId}`);
  if (!officeLayout.handoffAnchors.routesByDesk[deskId]) throw new OfficeDomainError(409, `Desk has no handoff route: ${deskId}`);
  return desk;
}

function actorName(deskId: string) {
  return onlineDesk(deskId).occupant.displayName;
}

function createActors(): Record<string, OfficeActorState> {
  return Object.fromEntries(
    officeLayout.desks
      .filter((desk) => desk.online && desk.occupant.avatarKey)
      .map((desk) => [desk.id, { deskId: desk.id, pose: 'atDesk' as const, coordinate: clone(desk.avatarAnchor) }]),
  );
}

export function createOfficeState(): OfficeState {
  return {
    revision: 0,
    scenario: clone(demoScenario),
    actors: createActors(),
    artifacts: {},
    notifications: [],
    activeMotion: null,
    motionQueue: [],
    nextMotionSequence: 1,
  };
}

export function toOfficeSnapshot(state: OfficeState): OfficeSnapshot {
  const { nextMotionSequence: _internal, ...snapshot } = clone(state);
  return snapshot;
}

function nextMotion(
  state: OfficeState,
  phase: MotionPhase,
  deskId: string,
  artifactId: string,
  pose: Exclude<BusinessPose, 'atDesk'>,
  waypoints: ScenePoint[],
): OfficeMotion {
  const motion: OfficeMotion = {
    id: `motion-${state.nextMotionSequence}`,
    phase,
    deskId,
    artifactId,
    pose,
    waypoints: clone(waypoints),
    transitionDurationMs: 340,
  };
  state.nextMotionSequence += 1;
  return motion;
}

function activateMotion(state: OfficeState, motion: OfficeMotion) {
  state.activeMotion = motion;
  state.actors[motion.deskId] = {
    deskId: motion.deskId,
    pose: motion.pose,
    coordinate: clone(motion.waypoints[0]!),
  };
}

function enqueueMotion(state: OfficeState, motion: OfficeMotion) {
  if (state.activeMotion) state.motionQueue.push(motion);
  else activateMotion(state, motion);
}

function finishActiveMotion(state: OfficeState) {
  const motion = state.activeMotion!;
  const desk = onlineDesk(motion.deskId);
  state.actors[motion.deskId] = { deskId: motion.deskId, pose: 'atDesk', coordinate: clone(desk.avatarAnchor) };
  state.activeMotion = null;
  const queued = state.motionQueue.shift();
  if (queued) activateMotion(state, queued);
}

function scenarioArtifact(state: OfficeState, artifactId: string) {
  const artifact = state.scenario.artifacts.find((item) => item.id === artifactId);
  if (!artifact) throw new OfficeDomainError(404, `Unknown artifact: ${artifactId}`);
  return artifact;
}

function registerCompletedArtifact(state: OfficeState, event: ArtifactCompletedEvent) {
  const producer = onlineDesk(event.producerDeskId);
  const assignee = onlineDesk(event.assigneeDeskId);
  if (state.scenario.artifacts.some((item) => item.id === event.artifact.id)) {
    throw new OfficeDomainError(409, `Artifact already exists: ${event.artifact.id}`);
  }

  const workspace = state.scenario.workspaces.find((item) => item.workspaceId === producer.workspaceId)!;
  workspace.todayOutput[0]?.artifactIds.push(event.artifact.id);
  state.scenario.artifacts.push({
    ...event.artifact,
    status: 'Delivering',
    submittedBy: producer.occupant.displayName,
    confirmedBy: 'Pending',
    acceptedBy: 'Pending',
  });
  state.artifacts[event.artifact.id] = {
    ...event.artifact,
    producerDeskId: event.producerDeskId,
    assigneeDeskId: event.assigneeDeskId,
    location: 'carrier',
    status: 'Delivering',
    deskId: event.producerDeskId,
  };
  state.notifications.push({
    id: `notification-${event.artifact.id}`,
    artifactId: event.artifact.id,
    assigneeDeskId: event.assigneeDeskId,
    message: `${event.artifact.title} assigned to ${assignee.occupant.displayName}`,
    canAccept: false,
    status: 'pending_delivery',
  });

  const route = officeLayout.handoffAnchors.routesByDesk[event.producerDeskId]!;
  enqueueMotion(state, nextMotion(state, 'producer-to-hub', event.producerDeskId, event.artifact.id, 'carry', route.toHub));
}

function acceptArtifact(state: OfficeState, event: ArtifactAcceptedEvent) {
  onlineDesk(event.assigneeDeskId);
  const artifact = state.artifacts[event.artifactId];
  if (!artifact) throw new OfficeDomainError(404, `Unknown artifact: ${event.artifactId}`);
  if (artifact.assigneeDeskId !== event.assigneeDeskId) throw new OfficeDomainError(409, 'Artifact is assigned to another desk');
  const notification = state.notifications.find((item) => item.artifactId === event.artifactId)!;
  if (!notification?.canAccept || notification.status !== 'available') throw new OfficeDomainError(409, 'Artifact is not available for acceptance');

  notification.canAccept = false;
  notification.status = 'accepted';
  artifact.status = 'Collecting';
  scenarioArtifact(state, event.artifactId).status = 'Collecting';
  const route = officeLayout.handoffAnchors.routesByDesk[event.assigneeDeskId]!;
  enqueueMotion(state, nextMotion(state, 'assignee-to-hub', event.assigneeDeskId, event.artifactId, 'walk', route.toHub));
}

function completeMotion(state: OfficeState, event: MotionCompletedEvent) {
  const motion = state.activeMotion;
  if (!motion || motion.id !== event.motionId) throw new OfficeDomainError(409, `Motion is not active: ${event.motionId}`);
  const artifact = state.artifacts[motion.artifactId]!;
  const scenarioEntry = scenarioArtifact(state, motion.artifactId);

  if (motion.phase === 'producer-to-hub') {
    artifact.location = 'hub';
    artifact.status = 'Awaiting Acceptance';
    delete artifact.deskId;
    scenarioEntry.status = 'Awaiting Acceptance';
    state.scenario.hubArtifactIds[artifact.category].push(artifact.id);
    const notification = state.notifications.find((item) => item.artifactId === artifact.id)!;
    notification.canAccept = true;
    notification.status = 'available';
    state.scenario.handoffs.unshift({ time: 'Now', summary: `${actorName(motion.deskId)} delivered ${artifact.title} to Artifact Hub` });
    finishActiveMotion(state);
    return;
  }

  if (motion.phase === 'assignee-to-hub') {
    const route = officeLayout.handoffAnchors.routesByDesk[motion.deskId]!;
    const carryMotion = nextMotion(state, 'assignee-to-desk', motion.deskId, artifact.id, 'carry', route.fromHub);
    state.actors[motion.deskId] = { deskId: motion.deskId, pose: 'atDesk', coordinate: clone(onlineDesk(motion.deskId).avatarAnchor) };
    state.activeMotion = null;
    activateMotion(state, carryMotion);
    return;
  }

  artifact.location = 'desk';
  artifact.status = 'Accepted';
  artifact.deskId = motion.deskId;
  scenarioEntry.status = 'Accepted';
  scenarioEntry.acceptedBy = actorName(motion.deskId);
  state.scenario.hubArtifactIds[artifact.category] = state.scenario.hubArtifactIds[artifact.category].filter((id) => id !== artifact.id);
  const notification = state.notifications.find((item) => item.artifactId === artifact.id)!;
  notification.status = 'completed';
  notification.canAccept = false;
  const person = state.scenario.people.find((item) => item.deskId === motion.deskId)!;
  person.inputArtifact = artifact.title;
  person.currentTask = `Working on ${artifact.title}`;
  state.scenario.handoffs.unshift({ time: 'Now', summary: `${actorName(motion.deskId)} accepted ${artifact.title}` });
  finishActiveMotion(state);
}

export function applyOfficeEvent(state: OfficeState, event: OfficeEvent): OfficeState {
  const next = clone(state);
  switch (event.type) {
    case 'artifact.completed':
      registerCompletedArtifact(next, event);
      break;
    case 'artifact.accepted':
      acceptArtifact(next, event);
      break;
    case 'motion.completed':
      completeMotion(next, event);
      break;
    default:
      throw new OfficeDomainError(400, 'Unsupported office event');
  }
  next.revision += 1;
  return next;
}
