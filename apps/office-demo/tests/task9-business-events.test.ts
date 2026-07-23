import { describe, expect, it } from 'vitest';
import {
  BusinessEventValidationError,
  parseBusinessEventEnvelope,
  parseMotionCompletedSignal,
} from '../src/backend/businessEvents';

const envelope = (eventType: string, payload: unknown, overrides: Record<string, unknown> = {}) => ({
  eventId: `evt-${eventType}`,
  eventType,
  schemaVersion: '1.0',
  occurredAt: '2026-07-22T06:00:00.000Z',
  correlationId: 'corr-task9',
  source: { system: 'contract-test', actorId: 'pm-alice' },
  payload,
  ...overrides,
});

describe('Task 9 Business Event Contract v1 parser', () => {
  it.each([
    ['artifact.submitted', { artifact: { id: 'prd-1', category: 'prd', title: 'PRD', evidence: { kind: 'prd', summary: 'Defines the requirement.', priority: 'P1', scope: ['Login'], userStories: [{ id: 'US-1', statement: 'A user can sign in.' }], acceptanceCriteria: ['Valid credentials succeed.'] } }, producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack' }, {}],
    ['artifact.delivered', { artifactId: 'prd-1', producerDeskId: 'pm-alice' }, { causationId: 'evt-submit' }],
    ['artifact.accepted', { artifactId: 'prd-1', assigneeDeskId: 'dev-jack' }, { causationId: 'evt-submit:delivered' }],
    ['artifact.received', { artifactId: 'prd-1', assigneeDeskId: 'dev-jack' }, { causationId: 'evt-accept' }],
    ['projection.reset', { reason: 'manual-reset' }, {}],
  ] as const)('parses %s as a canonical v1 envelope', (eventType, payload, overrides) => {
    expect(parseBusinessEventEnvelope(envelope(eventType, payload, overrides))).toMatchObject({ eventType, payload });
  });

  it.each(['artifact.delivered', 'artifact.accepted', 'artifact.received'])('requires causationId for %s', (eventType) => {
    const payload = eventType === 'artifact.delivered'
      ? { artifactId: 'prd-1', producerDeskId: 'pm-alice' }
      : { artifactId: 'prd-1', assigneeDeskId: 'dev-jack' };

    expect(() => parseBusinessEventEnvelope(envelope(eventType, payload)))
      .toThrowError(new BusinessEventValidationError(`causationId is required for ${eventType}`));
  });

  it('keeps motion.completed outside the business envelope union', () => {
    expect(parseMotionCompletedSignal({ type: 'motion.completed', motionId: 'motion-1' })).toEqual({ type: 'motion.completed', motionId: 'motion-1' });
    expect(() => parseBusinessEventEnvelope({ type: 'motion.completed', motionId: 'motion-1' })).toThrowError(BusinessEventValidationError);
    expect(() => parseMotionCompletedSignal(envelope('artifact.submitted', {}))).toThrowError(BusinessEventValidationError);
  });
});
