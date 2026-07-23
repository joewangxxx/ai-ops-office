import type { BusinessEvent, ArtifactSubmittedEvent } from '../../src/backend/businessEvents';
import {
  applyBusinessEvent,
  applyRuntimeEvent,
  type OfficeState,
} from '../../src/backend/officeDomain';
import type { ArtifactCategory } from '../../src/data/demoScenario';
import type { ArtifactEvidence } from '../../src/domain/artifactEvidence';

export function testEvidence(category: ArtifactCategory): ArtifactEvidence {
  if (category === 'prd') {
    return {
      kind: 'prd',
      summary: 'Defines the test handoff.',
      priority: 'P1',
      scope: ['Event-driven projection'],
      userStories: [{ id: 'TEST-1', statement: 'A producer submits a valid artifact.' }],
      acceptanceCriteria: ['The projection starts the handoff.'],
    };
  }
  if (category === 'feature') {
    return {
      kind: 'feature',
      summary: 'Implements the test handoff.',
      commits: [{ sha: 'abcdef1', message: 'feat: add tested handoff' }],
      changedFiles: 1,
      build: { status: 'passed', reference: 'test-build' },
      apiContracts: [],
    };
  }
  return {
    kind: 'report',
    summary: 'Verifies the test handoff.',
    result: 'passed',
    testCases: { total: 1, passed: 1, failed: 0 },
    regression: 'passed',
    bugs: [],
  };
}

export function submittedEvent(options: {
  id: string;
  category?: ArtifactCategory;
  title?: string;
  producerDeskId?: string;
  assigneeDeskId?: string;
  eventId?: string;
  occurredAt?: string;
  evidence?: ArtifactEvidence;
}): ArtifactSubmittedEvent {
  const category = options.category ?? 'prd';
  const eventId = options.eventId ?? `${options.id}:submitted`;
  return {
    eventId,
    eventType: 'artifact.submitted',
    schemaVersion: '1.0',
    occurredAt: options.occurredAt ?? '2026-07-22T06:00:00.000Z',
    correlationId: eventId,
    source: { system: 'test-suite', actorId: options.producerDeskId ?? 'pm-alice' },
    payload: {
      artifact: {
        id: options.id,
        category,
        title: options.title ?? options.id,
        evidence: options.evidence ?? testEvidence(category),
      },
      producerDeskId: options.producerDeskId ?? 'pm-alice',
      assigneeDeskId: options.assigneeDeskId ?? 'dev-jack',
    },
  };
}

export function acceptedEvent(
  state: OfficeState,
  artifactId: string,
  assigneeDeskId: string,
  eventId = `${artifactId}:accepted`,
): BusinessEvent {
  const notification = state.notifications.find((item) => item.artifactId === artifactId);
  if (!notification) throw new Error(`Missing test notification for ${artifactId}`);
  return {
    eventId,
    eventType: 'artifact.accepted',
    schemaVersion: '1.0',
    occurredAt: '2026-07-22T06:01:00.000Z',
    correlationId: notification.correlationId,
    causationId: notification.causationEventId,
    source: { system: 'test-suite', actorId: assigneeDeskId },
    payload: { artifactId, assigneeDeskId },
  };
}

export function submitArtifact(state: OfficeState, event: ArtifactSubmittedEvent): OfficeState {
  return applyBusinessEvent(state, event);
}

export function acceptArtifact(
  state: OfficeState,
  artifactId: string,
  assigneeDeskId: string,
  eventId?: string,
): OfficeState {
  return applyBusinessEvent(state, acceptedEvent(state, artifactId, assigneeDeskId, eventId));
}

export function completeActiveMotion(state: OfficeState): OfficeState {
  if (!state.activeMotion) throw new Error('Expected an active test motion');
  return applyRuntimeEvent(state, { type: 'motion.completed', motionId: state.activeMotion.id }).state;
}
