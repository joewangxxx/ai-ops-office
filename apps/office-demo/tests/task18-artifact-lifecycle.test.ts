import { describe, expect, it } from 'vitest';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import type { PersistedBusinessEvent } from '../src/backend/eventLedger';
import { InvalidArtifactCursorError, getOperationsArtifactState, getOperationsArtifactTimeline, listOperationsArtifacts } from '../src/domain/operationsArtifacts';

describe('Task 18 artifact lifecycle selector', () => {
  it('maps projection facts to one Operations lifecycle label without exposing runtime values', () => {
    const state = createOfficeState();
    state.artifacts['runtime-delivering'] = { id: 'runtime-delivering', category: 'prd', title: 'Runtime PRD', producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack', location: 'carrier', status: 'Delivering', deskId: 'pm-alice' };
    state.artifacts['runtime-awaiting'] = { id: 'runtime-awaiting', category: 'prd', title: 'Hub PRD', producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack', location: 'hub', status: 'Awaiting Acceptance' };
    state.artifacts['runtime-collecting'] = { id: 'runtime-collecting', category: 'prd', title: 'Collecting PRD', producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack', location: 'carrier', status: 'Collecting', deskId: 'dev-jack' };
    state.artifacts['runtime-received'] = { id: 'runtime-received', category: 'prd', title: 'Received PRD', producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack', location: 'desk', status: 'Accepted', deskId: 'dev-jack' };

    const snapshot = toOfficeSnapshot(state);
    expect(getOperationsArtifactState('runtime-delivering', snapshot)).toBe('Delivering');
    expect(getOperationsArtifactState('runtime-awaiting', snapshot)).toBe('Awaiting Acceptance');
    expect(getOperationsArtifactState('runtime-collecting', snapshot)).toBe('Collecting');
    expect(getOperationsArtifactState('runtime-received', snapshot)).toBe('Active Work');
    expect(getOperationsArtifactState('login-requirement-prd-v1', snapshot)).toBe('Active Work');
  });

  it('creates a sanitized list model with stable pagination and no evidence bodies', () => {
    const snapshot = toOfficeSnapshot(createOfficeState());
    const page = listOperationsArtifacts(snapshot, { query: 'login', limit: 1, sort: 'title', direction: 'asc' });
    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBeTruthy();
    expect(JSON.stringify(page.items)).not.toMatch(/acceptanceCriteria|commits|testCases/);
  });

  it('filters the read model by category, lifecycle and workspace before applying a stable cursor', () => {
    const snapshot = toOfficeSnapshot(createOfficeState());
    const page = listOperationsArtifacts(snapshot, { category: 'report', lifecycleState: 'Awaiting Acceptance', workspaceId: 'qa-lab', limit: 25, sort: 'title', direction: 'asc' });
    expect(page.items.map((item) => item.id)).toEqual(['login-regression-report-v1']);
  });

  it('uses a revision-bound cursor instead of a mutable numeric offset', () => {
    const snapshot = toOfficeSnapshot(createOfficeState());
    const firstPage = listOperationsArtifacts(snapshot, { limit: 2, sort: 'title', direction: 'asc' });
    expect(firstPage.nextCursor).toBeTruthy();
    const secondPage = listOperationsArtifacts(snapshot, { limit: 2, sort: 'title', direction: 'asc', cursor: firstPage.nextCursor! });
    expect(new Set([...firstPage.items, ...secondPage.items].map((item) => item.id)).size).toBe(4);
    expect(() => listOperationsArtifacts({ ...snapshot, revision: snapshot.revision + 1 }, { limit: 2, sort: 'title', direction: 'asc', cursor: firstPage.nextCursor! })).toThrow(InvalidArtifactCursorError);
  });

  it('builds a lifecycle chain from artifact, correlation, and causation identifiers without accepting a mismatched correlation', () => {
    const state = createOfficeState();
    state.scenario.artifacts.push({ id: 'trace-prd', category: 'prd', title: 'Trace PRD', status: 'Submitted', submittedBy: 'Alice', confirmedBy: 'Bob', acceptedBy: 'Jack', evidence: state.scenario.artifacts[0]!.evidence });
    state.artifacts['trace-prd'] = { id: 'trace-prd', category: 'prd', title: 'Trace PRD', producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack', location: 'desk', status: 'Accepted' };
    const record = (eventId: string, eventType: string, occurredAt: string, causationId?: string, correlationId = 'trace-chain'): PersistedBusinessEvent => ({ sequence: 1, epoch: 0, receivedAt: occurredAt, envelope: { eventId, eventType, schemaVersion: '1.0', occurredAt, correlationId, ...(causationId ? { causationId } : {}), source: { system: 'test' }, payload: eventType === 'artifact.submitted' ? { artifact: { id: 'trace-prd' } } : { artifactId: 'trace-prd' } } });
    const timeline = getOperationsArtifactTimeline('trace-prd', toOfficeSnapshot(state), [record('submitted', 'artifact.submitted', '2026-07-24T10:00:00.000Z'), record('delivered', 'artifact.delivered', '2026-07-24T10:01:00.000Z', 'submitted'), record('accepted', 'artifact.accepted', '2026-07-24T10:02:00.000Z', 'delivered'), record('received', 'artifact.received', '2026-07-24T10:03:00.000Z', 'accepted'), record('foreign', 'artifact.accepted', '2026-07-24T10:04:00.000Z', undefined, 'different-chain')]);
    expect(timeline?.filter((item): item is Extract<typeof item, { kind: 'event' }> => item.kind === 'event').map((item) => item.eventType)).toEqual(['artifact.submitted', 'artifact.delivered', 'artifact.accepted', 'artifact.received']);
  });
});
