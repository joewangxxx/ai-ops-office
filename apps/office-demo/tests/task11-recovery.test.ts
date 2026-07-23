import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { InMemoryEventLedger, JsonlEventLedger, type PersistedBusinessEvent } from '../src/backend/eventLedger';
import { InMemoryProjectionSnapshotStore, JsonProjectionSnapshotStore } from '../src/backend/projectionSnapshotStore';
import { createOfficeApiStore } from '../src/backend/viteOfficeApi';

const evidence = {
  kind: 'prd', summary: 'Defines durable recovery.', priority: 'P1', scope: ['Recovery'],
  userStories: [{ id: 'US-1', statement: 'A user can recover a submitted artifact.' }],
  acceptanceCriteria: ['Accepted events survive a restart.'],
};

const submitted = (id = 'durable-prd', eventId = `submit-${id}`, producerDeskId = 'pm-alice') => ({
  eventId,
  eventType: 'artifact.submitted',
  schemaVersion: '1.0',
  occurredAt: '2026-07-22T07:00:00.000Z',
  correlationId: eventId,
  source: { system: 'task11-test', actorId: producerDeskId },
  payload: { artifact: { id, category: 'prd', title: `Durable ${id}`, evidence }, producerDeskId, assigneeDeskId: 'dev-jack' },
});

const persistence = () => ({ ledger: new InMemoryEventLedger(), snapshotStore: new InMemoryProjectionSnapshotStore(), snapshotEvery: 20 });
const noTimers = { setTimer: (() => 0 as never), clearTimer: (() => undefined) };
const tempDirectories: string[] = [];
afterEach(async () => Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true }))));

async function completeActiveMotion(api: ReturnType<typeof createOfficeApiStore>) {
  const state = (await api.handleAsync('GET', '/api/office-state')).body as { activeMotion: { id: string } | null };
  expect(state.activeMotion).not.toBeNull();
  return api.handleAsync('POST', '/api/runtime-events', { type: 'motion.completed', motionId: state.activeMotion!.id });
}

describe('Task 11 durable projection recovery', () => {
  it('restarts from real JSONL and atomic snapshot files in a temporary directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'office-task11-restart-'));
    tempDirectories.push(directory);
    const first = createOfficeApiStore({ persistence: { ledger: new JsonlEventLedger({ directory }), snapshotStore: new JsonProjectionSnapshotStore({ directory }) }, ...noTimers });
    await first.ready;
    await first.handleAsync('POST', '/api/business-events', submitted('jsonl-prd'));
    await first.dispose();

    const restarted = createOfficeApiStore({ persistence: { ledger: new JsonlEventLedger({ directory }), snapshotStore: new JsonProjectionSnapshotStore({ directory }) }, ...noTimers });
    await restarted.ready;
    expect((await restarted.handleAsync('GET', '/api/office-state')).body).toMatchObject({ artifacts: { 'jsonl-prd': {} }, activeMotion: { artifactId: 'jsonl-prd' } });
  });

  it('recovers a completed handoff without replaying historical motion and keeps eventId idempotency', async () => {
    const storage = persistence();
    const first = createOfficeApiStore({ persistence: storage, ...noTimers });
    await first.ready;
    await first.handleAsync('POST', '/api/business-events', submitted());
    await completeActiveMotion(first);
    await first.handleAsync('POST', '/api/business-events', {
      eventId: 'accept-durable-prd', eventType: 'artifact.accepted', schemaVersion: '1.0', occurredAt: '2026-07-22T07:01:00.000Z',
      correlationId: 'submit-durable-prd', causationId: 'submit-durable-prd:delivered', source: { system: 'task11-test', actorId: 'dev-jack' },
      payload: { artifactId: 'durable-prd', assigneeDeskId: 'dev-jack' },
    });
    await completeActiveMotion(first);
    await completeActiveMotion(first);
    await completeActiveMotion(first);
    const beforeRestart = (await first.handleAsync('GET', '/api/office-state')).body as { revision: number };
    await first.dispose();

    const restarted = createOfficeApiStore({
      persistence: { ledger: storage.ledger, snapshotStore: new InMemoryProjectionSnapshotStore(), snapshotEvery: 20 },
      ...noTimers,
    });
    await restarted.ready;
    const recovered = (await restarted.handleAsync('GET', '/api/office-state')).body as {
      revision: number;
      scenario: { hubArtifactIds: { prd: string[] } };
    };
    expect(recovered).toMatchObject({
      epoch: 0, activeMotion: null,
      artifacts: { 'durable-prd': { location: 'desk', status: 'Accepted' } },
      scenario: { people: expect.arrayContaining([expect.objectContaining({ deskId: 'dev-jack', activeWorks: expect.arrayContaining([expect.objectContaining({ sourceArtifactId: 'durable-prd' })]) })]) },
    });
    expect(recovered.scenario.hubArtifactIds.prd).not.toContain('durable-prd');
    expect(recovered.revision).toBeGreaterThanOrEqual(beforeRestart.revision);
    await expect(restarted.handleAsync('POST', '/api/business-events', submitted())).resolves.toMatchObject({ status: 200, body: { status: 'duplicate' } });
  });

  it('recovers from a snapshot plus incremental events and from the full ledger without a snapshot', async () => {
    const storage = { ...persistence(), snapshotEvery: 1 };
    const first = createOfficeApiStore({ persistence: storage, ...noTimers });
    await first.ready;
    await first.handleAsync('POST', '/api/business-events', submitted('first-prd'));
    const firstSnapshot = structuredClone(storage.snapshotStore.snapshot);
    await first.handleAsync('POST', '/api/business-events', submitted('second-prd', 'submit-second-prd', 'pm-bob'));
    storage.snapshotStore.snapshot = firstSnapshot;

    const incremental = createOfficeApiStore({ persistence: storage, ...noTimers });
    await incremental.ready;
    expect((await incremental.handleAsync('GET', '/api/office-state')).body).toMatchObject({ artifacts: { 'first-prd': {}, 'second-prd': {} } });

    const full = createOfficeApiStore({ persistence: { ...storage, snapshotStore: new InMemoryProjectionSnapshotStore() }, ...noTimers });
    await full.ready;
    expect((await full.handleAsync('GET', '/api/office-state')).body).toMatchObject({ artifacts: { 'first-prd': {}, 'second-prd': {} } });
  });

  it('does not commit ghost state when ledger append fails', async () => {
    class FailingLedger extends InMemoryEventLedger {
      override async append(_event: PersistedBusinessEvent): Promise<{ sequence: number }> { throw new Error('disk full'); }
    }
    const api = createOfficeApiStore({ persistence: { ledger: new FailingLedger(), snapshotStore: new InMemoryProjectionSnapshotStore() }, ...noTimers });
    await api.ready;

    expect(await api.handleAsync('POST', '/api/business-events', submitted())).toEqual({ status: 503, body: { error: 'Event ledger append failed' } });
    expect((await api.handleAsync('GET', '/api/office-state')).body).toMatchObject({ revision: 0, artifacts: {} });
  });

  it('serializes concurrent appends and redacts rejected evidence from diagnostics', async () => {
    const storage = persistence();
    const api = createOfficeApiStore({ persistence: storage, ...noTimers });
    await api.ready;
    await Promise.all([
      api.handleAsync('POST', '/api/business-events', submitted('concurrent-one')),
      api.handleAsync('POST', '/api/business-events', submitted('concurrent-two', 'submit-concurrent-two', 'pm-bob')),
    ]);
    expect(storage.ledger.records.map((entry) => entry.sequence)).toEqual([1, 2]);

    const invalid = submitted('private-evidence', 'submit-private-evidence');
    invalid.payload.assigneeDeskId = 'qa-quinn';
    invalid.payload.artifact.evidence.summary = 'SECRET EVIDENCE MUST NOT BE COPIED';
    expect(await api.handleAsync('POST', '/api/business-events', invalid)).toMatchObject({ status: 409 });
    expect(JSON.stringify(storage.ledger.rejections)).not.toContain('SECRET EVIDENCE MUST NOT BE COPIED');
    expect(storage.ledger.rejections[0]).toMatchObject({ reasonCode: 'domain_rejected', eventId: 'submit-private-evidence', payloadHash: expect.any(String) });
  });

  it('increments reset epoch, retains old ledger history, and restores only the current epoch', async () => {
    const storage = persistence();
    const first = createOfficeApiStore({ persistence: storage, ...noTimers });
    await first.ready;
    await first.handleAsync('POST', '/api/business-events', submitted());
    await first.handleAsync('POST', '/api/business-events', {
      eventId: 'reset-task11', eventType: 'projection.reset', schemaVersion: '1.0', occurredAt: '2026-07-22T07:02:00.000Z',
      correlationId: 'reset-task11', source: { system: 'task11-test' }, payload: { reason: 'manual-reset' },
    });
    expect(storage.ledger.records.map((entry) => entry.epoch)).toEqual([0, 1]);
    expect(storage.ledger.records).toHaveLength(2);

    const restarted = createOfficeApiStore({ persistence: storage, ...noTimers });
    await restarted.ready;
    expect((await restarted.handleAsync('GET', '/api/office-state')).body).toMatchObject({ epoch: 1, artifacts: {}, activeMotion: null });
  });

  it('reconciles submitted and accepted incomplete handoffs without replaying finished presentation legs', async () => {
    const submittedStorage = persistence();
    const submitter = createOfficeApiStore({ persistence: submittedStorage, ...noTimers });
    await submitter.ready;
    await submitter.handleAsync('POST', '/api/business-events', submitted('pending-submit'));
    const submittedRestart = createOfficeApiStore({ persistence: submittedStorage, ...noTimers });
    await submittedRestart.ready;
    expect((await submittedRestart.handleAsync('GET', '/api/office-state')).body).toMatchObject({ activeMotion: { artifactId: 'pending-submit', phase: 'producer-to-hub' } });

    const acceptedStorage = persistence();
    const accepter = createOfficeApiStore({ persistence: acceptedStorage, ...noTimers });
    await accepter.ready;
    await accepter.handleAsync('POST', '/api/business-events', submitted('pending-accept'));
    await completeActiveMotion(accepter);
    await accepter.handleAsync('POST', '/api/business-events', {
      eventId: 'accept-pending', eventType: 'artifact.accepted', schemaVersion: '1.0', occurredAt: '2026-07-22T07:01:00.000Z',
      correlationId: 'submit-pending-accept', causationId: 'submit-pending-accept:delivered', source: { system: 'task11-test', actorId: 'dev-jack' },
      payload: { artifactId: 'pending-accept', assigneeDeskId: 'dev-jack' },
    });
    const acceptedRestart = createOfficeApiStore({ persistence: acceptedStorage, ...noTimers });
    await acceptedRestart.ready;
    expect((await acceptedRestart.handleAsync('GET', '/api/office-state')).body).toMatchObject({ activeMotion: { artifactId: 'pending-accept', phase: 'assignee-to-hub' }, motionQueue: [] });
  });

  it('reconciles multiple unfinished submissions in ledger FIFO order', async () => {
    const storage = persistence();
    const first = createOfficeApiStore({ persistence: storage, ...noTimers });
    await first.ready;
    await first.handleAsync('POST', '/api/business-events', submitted('fifo-one'));
    await first.handleAsync('POST', '/api/business-events', submitted('fifo-two', 'submit-fifo-two', 'pm-bob'));

    const restarted = createOfficeApiStore({ persistence: storage, ...noTimers });
    await restarted.ready;
    expect((await restarted.handleAsync('GET', '/api/office-state')).body).toMatchObject({
      activeMotion: { artifactId: 'fifo-one' }, motionQueue: [{ artifactId: 'fifo-two' }],
    });
  });
});
