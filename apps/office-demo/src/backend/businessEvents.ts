import type { ArtifactCategory } from '../data/demoScenario';
import { ArtifactEvidenceValidationError, parseArtifactEvidence, type ArtifactEvidence } from '../domain/artifactEvidence';

export type BusinessEventEnvelope<TType extends string, TPayload> = {
  eventId: string;
  eventType: TType;
  schemaVersion: '1.0';
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  source: {
    system: string;
    actorId?: string;
  };
  payload: TPayload;
};

export type ArtifactSubmittedPayload = {
  artifact: { id: string; category: ArtifactCategory; title: string; evidence: ArtifactEvidence };
  producerDeskId: string;
  assigneeDeskId: string;
};

export type ArtifactDeliveredPayload = { artifactId: string; producerDeskId: string };
export type ArtifactAcceptedPayload = { artifactId: string; assigneeDeskId: string };
export type ArtifactReceivedPayload = { artifactId: string; assigneeDeskId: string };
export type ProjectionResetPayload = { reason: 'manual-reset' };

export type ArtifactSubmittedEvent = BusinessEventEnvelope<'artifact.submitted', ArtifactSubmittedPayload>;
export type ArtifactDeliveredEvent = BusinessEventEnvelope<'artifact.delivered', ArtifactDeliveredPayload>;
export type ArtifactAcceptedBusinessEvent = BusinessEventEnvelope<'artifact.accepted', ArtifactAcceptedPayload>;
export type ArtifactReceivedEvent = BusinessEventEnvelope<'artifact.received', ArtifactReceivedPayload>;
export type ProjectionResetEvent = BusinessEventEnvelope<'projection.reset', ProjectionResetPayload>;

export type BusinessEvent =
  | ArtifactSubmittedEvent
  | ArtifactDeliveredEvent
  | ArtifactAcceptedBusinessEvent
  | ArtifactReceivedEvent
  | ProjectionResetEvent;

export type MotionCompletedSignal = { type: 'motion.completed'; motionId: string };
export type BusinessEventMetadata = { eventId: string; occurredAt: string };
export type EventSource = { system: string; actorId?: string };

export class BusinessEventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessEventValidationError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isArtifactCategory = (value: unknown): value is ArtifactCategory => value === 'prd' || value === 'feature' || value === 'report';

function requireRecord(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) throw new BusinessEventValidationError(`${name} must be an object`);
  return value;
}

function requireString(value: unknown, name: string): string {
  if (!isString(value)) throw new BusinessEventValidationError(`${name} must be a non-empty string`);
  return value;
}

function parseOccurredAt(value: unknown): string {
  const occurredAt = requireString(value, 'occurredAt');
  if (!occurredAt.endsWith('Z') || Number.isNaN(Date.parse(occurredAt))) {
    throw new BusinessEventValidationError('occurredAt must be an ISO 8601 UTC string');
  }
  return occurredAt;
}

function parseSource(value: unknown): EventSource {
  const source = requireRecord(value, 'source');
  const result: EventSource = { system: requireString(source.system, 'source.system') };
  if (source.actorId !== undefined) result.actorId = requireString(source.actorId, 'source.actorId');
  return result;
}

function parseArtifact(value: unknown): ArtifactSubmittedPayload['artifact'] {
  const artifact = requireRecord(value, 'payload.artifact');
  const category = artifact.category;
  if (!isArtifactCategory(category)) throw new BusinessEventValidationError('payload.artifact.category must be prd, feature, or report');
  try {
    return {
      id: requireString(artifact.id, 'payload.artifact.id'),
      category,
      title: requireString(artifact.title, 'payload.artifact.title'),
      evidence: parseArtifactEvidence(category, artifact.evidence),
    };
  } catch (reason) {
    if (reason instanceof ArtifactEvidenceValidationError) throw new BusinessEventValidationError(reason.message);
    throw reason;
  }
}

function parseBase(value: unknown) {
  const envelope = requireRecord(value, 'Business event envelope');
  if (envelope.schemaVersion !== '1.0') throw new BusinessEventValidationError('schemaVersion must be 1.0');
  const base = {
    eventId: requireString(envelope.eventId, 'eventId'),
    eventType: requireString(envelope.eventType, 'eventType'),
    schemaVersion: '1.0' as const,
    occurredAt: parseOccurredAt(envelope.occurredAt),
    correlationId: requireString(envelope.correlationId, 'correlationId'),
    source: parseSource(envelope.source),
  };
  const causationId = envelope.causationId === undefined ? undefined : requireString(envelope.causationId, 'causationId');
  return { envelope, base, causationId };
}

export function parseBusinessEventEnvelope(value: unknown): BusinessEvent {
  const { envelope, base, causationId } = parseBase(value);
  const payload = requireRecord(envelope.payload, 'payload');
  if (
    (base.eventType === 'artifact.delivered' || base.eventType === 'artifact.accepted' || base.eventType === 'artifact.received')
    && causationId === undefined
  ) {
    throw new BusinessEventValidationError(`causationId is required for ${base.eventType}`);
  }
  const causal = causationId === undefined ? {} : { causationId };

  switch (base.eventType) {
    case 'artifact.submitted':
      return {
        ...base,
        ...causal,
        eventType: 'artifact.submitted',
        payload: {
          artifact: parseArtifact(payload.artifact),
          producerDeskId: requireString(payload.producerDeskId, 'payload.producerDeskId'),
          assigneeDeskId: requireString(payload.assigneeDeskId, 'payload.assigneeDeskId'),
        },
      };
    case 'artifact.delivered':
      return {
        ...base,
        ...causal,
        eventType: 'artifact.delivered',
        payload: {
          artifactId: requireString(payload.artifactId, 'payload.artifactId'),
          producerDeskId: requireString(payload.producerDeskId, 'payload.producerDeskId'),
        },
      };
    case 'artifact.accepted':
      return {
        ...base,
        ...causal,
        eventType: 'artifact.accepted',
        payload: {
          artifactId: requireString(payload.artifactId, 'payload.artifactId'),
          assigneeDeskId: requireString(payload.assigneeDeskId, 'payload.assigneeDeskId'),
        },
      };
    case 'artifact.received':
      return {
        ...base,
        ...causal,
        eventType: 'artifact.received',
        payload: {
          artifactId: requireString(payload.artifactId, 'payload.artifactId'),
          assigneeDeskId: requireString(payload.assigneeDeskId, 'payload.assigneeDeskId'),
        },
      };
    case 'projection.reset':
      if (payload.reason !== 'manual-reset') throw new BusinessEventValidationError('payload.reason must be manual-reset');
      return { ...base, ...causal, eventType: 'projection.reset', payload: { reason: 'manual-reset' } };
    default:
      throw new BusinessEventValidationError(`Unsupported business event: ${base.eventType}`);
  }
}

export function parseMotionCompletedSignal(value: unknown): MotionCompletedSignal {
  const signal = requireRecord(value, 'Runtime event');
  if (signal.type !== 'motion.completed') throw new BusinessEventValidationError('Runtime event type must be motion.completed');
  return { type: 'motion.completed', motionId: requireString(signal.motionId, 'motionId') };
}

let fallbackIdSequence = 0;

export function createBusinessEventMetadata(
  now: () => Date = () => new Date(),
  createId: () => string = () => {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
    fallbackIdSequence += 1;
    return `office-event-${Date.now().toString(36)}-${fallbackIdSequence.toString(36)}`;
  },
): BusinessEventMetadata {
  return { eventId: createId(), occurredAt: now().toISOString() };
}

export function createArtifactSubmittedEvent(
  payload: ArtifactSubmittedPayload,
  source: EventSource,
  metadata: BusinessEventMetadata = createBusinessEventMetadata(),
): ArtifactSubmittedEvent {
  return {
    ...metadata,
    eventType: 'artifact.submitted',
    schemaVersion: '1.0',
    correlationId: metadata.eventId,
    source,
    payload,
  };
}

export function createArtifactAcceptedEvent(
  payload: ArtifactAcceptedPayload,
  correlationId: string,
  causationId: string,
  source: EventSource,
  metadata: BusinessEventMetadata = createBusinessEventMetadata(),
): ArtifactAcceptedBusinessEvent {
  return {
    ...metadata,
    eventType: 'artifact.accepted',
    schemaVersion: '1.0',
    correlationId,
    causationId,
    source,
    payload,
  };
}

export function createProjectionResetEvent(
  source: EventSource,
  metadata: BusinessEventMetadata = createBusinessEventMetadata(),
): ProjectionResetEvent {
  return {
    ...metadata,
    eventType: 'projection.reset',
    schemaVersion: '1.0',
    correlationId: metadata.eventId,
    source,
    payload: { reason: 'manual-reset' },
  };
}
