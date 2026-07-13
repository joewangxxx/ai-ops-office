import {
  demoScenario,
  getHubArtifactCounts,
  type DemoScenario,
  type HandoffScenario,
  type HubArtifactCount,
} from '../data/demoScenario';
import { officeLayout, type ScenePoint } from '../data/officeLayout';

export const prdHandoffStateOrder = [
  'ready',
  'pm-delivering',
  'prd-stored',
  'pm-returning',
  'dev-notified',
  'dev-collecting',
  'dev-returning',
  'dev-received',
  'dev-coding',
  'feature-ready',
  'dev-delivering-feature',
  'feature-stored',
  'dev-returning-from-hub',
  'qa-notified',
  'qa-collecting',
  'qa-returning',
  'qa-received',
  'qa-testing',
] as const;

export type OfficeStoryState = (typeof prdHandoffStateOrder)[number];
export type PrdHandoffState = OfficeStoryState;
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'complete';
export type StoryPose = 'atDesk' | 'walk' | 'carry';
export type StoryActorId = 'alice' | 'jack' | 'quinn';
export type OrbState = 'blue' | 'gray' | 'yellow';
export type StoryArtifactCategory = 'prd' | 'feature';
export type StoryArtifactLocation = 'desk' | 'carrier' | 'hub';

export type StoryActor = {
  id: StoryActorId;
  deskId: string;
  pose: StoryPose;
  coordinate: ScenePoint;
};

export type StoryMotion = {
  actorId: StoryActorId;
  waypoints: ScenePoint[];
  transitionDurationMs: number;
};

export type StoryArtifact = {
  id: 'login-requirement-prd-v1' | 'login-feature-v1';
  category: StoryArtifactCategory;
  assetKey: 'prdBlue' | 'featureGreen';
  location: StoryArtifactLocation;
  anchor: ScenePoint;
  deskId?: string;
  carrierId?: StoryActorId;
};

export type StorySignal = {
  kind: 'receiptBubble' | 'statusLabel';
  text: string;
  anchor: ScenePoint;
};

export type StoryRuntime = {
  state: OfficeStoryState;
  playbackStatus: PlaybackStatus;
  waypointIndex: number;
  autoAdvance: boolean;
};

export type StoryFrame = {
  state: OfficeStoryState;
  playbackStatus: PlaybackStatus;
  actors: StoryActor[];
  artifacts: StoryArtifact[];
  signals: StorySignal[];
  orbs: Record<StoryActorId, OrbState>;
  hub: {
    prdCount: number;
    featureCount: number;
    counts: HubArtifactCount[];
  };
  latestHandoffs: HandoffScenario[];
  motion?: StoryMotion;
  autoAdvanceDelayMs: number;
};

const aliceDesk = officeLayout.desks.find((desk) => desk.id === 'pm-alice')!;
const jackDesk = officeLayout.desks.find((desk) => desk.id === 'dev-jack')!;
const quinnDesk = officeLayout.desks.find((desk) => desk.id === 'qa-quinn')!;
const {
  consumerRoute,
  devProducerRoute,
  producerRoute,
  qaConsumerRoute,
} = officeLayout.handoffAnchors;

const actorDeskById = {
  alice: aliceDesk,
  jack: jackDesk,
  quinn: quinnDesk,
} as const;

const aliceSubmitted: HandoffScenario = { time: '10:26', summary: 'Alice submitted Login Requirement PRD to Artifact Hub' };
const jackAccepted: HandoffScenario = { time: '10:29', summary: 'Jack accepted Login Requirement PRD from Artifact Hub' };
const jackSubmittedFeature: HandoffScenario = { time: '10:36', summary: 'Jack submitted Login Feature to Artifact Hub' };
const quinnAcceptedFeature: HandoffScenario = { time: '10:39', summary: 'Quinn accepted Login Feature from Artifact Hub' };

const stateIndex = (state: OfficeStoryState) => prdHandoffStateOrder.indexOf(state);
const isAtOrAfter = (state: OfficeStoryState, target: OfficeStoryState) => stateIndex(state) >= stateIndex(target);

function actorAtDesk(id: StoryActorId): StoryActor {
  const desk = actorDeskById[id];
  return { id, deskId: desk.id, pose: 'atDesk', coordinate: desk.seatAnchor };
}

function actorMoving(id: StoryActorId, pose: Exclude<StoryPose, 'atDesk'>, coordinate: ScenePoint): StoryActor {
  return { id, deskId: actorDeskById[id].id, pose, coordinate };
}

function storyMotionFor(state: OfficeStoryState): StoryMotion | undefined {
  switch (state) {
    case 'pm-delivering':
      return { actorId: 'alice', waypoints: [aliceDesk.avatarAnchor, producerRoute.deskExit, producerRoute.staging, producerRoute.hubApproach], transitionDurationMs: 340 };
    case 'pm-returning':
      return { actorId: 'alice', waypoints: [producerRoute.hubApproach, producerRoute.staging, producerRoute.deskExit, producerRoute.deskReturn], transitionDurationMs: 340 };
    case 'dev-collecting':
      return { actorId: 'jack', waypoints: [jackDesk.avatarAnchor, consumerRoute.deskExit, consumerRoute.staging, consumerRoute.hubApproach], transitionDurationMs: 340 };
    case 'dev-returning':
      return { actorId: 'jack', waypoints: [consumerRoute.hubApproach, consumerRoute.staging, consumerRoute.deskExit, consumerRoute.deskReturn], transitionDurationMs: 340 };
    case 'dev-delivering-feature':
      return { actorId: 'jack', waypoints: [jackDesk.avatarAnchor, devProducerRoute.deskExit, devProducerRoute.staging, devProducerRoute.hubApproach], transitionDurationMs: 340 };
    case 'dev-returning-from-hub':
      return { actorId: 'jack', waypoints: [devProducerRoute.hubApproach, devProducerRoute.staging, devProducerRoute.deskExit, devProducerRoute.deskReturn], transitionDurationMs: 340 };
    case 'qa-collecting':
      return { actorId: 'quinn', waypoints: [quinnDesk.avatarAnchor, qaConsumerRoute.deskExit, qaConsumerRoute.staging, qaConsumerRoute.hubApproach], transitionDurationMs: 340 };
    case 'qa-returning':
      return { actorId: 'quinn', waypoints: [qaConsumerRoute.hubApproach, qaConsumerRoute.staging, qaConsumerRoute.deskExit, qaConsumerRoute.deskReturn], transitionDurationMs: 340 };
    default:
      return undefined;
  }
}

function waypointFor(runtime: StoryRuntime, motion: StoryMotion) {
  return motion.waypoints[Math.min(runtime.waypointIndex, motion.waypoints.length - 1)]!;
}

function actorsFor(runtime: StoryRuntime, motion: StoryMotion | undefined): StoryActor[] {
  const actors = [actorAtDesk('alice'), actorAtDesk('jack'), actorAtDesk('quinn')];
  const replaceActor = (actor: StoryActor) => {
    const index = actors.findIndex((item) => item.id === actor.id);
    actors[index] = actor;
  };

  if (motion) {
    const pose = runtime.state === 'pm-delivering' || runtime.state === 'dev-returning' || runtime.state === 'dev-delivering-feature' || runtime.state === 'qa-returning' ? 'carry' : 'walk';
    replaceActor(actorMoving(motion.actorId, pose, waypointFor(runtime, motion)));
    return actors;
  }

  if (runtime.state === 'prd-stored') replaceActor(actorMoving('alice', 'walk', producerRoute.hubApproach));
  if (runtime.state === 'feature-stored') replaceActor(actorMoving('jack', 'walk', devProducerRoute.hubApproach));
  return actors;
}

function artifactSlot(assetKey: StoryArtifact['assetKey']) {
  const wantedKey = `artifact.${assetKey}`;
  return officeLayout.artifactHub.artifactSlots.find((slot) => slot.assetKey === wantedKey)?.anchor
    ?? officeLayout.handoffAnchors.hubDropPoint;
}

function carrierAnchor(actor: StoryActor, actorId: StoryActorId) {
  const offset = officeLayout.handoffAnchors.carriedArtifactOffsets[actorId];
  return { x: actor.coordinate.x + offset.x, y: actor.coordinate.y + offset.y };
}

function deskArtifact(id: StoryArtifact['id'], category: StoryArtifactCategory, assetKey: StoryArtifact['assetKey'], deskId: string): StoryArtifact {
  const anchorKey = deskId === aliceDesk.id ? 'aliceDesk' : deskId === jackDesk.id ? 'jackDesk' : 'quinnDesk';
  return { id, category, assetKey, location: 'desk', deskId, anchor: officeLayout.handoffAnchors.artifactAnchors[anchorKey] };
}

function carrierArtifact(id: StoryArtifact['id'], category: StoryArtifactCategory, assetKey: StoryArtifact['assetKey'], carrierId: StoryActorId, actors: StoryActor[]): StoryArtifact {
  const actor = actors.find((item) => item.id === carrierId)!;
  return { id, category, assetKey, location: 'carrier', carrierId, anchor: carrierAnchor(actor, carrierId) };
}

function hubArtifact(id: StoryArtifact['id'], category: StoryArtifactCategory, assetKey: StoryArtifact['assetKey']): StoryArtifact {
  return { id, category, assetKey, location: 'hub', anchor: artifactSlot(assetKey) };
}

function artifactsFor(state: OfficeStoryState, actors: StoryActor[]): StoryArtifact[] {
  const artifacts: StoryArtifact[] = [];
  if (state === 'ready') artifacts.push(deskArtifact('login-requirement-prd-v1', 'prd', 'prdBlue', aliceDesk.id));
  else if (state === 'pm-delivering') artifacts.push(carrierArtifact('login-requirement-prd-v1', 'prd', 'prdBlue', 'alice', actors));
  else if (state === 'dev-returning') artifacts.push(carrierArtifact('login-requirement-prd-v1', 'prd', 'prdBlue', 'jack', actors));
  else if (isAtOrAfter(state, 'dev-received')) artifacts.push(deskArtifact('login-requirement-prd-v1', 'prd', 'prdBlue', jackDesk.id));
  else artifacts.push(hubArtifact('login-requirement-prd-v1', 'prd', 'prdBlue'));

  if (isAtOrAfter(state, 'feature-ready')) {
    if (state === 'feature-ready') artifacts.push(deskArtifact('login-feature-v1', 'feature', 'featureGreen', jackDesk.id));
    else if (state === 'dev-delivering-feature') artifacts.push(carrierArtifact('login-feature-v1', 'feature', 'featureGreen', 'jack', actors));
    else if (state === 'qa-returning') artifacts.push(carrierArtifact('login-feature-v1', 'feature', 'featureGreen', 'quinn', actors));
    else if (isAtOrAfter(state, 'qa-received')) artifacts.push(deskArtifact('login-feature-v1', 'feature', 'featureGreen', quinnDesk.id));
    else artifacts.push(hubArtifact('login-feature-v1', 'feature', 'featureGreen'));
  }

  return artifacts;
}

function orbsFor(state: OfficeStoryState): Record<StoryActorId, OrbState> {
  const orbs: Record<StoryActorId, OrbState> = { alice: 'gray', jack: 'gray', quinn: 'gray' };
  if (state === 'ready') orbs.alice = 'yellow';
  if (state === 'dev-notified') orbs.jack = 'yellow';
  if (state === 'dev-coding') orbs.jack = 'blue';
  if (state === 'feature-ready') orbs.jack = 'yellow';
  if (state === 'qa-notified') orbs.quinn = 'yellow';
  if (state === 'qa-testing') orbs.quinn = 'blue';
  return orbs;
}

function signalsFor(state: OfficeStoryState): StorySignal[] {
  if (state === 'dev-notified') return [{ kind: 'receiptBubble', text: '收到 PRD', anchor: officeLayout.handoffAnchors.statusAnchors.jackReceiptBubble }];
  if (state === 'dev-coding') return [{ kind: 'statusLabel', text: 'Coding...', anchor: officeLayout.handoffAnchors.statusAnchors.jackCodingLabel }];
  if (state === 'qa-notified') return [{ kind: 'receiptBubble', text: '收到 Feature', anchor: officeLayout.handoffAnchors.statusAnchors.quinnReceiptBubble }];
  if (state === 'qa-testing') return [{ kind: 'statusLabel', text: 'Testing...', anchor: officeLayout.handoffAnchors.statusAnchors.quinnTestingLabel }];
  return [];
}

function latestHandoffsFor(state: OfficeStoryState) {
  const events: HandoffScenario[] = [];
  if (isAtOrAfter(state, 'qa-received')) events.push(quinnAcceptedFeature);
  if (isAtOrAfter(state, 'feature-stored')) events.push(jackSubmittedFeature);
  if (isAtOrAfter(state, 'dev-received')) events.push(jackAccepted);
  if (isAtOrAfter(state, 'prd-stored')) events.push(aliceSubmitted);
  return [...events, ...demoScenario.handoffs].slice(0, 3);
}

function runtimeForState(state: OfficeStoryState): StoryRuntime {
  return { state, playbackStatus: state === 'qa-testing' ? 'complete' : 'idle', waypointIndex: 0, autoAdvance: true };
}

export function createStoryRuntime(): StoryRuntime {
  return runtimeForState('ready');
}

export function replayStory(): StoryRuntime {
  return createStoryRuntime();
}

export function playStory(runtime: StoryRuntime): StoryRuntime {
  if (runtime.playbackStatus === 'complete') return runtime;
  return { ...runtime, playbackStatus: 'playing', autoAdvance: true };
}

export function pauseStory(runtime: StoryRuntime): StoryRuntime {
  return runtime.playbackStatus === 'playing' ? { ...runtime, playbackStatus: 'paused' } : runtime;
}

export function resumeStory(runtime: StoryRuntime): StoryRuntime {
  return runtime.playbackStatus === 'paused' ? { ...runtime, playbackStatus: 'playing' } : runtime;
}

export function isMotionComplete(runtime: StoryRuntime) {
  const motion = storyMotionFor(runtime.state);
  return !motion || runtime.waypointIndex >= motion.waypoints.length - 1;
}

export function advanceStoryWaypoint(runtime: StoryRuntime, options: { reducedMotion?: boolean } = {}): StoryRuntime {
  const motion = storyMotionFor(runtime.state);
  if (!motion || runtime.playbackStatus !== 'playing' || isMotionComplete(runtime)) return runtime;
  const waypointIndex = options.reducedMotion ? motion.waypoints.length - 1 : Math.min(runtime.waypointIndex + 1, motion.waypoints.length - 1);
  return { ...runtime, waypointIndex };
}

export function nextStoryState(state: OfficeStoryState): OfficeStoryState {
  const index = stateIndex(state);
  return prdHandoffStateOrder[Math.min(index + 1, prdHandoffStateOrder.length - 1)]!;
}

export function previousStoryState(state: OfficeStoryState): OfficeStoryState {
  const index = stateIndex(state);
  return prdHandoffStateOrder[Math.max(index - 1, 0)]!;
}

export function advanceStoryState(runtime: StoryRuntime): StoryRuntime {
  const nextState = nextStoryState(runtime.state);
  if (nextState === runtime.state) return { ...runtime, playbackStatus: 'complete' };
  return {
    ...runtime,
    state: nextState,
    waypointIndex: 0,
    playbackStatus: nextState === 'qa-testing' ? 'complete' : runtime.playbackStatus,
  };
}

export function previousStory(runtime: StoryRuntime): StoryRuntime {
  const previousState = previousStoryState(runtime.state);
  return {
    ...runtime,
    state: previousState,
    waypointIndex: 0,
    playbackStatus: previousState === 'ready' ? 'idle' : 'paused',
    autoAdvance: false,
  };
}

export function manualNextStory(runtime: StoryRuntime): StoryRuntime {
  if (runtime.playbackStatus === 'complete') return runtime;
  const motion = storyMotionFor(runtime.state);
  if (motion && !isMotionComplete(runtime)) return { ...runtime, playbackStatus: 'playing', autoAdvance: false };
  const next = advanceStoryState(runtime);
  return storyMotionFor(next.state)
    ? { ...next, playbackStatus: 'playing', autoAdvance: false }
    : { ...next, playbackStatus: next.playbackStatus === 'complete' ? 'complete' : 'paused', autoAdvance: false };
}

export function isStoryComplete(state: OfficeStoryState) {
  return state === 'qa-testing';
}

export function getStoryFrame(input: OfficeStoryState | StoryRuntime): StoryFrame {
  const runtime = typeof input === 'string' ? runtimeForState(input) : input;
  const motion = storyMotionFor(runtime.state);
  const actors = actorsFor(runtime, motion);
  const prdCount = isAtOrAfter(runtime.state, 'prd-stored') ? 2 : 1;
  const featureCount = isAtOrAfter(runtime.state, 'feature-stored') ? 3 : 2;

  return {
    state: runtime.state,
    playbackStatus: runtime.playbackStatus,
    actors,
    artifacts: artifactsFor(runtime.state, actors),
    signals: signalsFor(runtime.state),
    orbs: orbsFor(runtime.state),
    hub: {
      prdCount,
      featureCount,
      counts: getHubArtifactCounts({ prd: prdCount, feature: featureCount, report: 1 }),
    },
    latestHandoffs: latestHandoffsFor(runtime.state),
    motion,
    autoAdvanceDelayMs: runtime.state === 'qa-testing' ? 0 : 900,
  };
}

export function storyScenarioForState(input: OfficeStoryState | StoryRuntime): DemoScenario {
  const runtime = typeof input === 'string' ? runtimeForState(input) : input;
  const state = runtime.state;
  const story = getStoryFrame(runtime);
  const jackHasPrd = isAtOrAfter(state, 'dev-received');
  const jackIsCoding = state === 'dev-coding';
  const featureReady = state === 'feature-ready';
  const featureStored = isAtOrAfter(state, 'feature-stored');
  const quinnHasFeature = isAtOrAfter(state, 'qa-received');
  const quinnIsTesting = state === 'qa-testing';
  const prdArtifactIds = isAtOrAfter(state, 'prd-stored')
    ? ['account-security-prd-v1', 'login-requirement-prd-v1']
    : ['account-security-prd-v1'];

  return {
    ...demoScenario,
    handoffs: story.latestHandoffs,
    hubArtifactIds: {
      prd: prdArtifactIds,
      feature: featureStored
        ? ['account-security-feature-v1', 'audit-export-feature-v1', 'login-feature-v1']
        : ['account-security-feature-v1', 'audit-export-feature-v1'],
      report: ['login-regression-report-v1'],
    },
    workspaces: demoScenario.workspaces.map((workspace) => workspace.workspaceId === 'pm-office'
      ? {
          ...workspace,
          todayOutput: [{ label: 'PRDs Submitted', artifactIds: prdArtifactIds }],
          queue: { ...workspace.queue, outbox: `${prdArtifactIds.length} PRDs submitted` },
        }
      : workspace),
    people: demoScenario.people.map((person) => {
      if (person.deskId === jackDesk.id) {
        return {
          ...person,
          currentTask: jackIsCoding ? 'Implementing login flow' : featureReady ? 'Preparing Login Feature for submission' : undefined,
          inputArtifact: jackHasPrd ? 'Login Requirement PRD v1.0' : undefined,
        };
      }
      if (person.deskId === quinnDesk.id) {
        return {
          ...person,
          currentTask: quinnIsTesting ? 'Testing Login Feature' : undefined,
          inputArtifact: quinnHasFeature ? 'Login Feature v1.0' : undefined,
        };
      }
      return person;
    }),
    artifacts: demoScenario.artifacts.map((artifact) => {
      if (artifact.id === 'login-requirement-prd-v1') {
        return {
          ...artifact,
          status: jackHasPrd ? 'Accepted' : 'Confirmed',
          acceptedBy: jackHasPrd ? 'Jack' : 'Pending',
        };
      }
      if (artifact.id === 'login-feature-v1') {
        const status = quinnIsTesting ? 'Testing'
          : quinnHasFeature ? 'Accepted'
            : featureStored ? 'Submitted'
              : featureReady ? 'Ready for Submission'
                : jackIsCoding ? 'In Progress'
                  : 'Pending Development';
        return {
          ...artifact,
          status,
          acceptedBy: quinnHasFeature ? 'Quinn' : 'Pending',
        };
      }
      return artifact;
    }),
  };
}
