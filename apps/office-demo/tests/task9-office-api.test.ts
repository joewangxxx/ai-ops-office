import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOfficeApiStore } from '../src/backend/viteOfficeApi';

const submitted = (overrides: Record<string, unknown> = {}) => ({
  eventId: 'evt-task9-submit',
  eventType: 'artifact.submitted',
  schemaVersion: '1.0',
  occurredAt: '2026-07-22T06:00:00.000Z',
  correlationId: 'evt-task9-submit',
  source: { system: 'event-console', actorId: 'pm-alice' },
  payload: {
    artifact: { id: 'task9-prd', category: 'prd', title: 'Task 9 Contract PRD', evidence: { kind: 'prd', summary: 'Defines the Task 9 contract.', priority: 'P1', scope: ['Contract'], userStories: [{ id: 'US-1', statement: 'A producer can submit an artifact.' }], acceptanceCriteria: ['The artifact is delivered to the Hub.'] } },
    producerDeskId: 'pm-alice',
    assigneeDeskId: 'dev-jack',
  },
  ...overrides,
});

const accepted = {
  eventId: 'evt-task9-accept',
  eventType: 'artifact.accepted',
  schemaVersion: '1.0',
  occurredAt: '2026-07-22T06:01:00.000Z',
  correlationId: 'evt-task9-submit',
  causationId: 'evt-task9-submit:delivered',
  source: { system: 'office-ui', actorId: 'dev-jack' },
  payload: { artifactId: 'task9-prd', assigneeDeskId: 'dev-jack' },
};

afterEach(() => vi.useRealTimers());

describe('Task 9 v1 office API', () => {
  it('accepts a strict v1 envelope and rejects an invalid schema version', () => {
    const api = createOfficeApiStore();

    expect(api.handle('POST', '/api/business-events', submitted())).toMatchObject({
      status: 202,
      body: {
        status: 'accepted',
        eventId: 'evt-task9-submit',
        revision: 1,
        snapshot: {
          artifacts: { 'task9-prd': { status: 'Delivering' } },
          activeMotion: {
            phase: 'producer-to-hub',
            causationEventId: 'evt-task9-submit',
            correlationId: 'evt-task9-submit',
          },
        },
      },
    });

    const invalid = createOfficeApiStore().handle('POST', '/api/business-events', submitted({ schemaVersion: '2.0' }));
    expect(invalid).toEqual({ status: 400, body: { error: expect.stringContaining('schemaVersion') } });
  });

  it('makes identical eventIds idempotent and rejects content conflicts', () => {
    const api = createOfficeApiStore();
    const first = api.handle('POST', '/api/business-events', submitted());
    const duplicate = api.handle('POST', '/api/business-events', submitted());
    const conflict = api.handle('POST', '/api/business-events', submitted({
      payload: { ...submitted().payload, artifact: { ...submitted().payload.artifact, id: 'changed-id', title: 'Changed' } },
    }));

    expect(first.status).toBe(202);
    expect(duplicate).toMatchObject({ status: 200, body: { status: 'duplicate', eventId: 'evt-task9-submit', revision: 1 } });
    expect(conflict).toEqual({ status: 409, body: { error: 'eventId content conflict: evt-task9-submit' } });
    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ revision: 1, artifacts: { 'task9-prd': {} } });
  });

  it('separates runtime signals and completes submitted -> delivered -> accepted -> received', () => {
    const api = createOfficeApiStore();
    const submission = api.handle('POST', '/api/business-events', submitted());
    expect(submission.status).toBe(202);
    if (!('snapshot' in (submission.body as object))) return;
    const producerToHub = (submission.body as { snapshot: { activeMotion: { id: string } } }).snapshot.activeMotion.id;

    expect(api.handle('POST', '/api/business-events', { type: 'motion.completed', motionId: producerToHub })).toMatchObject({ status: 400 });
    expect(api.handle('POST', '/api/runtime-events', submitted())).toMatchObject({ status: 400 });

    const delivered = api.handle('POST', '/api/runtime-events', { type: 'motion.completed', motionId: producerToHub });
    expect(delivered).toMatchObject({
      status: 202,
      body: {
        status: 'accepted',
        motionId: producerToHub,
        snapshot: {
          artifacts: { 'task9-prd': { location: 'hub', status: 'Awaiting Acceptance' } },
          notifications: [expect.objectContaining({ status: 'available', canAccept: true })],
        },
      },
    });

    expect(api.handle('POST', '/api/business-events', accepted)).toMatchObject({ status: 202 });
    let snapshot = api.handle('GET', '/api/office-state').body as { activeMotion: { id: string; phase: string } | null; motionQueue: Array<{ phase: string }> };
    expect(snapshot.activeMotion?.phase).toBe('producer-to-desk');
    expect(snapshot.motionQueue[0]?.phase).toBe('assignee-to-hub');

    for (let index = 0; index < 3; index += 1) {
      snapshot = api.handle('GET', '/api/office-state').body as typeof snapshot;
      expect(snapshot.activeMotion).not.toBeNull();
      expect(api.handle('POST', '/api/runtime-events', { type: 'motion.completed', motionId: snapshot.activeMotion!.id }).status).toBe(202);
    }

    expect(api.handle('GET', '/api/office-state').body).toMatchObject({
      activeMotion: null,
      artifacts: { 'task9-prd': { location: 'desk', deskId: 'dev-jack', status: 'Accepted' } },
      scenario: { people: expect.arrayContaining([expect.objectContaining({
        deskId: 'dev-jack',
        activeWorks: expect.arrayContaining([expect.objectContaining({ sourceArtifactId: 'task9-prd' })]),
      })]) },
    });
  });

  it('rejects removed legacy event and reset endpoints without changing the projection', () => {
    const api = createOfficeApiStore();
    const legacy = {
      type: 'artifact.completed',
      artifact: { id: 'legacy-task9', category: 'prd', title: 'Legacy Task 9 PRD' },
      producerDeskId: 'pm-alice',
      assigneeDeskId: 'dev-jack',
    };
    const before = api.handle('GET', '/api/office-state').body;

    expect(api.handle('POST', '/api/business-events', legacy).status).toBe(400);
    expect(api.handle('POST', '/api/office-events', legacy)).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(api.handle('POST', '/api/office-reset')).toEqual({ status: 404, body: { error: 'Not found' } });
    expect(api.handle('GET', '/api/office-state').body).toEqual(before);
  });

  it('rejects an accepted event from the wrong causal chain without changing the projection', () => {
    const api = createOfficeApiStore();
    const submission = api.handle('POST', '/api/business-events', submitted());
    const motionId = (submission.body as { snapshot: { activeMotion: { id: string } } }).snapshot.activeMotion.id;
    api.handle('POST', '/api/runtime-events', { type: 'motion.completed', motionId });
    const before = api.handle('GET', '/api/office-state').body;

    expect(api.handle('POST', '/api/business-events', { ...accepted, correlationId: 'other-chain', causationId: 'other-cause' })).toEqual({
      status: 409,
      body: { error: 'Artifact acceptance causal chain does not match' },
    });
    expect(api.handle('GET', '/api/office-state').body).toEqual(before);
  });

  it('starts a reset epoch, preserves reset idempotency, and cancels the old motion fallback', () => {
    vi.useFakeTimers();
    const api = createOfficeApiStore();
    api.handle('POST', '/api/business-events', submitted());
    const reset = {
      eventId: 'evt-task9-reset',
      eventType: 'projection.reset',
      schemaVersion: '1.0',
      occurredAt: '2026-07-22T06:02:00.000Z',
      correlationId: 'evt-task9-reset',
      source: { system: 'event-console' },
      payload: { reason: 'manual-reset' },
    };

    expect(api.handle('POST', '/api/business-events', reset)).toMatchObject({
      status: 202,
      body: { status: 'accepted', snapshot: { epoch: 1, revision: 1, artifacts: {}, activeMotion: null } },
    });
    expect(api.handle('POST', '/api/business-events', reset)).toMatchObject({ status: 200, body: { status: 'duplicate' } });
    vi.advanceTimersByTime(20_000);
    expect(api.handle('GET', '/api/office-state').body).toMatchObject({ epoch: 1, revision: 1, artifacts: {}, activeMotion: null });
  });

  it('preserves FIFO and adds multiple Active Work items for one assignee through v1 events', () => {
    const api = createOfficeApiStore();
    const second = submitted({
      eventId: 'evt-task9-submit-2',
      correlationId: 'evt-task9-submit-2',
      payload: {
        artifact: { ...submitted().payload.artifact, id: 'task9-prd-2', title: 'Task 9 Contract PRD Two' },
        producerDeskId: 'pm-bob',
        assigneeDeskId: 'dev-jack',
      },
    });
    api.handle('POST', '/api/business-events', submitted());
    api.handle('POST', '/api/business-events', second);

    let state = api.handle('GET', '/api/office-state').body as { activeMotion: { id: string } | null };
    while (state.activeMotion) {
      api.handle('POST', '/api/runtime-events', { type: 'motion.completed', motionId: state.activeMotion.id });
      state = api.handle('GET', '/api/office-state').body as typeof state;
    }

    const acceptOne = accepted;
    const acceptTwo = {
      ...accepted,
      eventId: 'evt-task9-accept-2',
      correlationId: 'evt-task9-submit-2',
      causationId: 'evt-task9-submit-2:delivered',
      payload: { artifactId: 'task9-prd-2', assigneeDeskId: 'dev-jack' },
    };
    api.handle('POST', '/api/business-events', acceptOne);
    api.handle('POST', '/api/business-events', acceptTwo);
    const queued = api.handle('GET', '/api/office-state').body as {
      activeMotion: { id: string; artifactId: string } | null;
      motionQueue: Array<{ artifactId: string }>;
    };
    expect(queued.activeMotion?.artifactId).toBe('task9-prd');
    expect(queued.motionQueue[0]?.artifactId).toBe('task9-prd-2');

    state = queued;
    while (state.activeMotion) {
      api.handle('POST', '/api/runtime-events', { type: 'motion.completed', motionId: state.activeMotion.id });
      state = api.handle('GET', '/api/office-state').body as typeof state;
    }

    const final = api.handle('GET', '/api/office-state').body as {
      scenario: { people: Array<{ deskId: string; activeWorks: Array<{ sourceArtifactId?: string }> }> };
    };
    const jackWorks = final.scenario.people.find((person) => person.deskId === 'dev-jack')!.activeWorks;
    expect(jackWorks.filter((work) => work.sourceArtifactId === 'task9-prd')).toHaveLength(1);
    expect(jackWorks.filter((work) => work.sourceArtifactId === 'task9-prd-2')).toHaveLength(1);
  });
});
