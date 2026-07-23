import { createHash } from 'node:crypto';
import type { BusinessEvent, MotionCompletedSignal } from './businessEvents';
import type { EventLedger, RejectedEventRecord } from './eventLedger';
import { hashPayload, LedgerCorruptionError } from './eventLedger';
import {
  applyBusinessEvent,
  applyRuntimeEvent,
  createOfficeState,
  hydrateOfficeState,
  OfficeDomainError,
  reconcileIncompleteHandoffs,
  toOfficeSnapshot,
  type OfficeSnapshot,
  type OfficeState,
} from './officeDomain';
import type { PersistedProjectionSnapshot, ProjectionSnapshotStore } from './projectionSnapshotStore';
import { createProjectionPublisher, type ProjectionPublisher } from './projectionPublisher';

export type StoreResponse = { status: number; body: unknown };
export type TimerHandle = ReturnType<typeof setTimeout>;
export type OfficePersistence = { ledger: EventLedger; snapshotStore: ProjectionSnapshotStore; snapshotEvery?: number };
export type OfficeStoreDependencies = {
  now?: () => Date;
  setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimer?: (timer: TimerHandle) => void;
  initialEpoch?: number;
  fallbackPaddingMs?: number;
  persistence?: OfficePersistence;
  publisher?: ProjectionPublisher;
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, stableValue(child)]));
  }
  return value;
}

export function stableEnvelopeHash(event: BusinessEvent): string {
  return createHash('sha256').update(JSON.stringify(stableValue(event))).digest('hex');
}

export function createOfficeStore(dependencies: OfficeStoreDependencies = {}) {
  const now = dependencies.now ?? (() => new Date());
  const setTimer = dependencies.setTimer ?? ((callback, delayMs) => setTimeout(callback, delayMs));
  const clearTimer = dependencies.clearTimer ?? ((timer) => clearTimeout(timer));
  const persistence = dependencies.persistence;
  const snapshotEvery = persistence?.snapshotEvery ?? 20;
  const fallbackPaddingMs = dependencies.fallbackPaddingMs ?? 800;
  let state: OfficeState = createOfficeState(dependencies.initialEpoch);
  let fallbackTimer: TimerHandle | null = null;
  let lastSequence = 0;
  let acceptedSinceSnapshot = 0;
  let degraded = false;
  let degradedMessage: string | undefined;
  const idempotencyIndex = new Map<string, string>();
  let operationQueue: Promise<void> = Promise.resolve();
  const publisher = dependencies.publisher ?? createProjectionPublisher({ epoch: state.epoch, revision: state.revision, sequence: 0, snapshot: toOfficeSnapshot(state) });

  const publish = () => publisher.publish({ epoch: state.epoch, revision: state.revision, sequence: lastSequence, snapshot: toOfficeSnapshot(state) });

  const cancelFallback = () => {
    if (fallbackTimer !== null) clearTimer(fallbackTimer);
    fallbackTimer = null;
  };

  const responseFor = (event: BusinessEvent, status: 'accepted' | 'duplicate') => ({
    status,
    eventId: event.eventId,
    revision: state.revision,
    snapshot: toOfficeSnapshot(state),
  });

  const saveSnapshot = async () => {
    if (!persistence) return;
    const snapshot: PersistedProjectionSnapshot = {
      formatVersion: 1,
      epoch: state.epoch,
      lastSequence,
      savedAt: now().toISOString(),
      projection: toOfficeSnapshot(state),
      idempotencyIndex: Object.fromEntries(idempotencyIndex),
    };
    await persistence.snapshotStore.save(snapshot);
    acceptedSinceSnapshot = 0;
  };

  const recover = async () => {
    if (!persistence) return;
    const snapshot = await persistence.snapshotStore.load();
    if (snapshot) {
      state = hydrateOfficeState(snapshot.projection);
      lastSequence = snapshot.lastSequence;
      for (const [eventId, hash] of Object.entries(snapshot.idempotencyIndex)) idempotencyIndex.set(eventId, hash);
    }
    try {
      for await (const record of persistence.ledger.readAfter(lastSequence)) {
        const event = record.envelope as BusinessEvent;
        state = applyBusinessEvent(state, event, { mode: 'recovery' });
        lastSequence = record.sequence;
        idempotencyIndex.set(event.eventId, stableEnvelopeHash(event));
      }
    } catch (reason) {
      if (!(reason instanceof LedgerCorruptionError)) throw reason;
      degraded = true;
      degradedMessage = reason.message;
    }
    state = reconcileIncompleteHandoffs(state);
    // Presentation-only runtime transitions are intentionally not ledgered. Reserve
    // enough revision space per durable event that crash recovery never regresses
    // the same epoch below a revision a connected client may already have seen.
    state.revision = Math.max(state.revision, lastSequence * 3);
    if (snapshot || lastSequence > 0) publish();
  };

  const ready = recover();

  const appendRejected = async (event: Partial<BusinessEvent> | undefined, reasonCode: string, message: string, payload?: unknown) => {
    if (!persistence) return;
    const record: RejectedEventRecord = {
      rejectedAt: now().toISOString(),
      ...(typeof event?.eventId === 'string' ? { eventId: event.eventId } : {}),
      ...(typeof event?.eventType === 'string' ? { eventType: event.eventType } : {}),
      ...(typeof event?.source?.system === 'string' ? { sourceSystem: event.source.system } : {}),
      ...(typeof event?.correlationId === 'string' ? { correlationId: event.correlationId } : {}),
      reasonCode,
      message,
      payloadHash: hashPayload(payload),
    };
    try { await persistence.ledger.appendRejected(record); } catch { /* rejection diagnostics must not mutate projection */ }
  };

  const appendAccepted = async (event: BusinessEvent, next: OfficeState) => {
    if (!persistence) return true;
    try {
      const sequence = lastSequence + 1;
      await persistence.ledger.append({ sequence, epoch: next.epoch, receivedAt: now().toISOString(), envelope: event });
      lastSequence = sequence;
      return true;
    } catch {
      return false;
    }
  };

  const scheduleFallback = () => {
    cancelFallback();
    const motion = state.activeMotion;
    if (!motion) return;
    const expectedDurationMs = Math.max(1, motion.waypoints.length) * motion.transitionDurationMs;
    const motionId = motion.id;
    fallbackTimer = setTimer(() => {
      fallbackTimer = null;
      if (state.activeMotion?.id !== motionId) return;
      if (!persistence) {
        try { acceptRuntimeSignalSync({ type: 'motion.completed', motionId }); } catch { scheduleFallback(); }
      } else {
        void acceptRuntimeSignal({ type: 'motion.completed', motionId }).then(scheduleFallback, scheduleFallback);
      }
    }, expectedDurationMs + fallbackPaddingMs);
  };

  const commitBusinessEvent = async (event: BusinessEvent): Promise<StoreResponse> => {
    if (degraded) return { status: 503, body: { error: degradedMessage ?? 'Event ledger is degraded' } };
    const hash = stableEnvelopeHash(event);
    const existing = idempotencyIndex.get(event.eventId);
    if (existing) {
      if (existing !== hash) return { status: 409, body: { error: `eventId content conflict: ${event.eventId}` } };
      return { status: 200, body: responseFor(event, 'duplicate') };
    }
    let next: OfficeState;
    try { next = applyBusinessEvent(state, event); } catch (reason) {
      if (reason instanceof OfficeDomainError) await appendRejected(event, 'domain_rejected', reason.message, event.payload);
      throw reason;
    }
    if (!(await appendAccepted(event, next))) return { status: 503, body: { error: 'Event ledger append failed' } };
    if (event.eventType === 'projection.reset') cancelFallback();
    state = next;
    idempotencyIndex.set(event.eventId, hash);
    acceptedSinceSnapshot += 1;
    if (persistence && (event.eventType === 'projection.reset' || acceptedSinceSnapshot >= snapshotEvery)) {
      try { await saveSnapshot(); } catch { /* ledger remains authoritative */ }
    }
    publish();
    scheduleFallback();
    return { status: 202, body: responseFor(event, 'accepted') };
  };

  const commitRuntimeSignal = async (signal: MotionCompletedSignal): Promise<StoreResponse> => {
    if (degraded) return { status: 503, body: { error: degradedMessage ?? 'Event ledger is degraded' } };
    const applied = applyRuntimeEvent(state, signal, now().toISOString());
    if (applied.derivedEvent) {
      const existing = idempotencyIndex.get(applied.derivedEvent.eventId);
      if (!existing) {
        if (!(await appendAccepted(applied.derivedEvent, applied.state))) return { status: 503, body: { error: 'Event ledger append failed' } };
        idempotencyIndex.set(applied.derivedEvent.eventId, stableEnvelopeHash(applied.derivedEvent));
        acceptedSinceSnapshot += 1;
        if (persistence && acceptedSinceSnapshot >= snapshotEvery) {
          const previous = state;
          state = applied.state;
          try { await saveSnapshot(); } catch { /* ledger remains authoritative */ }
          state = previous;
        }
      }
    }
    state = applied.state;
    publish();
    scheduleFallback();
    return { status: 202, body: { status: 'accepted', motionId: signal.motionId, revision: state.revision, snapshot: toOfficeSnapshot(state) } };
  };

  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = operationQueue.then(async () => { await ready; return operation(); });
    operationQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  const acceptBusinessEvent = (event: BusinessEvent) => serialize(() => commitBusinessEvent(event));
  const acceptRuntimeSignal = (signal: MotionCompletedSignal) => serialize(() => commitRuntimeSignal(signal));

  const acceptBusinessEventSync = (event: BusinessEvent): StoreResponse => {
    if (persistence) throw new Error('Persistent stores require acceptBusinessEvent');
    const hash = stableEnvelopeHash(event);
    const existing = idempotencyIndex.get(event.eventId);
    if (existing) return existing === hash ? { status: 200, body: responseFor(event, 'duplicate') } : { status: 409, body: { error: `eventId content conflict: ${event.eventId}` } };
    if (event.eventType === 'projection.reset') cancelFallback();
    state = applyBusinessEvent(state, event);
    idempotencyIndex.set(event.eventId, hash);
    if (!persistence) lastSequence += 1;
    publish();
    scheduleFallback();
    return { status: 202, body: responseFor(event, 'accepted') };
  };

  const acceptRuntimeSignalSync = (signal: MotionCompletedSignal): StoreResponse => {
    if (persistence) throw new Error('Persistent stores require acceptRuntimeSignal');
    const applied = applyRuntimeEvent(state, signal, now().toISOString());
    state = applied.state;
    if (applied.derivedEvent) idempotencyIndex.set(applied.derivedEvent.eventId, stableEnvelopeHash(applied.derivedEvent));
    if (applied.derivedEvent) lastSequence += 1;
    publish();
    scheduleFallback();
    return { status: 202, body: { status: 'accepted', motionId: signal.motionId, revision: state.revision, snapshot: toOfficeSnapshot(state) } };
  };

  return {
    ready,
    snapshot: () => toOfficeSnapshot(state),
    status: () => ({ state: degraded ? 'degraded' as const : 'healthy' as const, epoch: state.epoch, lastSequence, message: degradedMessage }),
    publisher,
    acceptBusinessEvent,
    acceptRuntimeSignal,
    acceptBusinessEventSync,
    acceptRuntimeSignalSync,
    recordRejected: appendRejected,
    async recentPersistedEvents(limit: number) {
      await ready;
      return persistence ? persistence.ledger.recent(Math.max(0, Math.min(100, limit))) : [];
    },
    async recentRejectedEvents(limit: number) {
      await ready;
      return persistence ? persistence.ledger.recentRejected(Math.max(0, Math.min(100, limit))) : [];
    },
    async dispose() {
      cancelFallback();
      await operationQueue;
      await ready;
      if (persistence) { try { await saveSnapshot(); } finally { await persistence.ledger.close(); } }
    },
  };
}
