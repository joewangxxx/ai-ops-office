import { demoScenario, type ArtifactCategory, type DemoScenario } from '../data/demoScenario';
import { officeLayout, type ScenePoint } from '../data/officeLayout';
import { getArtifactRoute, isArtifactCategory } from '../domain/artifactRouting';
import { ArtifactEvidenceValidationError, parseArtifactEvidence } from '../domain/artifactEvidence';
import type {
  ArtifactAcceptedPayload,
  ArtifactDeliveredPayload,
  ArtifactReceivedPayload,
  ArtifactSubmittedPayload,
  BusinessEvent,
  MotionCompletedSignal,
} from './businessEvents';

export type BusinessPose = 'atDesk' | 'walk' | 'carry';
export type MotionPhase = 'producer-to-hub' | 'producer-to-desk' | 'assignee-to-hub' | 'assignee-to-desk';

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
  causationEventId: string;
  correlationId: string;
};

export type OfficeNotification = {
  id: string;
  artifactId: string;
  assigneeDeskId: string;
  message: string;
  canAccept: boolean;
  status: 'pending_delivery' | 'available' | 'accepted' | 'completed';
  correlationId: string;
  causationEventId: string;
  acceptanceEventId?: string;
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
  epoch: number;
  revision: number;
  scenario: DemoScenario;
  actors: Record<string, OfficeActorState>;
  artifacts: Record<string, RuntimeArtifact>;
  notifications: OfficeNotification[];
  activeMotion: OfficeMotion | null;
  motionQueue: OfficeMotion[];
  nextMotionSequence: number;
  completedMotionIds: string[];
};

export type OfficeSnapshot = Omit<OfficeState, 'nextMotionSequence' | 'completedMotionIds'>;

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

export function createOfficeState(epoch = 0): OfficeState {
  return {
    epoch,
    revision: 0,
    scenario: clone(demoScenario),
    actors: createActors(),
    artifacts: {},
    notifications: [],
    activeMotion: null,
    motionQueue: [],
    nextMotionSequence: 1,
    completedMotionIds: [],
  };
}

export function toOfficeSnapshot(state: OfficeState): OfficeSnapshot {
  const { nextMotionSequence: _internal, completedMotionIds: _completed, ...snapshot } = clone(state);
  return snapshot;
}

export function hydrateOfficeState(snapshot: OfficeSnapshot): OfficeState {
  return {
    ...clone(snapshot),
    actors: createActors(),
    activeMotion: null,
    motionQueue: [],
    nextMotionSequence: 1,
    completedMotionIds: [],
  };
}

export type ApplyMode = 'live' | 'recovery';
export type ApplyBusinessEventOptions = { mode?: ApplyMode };

function nextMotion(
  state: OfficeState,
  phase: MotionPhase,
  deskId: string,
  artifactId: string,
  pose: Exclude<BusinessPose, 'atDesk'>,
  waypoints: ScenePoint[],
  causationEventId: string,
  correlationId: string,
): OfficeMotion {
  const motion: OfficeMotion = {
    id: `motion-${state.nextMotionSequence}`,
    phase,
    deskId,
    artifactId,
    pose,
    waypoints: clone(waypoints),
    transitionDurationMs: 340,
    causationEventId,
    correlationId,
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

function addLatestHandoff(state: OfficeState, summary: string, occurredAt: string) {
  const now = new Date(occurredAt);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  state.scenario.handoffs = [{ time, summary }, ...state.scenario.handoffs].slice(0, 3);
}

function scenarioArtifact(state: OfficeState, artifactId: string) {
  const artifact = state.scenario.artifacts.find((item) => item.id === artifactId);
  if (!artifact) throw new OfficeDomainError(404, `Unknown artifact: ${artifactId}`);
  return artifact;
}

function registerSubmittedArtifact(
  state: OfficeState,
  event: ArtifactSubmittedPayload,
  causationEventId: string,
  correlationId: string,
  mode: ApplyMode,
) {
  if (typeof event.artifact.id !== 'string' || !event.artifact.id.trim()) {
    throw new OfficeDomainError(400, 'Artifact ID is required');
  }
  if (typeof event.artifact.title !== 'string' || !event.artifact.title.trim()) {
    throw new OfficeDomainError(400, 'Artifact title is required');
  }
  if (!isArtifactCategory(event.artifact.category)) {
    throw new OfficeDomainError(400, `Invalid artifact category: ${String(event.artifact.category)}`);
  }
  let evidence;
  try {
    evidence = parseArtifactEvidence(event.artifact.category, event.artifact.evidence);
  } catch (reason) {
    if (reason instanceof ArtifactEvidenceValidationError) throw new OfficeDomainError(400, reason.message);
    throw reason;
  }
  const producer = onlineDesk(event.producerDeskId);
  const assignee = onlineDesk(event.assigneeDeskId);
  const businessRoute = getArtifactRoute(event.artifact.category);
  if (producer.workspaceId !== businessRoute.producerWorkspaceId || assignee.workspaceId !== businessRoute.assigneeWorkspaceId) {
    throw new OfficeDomainError(409, `Invalid ${event.artifact.category} route: ${event.producerDeskId} -> ${event.assigneeDeskId}`);
  }
  if (state.scenario.artifacts.some((item) => item.id === event.artifact.id)) {
    throw new OfficeDomainError(409, `Artifact already exists: ${event.artifact.id}`);
  }

  const workspace = state.scenario.workspaces.find((item) => item.workspaceId === producer.workspaceId)!;
  workspace.todayOutput[0]?.artifactIds.push(event.artifact.id);
  state.scenario.artifacts.push({
    ...event.artifact,
    evidence,
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
    correlationId,
    causationEventId,
  });

  if (mode === 'live') {
    const route = officeLayout.handoffAnchors.routesByDesk[event.producerDeskId]!;
    enqueueMotion(state, nextMotion(state, 'producer-to-hub', event.producerDeskId, event.artifact.id, 'carry', route.toHub, causationEventId, correlationId));
  }
}

function acceptArtifact(
  state: OfficeState,
  event: ArtifactAcceptedPayload,
  eventId: string,
  causationId: string,
  correlationId: string,
  mode: ApplyMode,
) {
  onlineDesk(event.assigneeDeskId);
  const artifact = state.artifacts[event.artifactId];
  if (!artifact) throw new OfficeDomainError(404, `Unknown artifact: ${event.artifactId}`);
  if (artifact.assigneeDeskId !== event.assigneeDeskId) throw new OfficeDomainError(409, 'Artifact is assigned to another desk');
  const notification = state.notifications.find((item) => item.artifactId === event.artifactId)!;
  if (!notification?.canAccept || notification.status !== 'available') throw new OfficeDomainError(409, 'Artifact is not available for acceptance');
  if (notification.correlationId !== correlationId || notification.causationEventId !== causationId) {
    throw new OfficeDomainError(409, 'Artifact acceptance causal chain does not match');
  }

  notification.canAccept = false;
  notification.status = 'accepted';
  notification.acceptanceEventId = eventId;
  artifact.status = 'Collecting';
  scenarioArtifact(state, event.artifactId).status = 'Collecting';
  if (mode === 'live') {
    const route = officeLayout.handoffAnchors.routesByDesk[event.assigneeDeskId]!;
    enqueueMotion(state, nextMotion(state, 'assignee-to-hub', event.assigneeDeskId, event.artifactId, 'walk', route.toHub, eventId, correlationId));
  }
}

function deliverArtifact(
  state: OfficeState,
  event: ArtifactDeliveredPayload,
  eventId: string,
  causationEventId: string,
  correlationId: string,
  occurredAt: string,
  mode: ApplyMode,
) {
  const artifact = state.artifacts[event.artifactId];
  if (!artifact) throw new OfficeDomainError(404, `Unknown artifact: ${event.artifactId}`);
  if (artifact.producerDeskId !== event.producerDeskId) throw new OfficeDomainError(409, 'Artifact producer does not match');
  const motion = state.activeMotion;
  const notification = state.notifications.find((item) => item.artifactId === artifact.id)!;
  if (mode === 'live' && (!motion || motion.phase !== 'producer-to-hub' || motion.artifactId !== event.artifactId)) {
    throw new OfficeDomainError(409, 'Artifact is not awaiting Hub delivery');
  }
  const expectedCausation = mode === 'live' ? motion?.causationEventId : notification.causationEventId;
  const expectedCorrelation = mode === 'live' ? motion?.correlationId : notification.correlationId;
  if (expectedCausation !== causationEventId || expectedCorrelation !== correlationId) {
    throw new OfficeDomainError(409, 'Artifact delivery causal chain does not match');
  }
  const scenarioEntry = scenarioArtifact(state, event.artifactId);
  artifact.location = 'hub';
  artifact.status = 'Awaiting Acceptance';
  delete artifact.deskId;
  scenarioEntry.status = 'Awaiting Acceptance';
  if (!state.scenario.hubArtifactIds[artifact.category].includes(artifact.id)) {
    state.scenario.hubArtifactIds[artifact.category].push(artifact.id);
  }
  notification.canAccept = true;
  notification.status = 'available';
  notification.causationEventId = eventId;
  addLatestHandoff(state, `${actorName(event.producerDeskId)} delivered ${artifact.title} to Artifact Hub`, occurredAt);
  if (mode === 'live' && motion) {
    const route = officeLayout.handoffAnchors.routesByDesk[motion.deskId]!;
    state.activeMotion = null;
    activateMotion(state, nextMotion(state, 'producer-to-desk', motion.deskId, artifact.id, 'walk', route.fromHub, eventId, correlationId));
  }
}

function receiveArtifact(
  state: OfficeState,
  event: ArtifactReceivedPayload,
  causationEventId: string,
  correlationId: string,
  occurredAt: string,
  mode: ApplyMode,
) {
  onlineDesk(event.assigneeDeskId);
  const artifact = state.artifacts[event.artifactId];
  if (!artifact) throw new OfficeDomainError(404, `Unknown artifact: ${event.artifactId}`);
  if (artifact.assigneeDeskId !== event.assigneeDeskId) throw new OfficeDomainError(409, 'Artifact is assigned to another desk');
  const motion = state.activeMotion;
  if (mode === 'live' && (!motion || motion.phase !== 'assignee-to-desk' || motion.artifactId !== event.artifactId || motion.deskId !== event.assigneeDeskId)) {
    throw new OfficeDomainError(409, 'Artifact is not awaiting desk receipt');
  }
  const notification = state.notifications.find((item) => item.artifactId === artifact.id)!;
  const expectedCausation = mode === 'live' ? motion?.causationEventId : notification.acceptanceEventId;
  if (expectedCausation !== causationEventId || notification.correlationId !== correlationId) {
    throw new OfficeDomainError(409, 'Artifact receipt causal chain does not match');
  }
  const scenarioEntry = scenarioArtifact(state, event.artifactId);
  artifact.location = 'desk';
  artifact.status = 'Accepted';
  artifact.deskId = event.assigneeDeskId;
  state.scenario.hubArtifactIds[artifact.category] = state.scenario.hubArtifactIds[artifact.category].filter((id) => id !== artifact.id);
  scenarioEntry.status = 'Accepted';
  scenarioEntry.acceptedBy = actorName(event.assigneeDeskId);
  notification.status = 'completed';
  notification.canAccept = false;
  const person = state.scenario.people.find((item) => item.deskId === event.assigneeDeskId)!;
  if (!person.activeWorks.some((work) => work.sourceArtifactId === artifact.id)) {
    person.activeWorks.push({ id: `active-work-${artifact.id}`, title: `Working on ${artifact.title}`, sourceArtifactId: artifact.id, status: 'active' });
  }
  addLatestHandoff(state, `${actorName(event.assigneeDeskId)} accepted ${artifact.title}`, occurredAt);
  if (mode === 'live') finishActiveMotion(state);
}

export function applyBusinessEvent(state: OfficeState, event: BusinessEvent, options: ApplyBusinessEventOptions = {}): OfficeState {
  const mode = options.mode ?? 'live';
  if (event.eventType === 'projection.reset') {
    const reset = createOfficeState(state.epoch + 1);
    reset.revision = 1;
    return reset;
  }

  const next = clone(state);
  switch (event.eventType) {
    case 'artifact.submitted':
      registerSubmittedArtifact(next, event.payload, event.eventId, event.correlationId, mode);
      break;
    case 'artifact.delivered':
      deliverArtifact(next, event.payload, event.eventId, event.causationId ?? '', event.correlationId, event.occurredAt, mode);
      break;
    case 'artifact.accepted':
      acceptArtifact(next, event.payload, event.eventId, event.causationId ?? '', event.correlationId, mode);
      break;
    case 'artifact.received':
      receiveArtifact(next, event.payload, event.causationId ?? '', event.correlationId, event.occurredAt, mode);
      break;
  }
  next.revision += 1;
  return next;
}

export function reconcileIncompleteHandoffs(state: OfficeState): OfficeState {
  const next = clone(state);
  next.actors = createActors();
  next.activeMotion = null;
  next.motionQueue = [];
  next.nextMotionSequence = 1;
  next.completedMotionIds = [];
  for (const scenarioEntry of next.scenario.artifacts) {
    const artifact = next.artifacts[scenarioEntry.id];
    if (!artifact) continue;
    const notification = next.notifications.find((item) => item.artifactId === artifact.id);
    if (!notification) continue;
    if (artifact.status === 'Delivering') {
      const route = officeLayout.handoffAnchors.routesByDesk[artifact.producerDeskId]!;
      enqueueMotion(next, nextMotion(next, 'producer-to-hub', artifact.producerDeskId, artifact.id, 'carry', route.toHub, notification.causationEventId, notification.correlationId));
    } else if (artifact.status === 'Collecting' && notification.acceptanceEventId) {
      const route = officeLayout.handoffAnchors.routesByDesk[artifact.assigneeDeskId]!;
      enqueueMotion(next, nextMotion(next, 'assignee-to-hub', artifact.assigneeDeskId, artifact.id, 'walk', route.toHub, notification.acceptanceEventId, notification.correlationId));
    }
  }
  return next;
}

export type AppliedRuntimeEvent = { state: OfficeState; derivedEvent?: BusinessEvent };

export function applyRuntimeEvent(
  state: OfficeState,
  signal: MotionCompletedSignal,
  occurredAt = new Date().toISOString(),
): AppliedRuntimeEvent {
  if (state.completedMotionIds.includes(signal.motionId)) return { state: clone(state) };
  const motion = state.activeMotion;
  if (!motion || motion.id !== signal.motionId) throw new OfficeDomainError(409, `Motion is not active: ${signal.motionId}`);

  if (motion.phase === 'producer-to-hub') {
    const derivedEvent: BusinessEvent = {
      eventId: `${motion.causationEventId}:delivered`,
      eventType: 'artifact.delivered',
      schemaVersion: '1.0',
      occurredAt,
      correlationId: motion.correlationId,
      causationId: motion.causationEventId,
      source: { system: 'office-runtime' },
      payload: { artifactId: motion.artifactId, producerDeskId: motion.deskId },
    };
    const next = applyBusinessEvent(state, derivedEvent);
    next.completedMotionIds.push(signal.motionId);
    return { state: next, derivedEvent };
  }

  if (motion.phase === 'assignee-to-desk') {
    const derivedEvent: BusinessEvent = {
      eventId: `${motion.causationEventId}:received`,
      eventType: 'artifact.received',
      schemaVersion: '1.0',
      occurredAt,
      correlationId: motion.correlationId,
      causationId: motion.causationEventId,
      source: { system: 'office-runtime' },
      payload: { artifactId: motion.artifactId, assigneeDeskId: motion.deskId },
    };
    const next = applyBusinessEvent(state, derivedEvent);
    next.completedMotionIds.push(signal.motionId);
    return { state: next, derivedEvent };
  }

  const next = clone(state);
  if (motion.phase === 'producer-to-desk') {
    finishActiveMotion(next);
  } else {
    const artifact = next.artifacts[motion.artifactId]!;
    const route = officeLayout.handoffAnchors.routesByDesk[motion.deskId]!;
    const carryMotion = nextMotion(
      next,
      'assignee-to-desk',
      motion.deskId,
      artifact.id,
      'carry',
      route.fromHub,
      motion.causationEventId,
      motion.correlationId,
    );
    artifact.location = 'carrier';
    artifact.deskId = motion.deskId;
    next.activeMotion = null;
    activateMotion(next, carryMotion);
  }
  next.completedMotionIds.push(signal.motionId);
  next.revision += 1;
  return { state: next };
}
