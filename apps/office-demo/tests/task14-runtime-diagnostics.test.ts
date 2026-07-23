import { describe, expect, it } from 'vitest';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { createEventResultStore } from '../src/backend/eventResultStore';
import { createDiagnosticBundle, deriveRuntimeDiagnostics, sanitizeRejectedEvent } from '../src/backend/runtimeDiagnostics';

describe('Task 14 runtime diagnostics model', () => {
  it('keeps at most 100 sanitized event outcomes and returns newest entries in chronological order', () => {
    const store = createEventResultStore(100);
    for (let index = 0; index < 125; index += 1) {
      store.record({ timestamp: `2026-07-22T12:${String(index).padStart(2, '0')}:00.000Z`, eventId: `event-${index}`, eventType: 'artifact.submitted', sourceSystem: 'test', correlationId: `c-${index}`, result: 'accepted' });
    }
    expect(store.recent(200)).toHaveLength(100);
    expect(store.recent(20).map((entry) => entry.eventId)).toEqual(Array.from({ length: 20 }, (_, index) => `event-${105 + index}`));
    expect(JSON.stringify(store.recent(20))).not.toContain('payload');
  });

  it('derives healthy, degraded, and offline states plus projection-only aggregates', () => {
    const state = createOfficeState();
    state.artifacts.a = { id: 'a', category: 'prd', title: 'A', producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack', location: 'carrier', status: 'Delivering' };
    state.artifacts.b = { id: 'b', category: 'feature', title: 'B', producerDeskId: 'dev-jack', assigneeDeskId: 'qa-quinn', location: 'hub', status: 'Awaiting Acceptance' };
    state.artifacts.c = { id: 'c', category: 'report', title: 'C', producerDeskId: 'qa-quinn', assigneeDeskId: 'pm-alice', location: 'carrier', status: 'Collecting' };
    const snapshot = toOfficeSnapshot(state);
    const healthy = deriveRuntimeDiagnostics({ snapshot, gatewayUp: true, ledgerState: 'healthy', projectionState: 'ready', lastSequence: 9, updatedAt: '2026-07-22T12:00:00.000Z' });
    expect(healthy.health).toMatchObject({ overall: 'healthy', gateway: 'up', ledger: 'writable', projection: 'ready', lastSequence: 9 });
    expect(healthy.runtime).toMatchObject({ pendingDeliveryCount: 1, awaitingAcceptanceCount: 1, collectingCount: 1 });

    expect(deriveRuntimeDiagnostics({ snapshot, gatewayUp: true, ledgerState: 'degraded', projectionState: 'degraded', lastSequence: 9, updatedAt: '2026-07-22T12:00:00.000Z' }).health.overall).toBe('degraded');
    expect(deriveRuntimeDiagnostics({ snapshot: null, gatewayUp: false, ledgerState: 'error', projectionState: 'recovering', lastSequence: 0, updatedAt: '2026-07-22T12:00:00.000Z' }).health.overall).toBe('offline');
  });

  it('sanitizes rejected summaries and diagnostic bundles', () => {
    const rejected = sanitizeRejectedEvent({
      rejectedAt: '2026-07-22T12:00:00.000Z', eventId: 'bad-1', eventType: 'artifact.submitted', sourceSystem: 'gateway', correlationId: 'corr-1',
      reasonCode: 'validation_rejected', message: 'Invalid file C:\\Users\\private\\payload.json with evidence SECRET-EVIDENCE', payloadHash: 'abc',
    });
    expect(rejected.message).not.toContain('C:\\Users');
    expect(rejected).not.toHaveProperty('payloadHash');

    const diagnostics = deriveRuntimeDiagnostics({ snapshot: toOfficeSnapshot(createOfficeState()), gatewayUp: true, ledgerState: 'healthy', projectionState: 'ready', lastSequence: 0, updatedAt: '2026-07-22T12:00:00.000Z' });
    const bundle = createDiagnosticBundle({
      generatedAt: '2026-07-22T12:00:00.000Z', appVersion: '0.0.0', health: diagnostics.health,
      connection: { mode: 'sse', failures: 0, sseState: 'connected', lastSnapshotAt: '2026-07-22T12:00:00.000Z', reconnectCount: 0, pollingFallback: false },
      recentEventResults: [], rejectedEvents: [rejected],
    });
    const serialized = JSON.stringify(bundle);
    expect(bundle.schemaVersion).toBe('1.0');
    expect(serialized).not.toMatch(/Authorization|apiKey|evidence|C:\\Users/i);
  });
});
