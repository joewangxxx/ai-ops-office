import { describe, expect, it, vi } from 'vitest';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { createOfficeStore } from '../src/backend/officeStore';
import { createProjectionPublisher } from '../src/backend/projectionPublisher';
import { InMemoryEventLedger } from '../src/backend/eventLedger';
import { InMemoryProjectionSnapshotStore } from '../src/backend/projectionSnapshotStore';

const snapshot = (revision: number) => {
  const value = toOfficeSnapshot(createOfficeState());
  value.revision = revision;
  return value;
};

const submitted = {
  eventId: 'task12-submit', eventType: 'artifact.submitted', schemaVersion: '1.0', occurredAt: '2026-07-22T09:00:00.000Z',
  correlationId: 'task12-submit', source: { system: 'task12-test' },
  payload: {
    artifact: { id: 'task12-prd', category: 'prd', title: 'Task 12 PRD', evidence: { kind: 'prd', summary: 'Defines live projection.', priority: 'P1', scope: ['SSE'], userStories: [{ id: 'US-1', statement: 'A user receives updates.' }], acceptanceCriteria: ['Updates arrive without polling.'] } },
    producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack',
  },
} as const;

describe('Task 12 projection publisher', () => {
  it('publishes, unsubscribes, and replays a bounded cursor buffer', () => {
    const publisher = createProjectionPublisher({ epoch: 0, revision: 0, sequence: 0, snapshot: snapshot(0) }, 2);
    const listener = vi.fn();
    const unsubscribe = publisher.subscribe(listener);
    publisher.publish({ epoch: 0, revision: 1, sequence: 1, snapshot: snapshot(1) });
    publisher.publish({ epoch: 0, revision: 2, sequence: 1, snapshot: snapshot(2) });
    unsubscribe();
    publisher.publish({ epoch: 0, revision: 3, sequence: 2, snapshot: snapshot(3) });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(publisher.latest()).toMatchObject({ revision: 3, sequence: 2 });
    expect(publisher.replayAfter('0:2').map((message) => message.revision)).toEqual([3]);
    expect(publisher.replayAfter('0:0')).toEqual([publisher.latest()]);
  });

  it('publishes accepted events and motion-only projection changes after commit', async () => {
    const publisher = createProjectionPublisher({ epoch: 0, revision: 0, sequence: 0, snapshot: snapshot(0) });
    const messages: Array<{ revision: number; sequence: number }> = [];
    publisher.subscribe((message) => messages.push(message));
    const store = createOfficeStore({
      persistence: { ledger: new InMemoryEventLedger(), snapshotStore: new InMemoryProjectionSnapshotStore() },
      publisher,
      setTimer: () => 0 as never,
      clearTimer: () => undefined,
    });
    await store.ready;
    await store.acceptBusinessEvent(submitted as never);
    const firstMotion = store.snapshot().activeMotion!;
    await store.acceptRuntimeSignal({ type: 'motion.completed', motionId: firstMotion.id });
    const returnMotion = store.snapshot().activeMotion!;
    await store.acceptRuntimeSignal({ type: 'motion.completed', motionId: returnMotion.id });

    expect(messages.map(({ revision, sequence }) => ({ revision, sequence }))).toEqual([
      { revision: 1, sequence: 1 },
      { revision: 2, sequence: 2 },
      { revision: 3, sequence: 2 },
    ]);
  });
});
