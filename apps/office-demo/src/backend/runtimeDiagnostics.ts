import type { RejectedEventRecord } from './eventLedger';
import type { OfficeSnapshot } from './officeDomain';
import type { SanitizedEventResult } from './eventResultStore';

export type RuntimeHealth = {
  overall: 'healthy' | 'degraded' | 'offline';
  gateway: 'up' | 'down';
  ledger: 'writable' | 'read_only' | 'error';
  projection: 'ready' | 'recovering' | 'degraded';
  epoch: number;
  revision: number;
  lastSequence: number;
  activeMotionCount: 0 | 1;
  motionQueueCount: number;
  updatedAt: string;
};

export type ProjectionRuntimeSummary = {
  pendingDeliveryCount: number;
  awaitingAcceptanceCount: number;
  collectingCount: number;
  activeWorkCount: number;
};

export type DiagnosticConnectionState = {
  mode: 'connecting' | 'sse' | 'polling' | 'offline';
  failures: number;
  reason?: string;
  sseState: 'connecting' | 'connected' | 'reconnecting';
  lastSnapshotAt: string | null;
  reconnectCount: number;
  pollingFallback: boolean;
};

export type SanitizedRejectedEvent = {
  rejectedAt: string;
  eventId?: string;
  eventType?: string;
  sourceSystem?: string;
  correlationId?: string;
  reasonCode: string;
  message: string;
};

export type DiagnosticBundle = {
  generatedAt: string;
  appVersion: string;
  schemaVersion: '1.0';
  health: RuntimeHealth;
  connection: DiagnosticConnectionState;
  recentEventResults: SanitizedEventResult[];
  rejectedEvents: SanitizedRejectedEvent[];
};

type DiagnosticsInput = {
  snapshot: OfficeSnapshot | null;
  gatewayUp: boolean;
  ledgerState: 'healthy' | 'read_only' | 'degraded' | 'error';
  projectionState: 'ready' | 'recovering' | 'degraded';
  lastSequence: number;
  updatedAt: string;
  connectionDegraded?: boolean;
};

export function deriveRuntimeDiagnostics(input: DiagnosticsInput) {
  const snapshot = input.snapshot;
  const ledger: RuntimeHealth['ledger'] = input.ledgerState === 'healthy' ? 'writable' : input.ledgerState === 'read_only' ? 'read_only' : 'error';
  const readable = snapshot !== null;
  const overall = !readable || !input.gatewayUp
    ? 'offline' as const
    : ledger === 'writable' && input.projectionState === 'ready' && !input.connectionDegraded
      ? 'healthy' as const
      : 'degraded' as const;
  const artifacts = snapshot ? Object.values(snapshot.artifacts) : [];
  return {
    health: {
      overall,
      gateway: input.gatewayUp ? 'up' as const : 'down' as const,
      ledger,
      projection: input.projectionState,
      epoch: snapshot?.epoch ?? 0,
      revision: snapshot?.revision ?? 0,
      lastSequence: input.lastSequence,
      activeMotionCount: snapshot?.activeMotion ? 1 as const : 0 as const,
      motionQueueCount: snapshot?.motionQueue.length ?? 0,
      updatedAt: input.updatedAt,
    },
    runtime: {
      pendingDeliveryCount: artifacts.filter((artifact) => artifact.status === 'Delivering').length,
      awaitingAcceptanceCount: artifacts.filter((artifact) => artifact.status === 'Awaiting Acceptance').length,
      collectingCount: artifacts.filter((artifact) => artifact.status === 'Collecting').length,
      activeWorkCount: snapshot?.scenario.people.reduce((total, person) => total + person.activeWorks.length, 0) ?? 0,
    },
  };
}

function safeMessage(message: string) {
  return message
    .replace(/[A-Za-z]:\\(?:[^\\\s]+\\)*[^\\\s]+/g, '[path]')
    .replace(/\/(?:[^/\s]+\/)+[^/\s]+/g, '[path]')
    .replace(/evidence\b[^,.;]*/gi, '[sensitive field redacted]')
    .slice(0, 240);
}

export function sanitizeRejectedEvent(record: RejectedEventRecord): SanitizedRejectedEvent {
  return {
    rejectedAt: record.rejectedAt,
    ...(record.eventId ? { eventId: record.eventId } : {}),
    ...(record.eventType ? { eventType: record.eventType } : {}),
    ...(record.sourceSystem ? { sourceSystem: record.sourceSystem } : {}),
    ...(record.correlationId ? { correlationId: record.correlationId } : {}),
    reasonCode: record.reasonCode,
    message: safeMessage(record.message),
  };
}

export function createDiagnosticBundle(input: Omit<DiagnosticBundle, 'schemaVersion'>): DiagnosticBundle {
  return { ...structuredClone(input), schemaVersion: '1.0' };
}

export function diagnosticBundleFilename(generatedAt: string) {
  const date = new Date(generatedAt);
  const digits = (value: number) => String(value).padStart(2, '0');
  return `office-diagnostics-${date.getUTCFullYear()}${digits(date.getUTCMonth() + 1)}${digits(date.getUTCDate())}-${digits(date.getUTCHours())}${digits(date.getUTCMinutes())}${digits(date.getUTCSeconds())}.json`;
}
