import { describe, expect, it } from 'vitest';
import {
  applyOfficeEvent,
  createOfficeState,
  OfficeDomainError,
  type ArtifactCompletedEvent,
} from '../src/backend/officeDomain';

const completion = (
  category: ArtifactCompletedEvent['artifact']['category'],
  producerDeskId: string,
  assigneeDeskId: string,
  id = `task8-${category}`,
): ArtifactCompletedEvent => ({
  type: 'artifact.completed',
  artifact: { id, category, title: `Task 8 ${category}` },
  producerDeskId,
  assigneeDeskId,
});

describe('Task 8 artifact routing contract', () => {
  it.each([
    ['prd', 'pm-alice', 'dev-jack'],
    ['feature', 'dev-jack', 'qa-quinn'],
    ['report', 'qa-quinn', 'pm-alice'],
  ] as const)('accepts the %s upstream-to-downstream route', (category, producerDeskId, assigneeDeskId) => {
    const next = applyOfficeEvent(createOfficeState(), completion(category, producerDeskId, assigneeDeskId));

    expect(next.artifacts[`task8-${category}`]).toMatchObject({ category, producerDeskId, assigneeDeskId });
  });

  it.each([
    ['prd', 'dev-jack', 'qa-quinn'],
    ['feature', 'pm-alice', 'dev-jack'],
    ['report', 'dev-jack', 'qa-quinn'],
  ] as const)('rejects the invalid %s workspace route', (category, producerDeskId, assigneeDeskId) => {
    expect(() => applyOfficeEvent(createOfficeState(), completion(category, producerDeskId, assigneeDeskId)))
      .toThrowError(new OfficeDomainError(409, `Invalid ${category} route: ${producerDeskId} -> ${assigneeDeskId}`));
  });

  it.each([
    [{ id: '   ', category: 'prd' as const, title: 'Valid title' }, 'Artifact ID is required'],
    [{ id: 'valid-id', category: 'prd' as const, title: '   ' }, 'Artifact title is required'],
    [{ id: 'valid-id', category: 'other' as 'prd', title: 'Valid title' }, 'Invalid artifact category: other'],
  ])('rejects invalid artifact identity data at the domain boundary', (artifact, message) => {
    const event = { ...completion('prd', 'pm-alice', 'dev-jack'), artifact };

    expect(() => applyOfficeEvent(createOfficeState(), event)).toThrowError(new OfficeDomainError(400, message));
  });

  it('keeps unknown, offline, and duplicate desk or artifact failures distinct', () => {
    expect(() => applyOfficeEvent(createOfficeState(), completion('prd', 'missing', 'dev-jack')))
      .toThrowError(new OfficeDomainError(404, 'Unknown desk: missing'));
    expect(() => applyOfficeEvent(createOfficeState(), completion('prd', 'pm-cindy', 'dev-jack')))
      .toThrowError(new OfficeDomainError(409, 'Desk is offline: pm-cindy'));

    const first = applyOfficeEvent(createOfficeState(), completion('prd', 'pm-alice', 'dev-jack', 'duplicate-task8'));
    expect(() => applyOfficeEvent(first, completion('prd', 'pm-bob', 'dev-kara', 'duplicate-task8')))
      .toThrowError(new OfficeDomainError(409, 'Artifact already exists: duplicate-task8'));
  });

  it('queues multiple valid business events in FIFO order without accepting assignments', () => {
    let state = applyOfficeEvent(createOfficeState(), completion('prd', 'pm-alice', 'dev-jack', 'task8-first'));
    state = applyOfficeEvent(state, completion('feature', 'dev-jack', 'qa-quinn', 'task8-second'));

    expect(state.activeMotion).toMatchObject({ artifactId: 'task8-first', phase: 'producer-to-hub' });
    expect(state.motionQueue).toEqual([expect.objectContaining({ artifactId: 'task8-second', phase: 'producer-to-hub' })]);
    expect(state.notifications).toEqual([
      expect.objectContaining({ artifactId: 'task8-first', status: 'pending_delivery', canAccept: false }),
      expect.objectContaining({ artifactId: 'task8-second', status: 'pending_delivery', canAccept: false }),
    ]);
  });
});
