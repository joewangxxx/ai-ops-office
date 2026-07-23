import { describe, expect, it } from 'vitest';
import { officeLayout } from '../src/data/officeLayout';
import { directionBetween } from '../src/utils/avatarPresentation';
import {
  applyRuntimeEvent,
  createOfficeState,
  OfficeDomainError,
  toOfficeSnapshot,
} from '../src/backend/officeDomain';
import {
  acceptArtifact,
  completeActiveMotion,
  submitArtifact,
  submittedEvent,
} from './helpers/officeEventTestUtils';

const submittedPrd = submittedEvent({
  id: 'roadmap-prd-v2',
  title: 'Roadmap PRD v2.0',
  producerDeskId: 'pm-alice',
  assigneeDeskId: 'dev-jack',
});

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
  it('returns the producer to their desk before starting an accepted handoff', () => {
    let state = createOfficeState();

    state = submitArtifact(state, submittedPrd);
    expect(state.activeMotion).toMatchObject({ phase: 'producer-to-hub', pose: 'carry', deskId: 'pm-alice' });

    state = completeActiveMotion(state);
    expect(state.artifacts['roadmap-prd-v2']).toMatchObject({ location: 'hub', status: 'Awaiting Acceptance' });
    expect(state.notifications[0]).toMatchObject({ canAccept: true, status: 'available' });
    expect(state.activeMotion).toMatchObject({ phase: 'producer-to-desk', pose: 'walk', deskId: 'pm-alice' });

    state = acceptArtifact(state, 'roadmap-prd-v2', 'dev-jack');
    expect(state.activeMotion).toMatchObject({ phase: 'producer-to-desk', deskId: 'pm-alice' });
    expect(state.motionQueue).toHaveLength(1);
    expect(state.notifications[0]).toMatchObject({ canAccept: false, status: 'accepted' });

    state = completeActiveMotion(state);
    expect(state.activeMotion).toMatchObject({ phase: 'assignee-to-hub', pose: 'walk', deskId: 'dev-jack' });
    expect(state.actors['pm-alice']).toMatchObject({ pose: 'atDesk' });

    state = completeActiveMotion(state);
    expect(state.activeMotion).toMatchObject({ phase: 'assignee-to-desk', pose: 'carry', deskId: 'dev-jack' });
    expect(state.artifacts['roadmap-prd-v2']).toMatchObject({ location: 'carrier', deskId: 'dev-jack' });

    state = completeActiveMotion(state);
    expect(state.activeMotion).toBeNull();
    expect(state.artifacts['roadmap-prd-v2']).toMatchObject({ location: 'desk', deskId: 'dev-jack', status: 'Accepted' });
    expect(state.scenario.hubArtifactIds.prd).not.toContain('roadmap-prd-v2');
    expect(state.scenario.artifacts.find((artifact) => artifact.id === 'roadmap-prd-v2')).toMatchObject({ acceptedBy: 'Jack', status: 'Accepted' });
    expect(state.scenario.people.find((person) => person.deskId === 'dev-jack')?.activeWorks).toContainEqual(expect.objectContaining({ sourceArtifactId: 'roadmap-prd-v2', title: 'Working on Roadmap PRD v2.0', status: 'active' }));
    expect(toOfficeSnapshot(state).revision).toBe(state.revision);
  });

  it('makes duplicate motion confirmations idempotent', () => {
    let state = submitArtifact(createOfficeState(), submittedPrd);
    const motionId = state.activeMotion!.id;
    state = completeActiveMotion(state);
    const afterFirstConfirmation = toOfficeSnapshot(state);

    state = applyRuntimeEvent(state, { type: 'motion.completed', motionId }).state;

    expect(toOfficeSnapshot(state)).toEqual(afterFirstConfirmation);
  });

  it('adds multiple active works for separately accepted artifacts without duplication', () => {
    const secondSubmission = submittedEvent({ id: 'roadmap-prd-v3', title: 'Roadmap PRD v3.0' });
    let state = createOfficeState();
    for (const submission of [submittedPrd, secondSubmission]) {
      state = submitArtifact(state, submission);
      while (state.activeMotion?.phase.startsWith('producer-')) {
        state = completeActiveMotion(state);
      }
      state = acceptArtifact(state, submission.payload.artifact.id, 'dev-jack');
      while (state.activeMotion) state = completeActiveMotion(state);
    }

    const works = state.scenario.people.find((person) => person.deskId === 'dev-jack')!.activeWorks!;
    expect(works.filter((work) => work.sourceArtifactId === 'roadmap-prd-v2')).toHaveLength(1);
    expect(works.filter((work) => work.sourceArtifactId === 'roadmap-prd-v3')).toHaveLength(1);
  });

  it('keeps only three formatted latest handoffs', () => {
    let state = createOfficeState();
    for (const [index, title] of ['One', 'Two', 'Three', 'Four'].entries()) {
      const submission = submittedEvent({ id: `handoff-${index}`, title });
      state = submitArtifact(state, submission);
      while (state.activeMotion?.phase.startsWith('producer-')) state = completeActiveMotion(state);
    }

    expect(state.scenario.handoffs).toHaveLength(3);
    expect(state.scenario.handoffs.every((handoff) => /^\d{2}:\d{2}$/.test(handoff.time))).toBe(true);
  });

  it('preserves state when an event is invalid', () => {
    const state = createOfficeState();
    const before = JSON.stringify(state);

    expect(() => submitArtifact(state, submittedEvent({ id: 'invalid-route', assigneeDeskId: 'dev-mia' }))).toThrowError(OfficeDomainError);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('uses one active motion and queues later handoffs in FIFO order', () => {
    let state = submitArtifact(createOfficeState(), submittedPrd);
    state = submitArtifact(state, submittedEvent({
      id: 'billing-prd-v1',
      title: 'Billing PRD v1.0',
      producerDeskId: 'pm-bob',
      assigneeDeskId: 'dev-kara',
    }));

    expect(state.activeMotion).toMatchObject({ artifactId: 'roadmap-prd-v2' });
    expect(state.motionQueue).toHaveLength(1);
    expect(state.motionQueue[0]).toMatchObject({ artifactId: 'billing-prd-v1' });

    state = completeActiveMotion(state);
    expect(state.activeMotion).toMatchObject({ artifactId: 'roadmap-prd-v2', deskId: 'pm-alice', phase: 'producer-to-desk' });
  });
});
