import { describe, expect, it } from 'vitest';
import { applyBusinessEvent, createOfficeState } from '../src/backend/officeDomain';

const submitted = {
  eventId: 'evt-domain-submit',
  eventType: 'artifact.submitted',
  schemaVersion: '1.0',
  occurredAt: '2026-07-22T06:00:00.000Z',
  correlationId: 'corr-domain',
  source: { system: 'domain-test', actorId: 'pm-alice' },
  payload: {
    artifact: { id: 'domain-prd', category: 'prd', title: 'Domain PRD', evidence: { kind: 'prd', summary: 'Defines the domain flow.', priority: 'P1', scope: ['Domain'], userStories: [{ id: 'US-1', statement: 'A producer submits a PRD.' }], acceptanceCriteria: ['The motion starts.'] } },
    producerDeskId: 'pm-alice',
    assigneeDeskId: 'dev-jack',
  },
} as const;

describe('Task 9 business reducer contract', () => {
  it('applies artifact.submitted and retains causation on its presentation motion', () => {
    const next = applyBusinessEvent(createOfficeState(), submitted as never);

    expect(next.artifacts['domain-prd']).toMatchObject({ location: 'carrier', status: 'Delivering' });
    expect(next.activeMotion).toMatchObject({
      phase: 'producer-to-hub',
      causationEventId: 'evt-domain-submit',
      correlationId: 'corr-domain',
    });
  });
});
