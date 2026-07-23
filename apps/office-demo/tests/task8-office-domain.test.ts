import { describe, expect, it } from 'vitest';
import {
  applyBusinessEvent,
  createOfficeState,
  OfficeDomainError,
} from '../src/backend/officeDomain';
import type { ArtifactCategory } from '../src/data/demoScenario';
import { submittedEvent } from './helpers/officeEventTestUtils';

const submission = (
  category: ArtifactCategory,
  producerDeskId: string,
  assigneeDeskId: string,
  id = `task8-${category}`,
 ) => submittedEvent({
  id,
  category,
  title: `Task 8 ${category}`,
  producerDeskId,
  assigneeDeskId,
});

describe('Task 8 artifact routing contract', () => {
  it.each([
    ['prd', 'pm-alice', 'dev-jack'],
    ['feature', 'dev-jack', 'qa-quinn'],
    ['report', 'qa-quinn', 'pm-alice'],
  ] as const)('accepts the %s upstream-to-downstream route', (category, producerDeskId, assigneeDeskId) => {
    const next = applyBusinessEvent(createOfficeState(), submission(category, producerDeskId, assigneeDeskId));

    expect(next.artifacts[`task8-${category}`]).toMatchObject({ category, producerDeskId, assigneeDeskId });
  });

  it.each([
    ['prd', 'dev-jack', 'qa-quinn'],
    ['feature', 'pm-alice', 'dev-jack'],
    ['report', 'dev-jack', 'qa-quinn'],
  ] as const)('rejects the invalid %s workspace route', (category, producerDeskId, assigneeDeskId) => {
    expect(() => applyBusinessEvent(createOfficeState(), submission(category, producerDeskId, assigneeDeskId)))
      .toThrowError(new OfficeDomainError(409, `Invalid ${category} route: ${producerDeskId} -> ${assigneeDeskId}`));
  });

  it.each([
    [{ id: '   ', category: 'prd' as const, title: 'Valid title' }, 'Artifact ID is required'],
    [{ id: 'valid-id', category: 'prd' as const, title: '   ' }, 'Artifact title is required'],
    [{ id: 'valid-id', category: 'other' as 'prd', title: 'Valid title' }, 'Invalid artifact category: other'],
  ])('rejects invalid artifact identity data at the domain boundary', (artifact, message) => {
    const event = submission('prd', 'pm-alice', 'dev-jack');
    event.payload.artifact = { ...event.payload.artifact, ...artifact } as never;

    expect(() => applyBusinessEvent(createOfficeState(), event)).toThrowError(new OfficeDomainError(400, message));
  });

  it('keeps unknown, offline, and duplicate desk or artifact failures distinct', () => {
    expect(() => applyBusinessEvent(createOfficeState(), submission('prd', 'missing', 'dev-jack')))
      .toThrowError(new OfficeDomainError(404, 'Unknown desk: missing'));
    expect(() => applyBusinessEvent(createOfficeState(), submission('prd', 'pm-cindy', 'dev-jack')))
      .toThrowError(new OfficeDomainError(409, 'Desk is offline: pm-cindy'));

    const first = applyBusinessEvent(createOfficeState(), submission('prd', 'pm-alice', 'dev-jack', 'duplicate-task8'));
    expect(() => applyBusinessEvent(first, submission('prd', 'pm-bob', 'dev-kara', 'duplicate-task8')))
      .toThrowError(new OfficeDomainError(409, 'Artifact already exists: duplicate-task8'));
  });

  it('queues multiple valid business events in FIFO order without accepting assignments', () => {
    let state = applyBusinessEvent(createOfficeState(), submission('prd', 'pm-alice', 'dev-jack', 'task8-first'));
    state = applyBusinessEvent(state, submission('feature', 'dev-jack', 'qa-quinn', 'task8-second'));

    expect(state.activeMotion).toMatchObject({ artifactId: 'task8-first', phase: 'producer-to-hub' });
    expect(state.motionQueue).toEqual([expect.objectContaining({ artifactId: 'task8-second', phase: 'producer-to-hub' })]);
    expect(state.notifications).toEqual([
      expect.objectContaining({ artifactId: 'task8-first', status: 'pending_delivery', canAccept: false }),
      expect.objectContaining({ artifactId: 'task8-second', status: 'pending_delivery', canAccept: false }),
    ]);
  });
});
