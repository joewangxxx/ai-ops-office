import { describe, expect, it } from 'vitest';
import { officeLayout } from '../src/data/officeLayout';
import { directionBetween } from '../src/utils/avatarPresentation';
import {
  applyOfficeEvent,
  createOfficeState,
  OfficeDomainError,
  toOfficeSnapshot,
} from '../src/backend/officeDomain';

const completedPrd = {
  type: 'artifact.completed' as const,
  artifact: {
    id: 'roadmap-prd-v2',
    category: 'prd' as const,
    title: 'Roadmap PRD v2.0',
  },
  producerDeskId: 'pm-alice',
  assigneeDeskId: 'dev-jack',
};

describe('Task 7 handoff routes', () => {
  it('registers a valid hub route for every online avatar desk', () => {
    const onlineDeskIds = officeLayout.desks
      .filter((desk) => desk.online && desk.occupant.avatarKey)
      .map((desk) => desk.id);

    expect(Object.keys(officeLayout.handoffAnchors.routesByDesk).sort()).toEqual(onlineDeskIds.sort());

    for (const deskId of onlineDeskIds) {
      const route = officeLayout.handoffAnchors.routesByDesk[deskId];
      const desk = officeLayout.desks.find((item) => item.id === deskId)!;
      expect(route.toHub[0]).toEqual(desk.avatarAnchor);
      expect(route.fromHub).toEqual([...route.toHub].reverse());
      route.toHub.forEach((point, index) => {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(officeLayout.scene.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(officeLayout.scene.height);
        if (index > 0) expect(point).not.toEqual(route.toHub[index - 1]);
      });
    }

    const directions = Object.values(officeLayout.handoffAnchors.routesByDesk).flatMap((route) => route.toHub.slice(1).map((point, index) => directionBetween(route.toHub[index]!, point)));
    expect(new Set(directions)).toEqual(new Set(['up', 'down', 'left', 'right']));
  });
});

describe('Task 7 office event domain', () => {
  it('runs completion, Hub delivery, acceptance, pickup, and desk delivery', () => {
    let state = createOfficeState();
    const initialPrdOutput = state.scenario.workspaces[0]!.todayOutput[0]!.artifactIds.length;

    state = applyOfficeEvent(state, completedPrd);
    expect(state.scenario.workspaces[0]!.todayOutput[0]!.artifactIds).toHaveLength(initialPrdOutput + 1);
    expect(state.activeMotion).toMatchObject({ phase: 'producer-to-hub', pose: 'carry', deskId: 'pm-alice' });
    expect(state.notifications).toContainEqual(expect.objectContaining({ artifactId: 'roadmap-prd-v2', assigneeDeskId: 'dev-jack', canAccept: false }));

    state = applyOfficeEvent(state, { type: 'motion.completed', motionId: state.activeMotion!.id });
    expect(state.artifacts['roadmap-prd-v2']).toMatchObject({ location: 'hub', status: 'Awaiting Acceptance' });
    expect(state.notifications[0]).toMatchObject({ canAccept: true, status: 'available' });
    expect(state.scenario.hubArtifactIds.prd).toContain('roadmap-prd-v2');

    state = applyOfficeEvent(state, { type: 'artifact.accepted', artifactId: 'roadmap-prd-v2', assigneeDeskId: 'dev-jack' });
    expect(state.activeMotion).toMatchObject({ phase: 'assignee-to-hub', pose: 'walk', deskId: 'dev-jack' });
    expect(state.notifications[0]).toMatchObject({ canAccept: false, status: 'accepted' });

    state = applyOfficeEvent(state, { type: 'motion.completed', motionId: state.activeMotion!.id });
    expect(state.activeMotion).toMatchObject({ phase: 'assignee-to-desk', pose: 'carry', deskId: 'dev-jack' });

    state = applyOfficeEvent(state, { type: 'motion.completed', motionId: state.activeMotion!.id });
    expect(state.activeMotion).toBeNull();
    expect(state.artifacts['roadmap-prd-v2']).toMatchObject({ location: 'desk', deskId: 'dev-jack', status: 'Accepted' });
    expect(state.scenario.hubArtifactIds.prd).not.toContain('roadmap-prd-v2');
    expect(state.scenario.artifacts.find((artifact) => artifact.id === 'roadmap-prd-v2')).toMatchObject({ acceptedBy: 'Jack', status: 'Accepted' });
    expect(state.scenario.people.find((person) => person.deskId === 'dev-jack')).toMatchObject({ inputArtifact: 'Roadmap PRD v2.0' });
    expect(toOfficeSnapshot(state).revision).toBe(state.revision);
  });

  it('preserves state when an event is invalid', () => {
    const state = createOfficeState();
    const before = JSON.stringify(state);

    expect(() => applyOfficeEvent(state, { ...completedPrd, assigneeDeskId: 'dev-mia' })).toThrowError(OfficeDomainError);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('uses one active motion and queues later handoffs in FIFO order', () => {
    let state = applyOfficeEvent(createOfficeState(), completedPrd);
    state = applyOfficeEvent(state, {
      ...completedPrd,
      artifact: { ...completedPrd.artifact, id: 'billing-prd-v1', title: 'Billing PRD v1.0' },
      producerDeskId: 'pm-bob',
      assigneeDeskId: 'dev-kara',
    });

    expect(state.activeMotion).toMatchObject({ artifactId: 'roadmap-prd-v2' });
    expect(state.motionQueue).toHaveLength(1);
    expect(state.motionQueue[0]).toMatchObject({ artifactId: 'billing-prd-v1' });

    state = applyOfficeEvent(state, { type: 'motion.completed', motionId: state.activeMotion!.id });
    expect(state.activeMotion).toMatchObject({ artifactId: 'billing-prd-v1', deskId: 'pm-bob' });
  });
});
