import { describe, expect, it } from 'vitest';
import { applyBusinessEvent, createOfficeState } from '../src/backend/officeDomain';
import { createArtifactSubmittedEvent } from '../src/backend/businessEvents';

describe('Task 16 offline dispatch semantics', () => {
  it('allows a registered offline assignee to receive a pending artifact without accepting it', () => {
    const event = createArtifactSubmittedEvent({
      artifact: { id: 'offline-assignee-prd', category: 'prd', title: 'Offline Assignee PRD', evidence: { kind: 'prd', summary: 'A valid offline dispatch.', priority: 'P1', scope: ['Dispatch'], userStories: [{ id: 'US-1', statement: 'A planner can dispatch work.' }], acceptanceCriteria: ['The assignee receives a pending task.'] } },
      producerDeskId: 'pm-alice', assigneeDeskId: 'dev-mia',
    }, { system: 'operations-dispatch', actorId: 'pm-alice' });

    const state = applyBusinessEvent(createOfficeState(), event);

    expect(state.notifications).toContainEqual(expect.objectContaining({ artifactId: 'offline-assignee-prd', assigneeDeskId: 'dev-mia', canAccept: false, status: 'pending_delivery' }));
  });
});
