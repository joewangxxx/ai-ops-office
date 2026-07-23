import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createArtifactAcceptedEvent,
  createBusinessEventMetadata,
  createProjectionResetEvent,
  type BusinessEvent,
  type BusinessEventMetadata,
  type MotionCompletedSignal,
} from '../backend/businessEvents';
import { createOfficeState, toOfficeSnapshot, type OfficeSnapshot } from '../backend/officeDomain';
import type { ProjectionStreamMessage } from '../backend/projectionPublisher';
import type { AcceptedEventResponse } from '../backend/viteOfficeApi';

const seedSnapshot = toOfficeSnapshot(createOfficeState());

type RuntimeEventResponse = { status: 'accepted'; motionId: string; revision: number; snapshot: OfficeSnapshot };

export type ProjectionConnectionState = {
  mode: 'connecting' | 'sse' | 'polling' | 'offline';
  failures: number;
  reason?: string;
  sseState: 'connecting' | 'connected' | 'reconnecting';
  lastSnapshotAt: string | null;
  lastMessageAt?: string;
  reconnectCount: number;
  pollingFallback: boolean;
};

export interface OfficeEventSource {
  onerror: ((event: Event) => void) | null;
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void;
  close(): void;
}

export type OfficeSynchronizationOptions = {
  eventSourceFactory?: ((url: string) => OfficeEventSource) | null;
  initialSnapshotTimeoutMs?: number;
  pollIntervalMs?: number;
  reconnectIntervalMs?: number;
  failureThreshold?: number;
};

export class OfficeApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'OfficeApiError';
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const message = body !== null && typeof body === 'object' && 'error' in body && typeof body.error === 'string' && body.error
      ? body.error : `Office API request failed (${response.status})`;
    throw new OfficeApiError(response.status, message);
  }
  return body as T;
}

function parseStreamMessage(value: string): ProjectionStreamMessage | null {
  try {
    const message: unknown = JSON.parse(value);
    if (message === null || typeof message !== 'object' || Array.isArray(message)) return null;
    const candidate = message as Partial<ProjectionStreamMessage>;
    if (!Number.isInteger(candidate.epoch) || !Number.isInteger(candidate.revision) || !Number.isInteger(candidate.sequence)
      || candidate.snapshot === null || typeof candidate.snapshot !== 'object') return null;
    if (candidate.snapshot.epoch !== candidate.epoch || candidate.snapshot.revision !== candidate.revision) return null;
    return candidate as ProjectionStreamMessage;
  } catch { return null; }
}

function defaultEventSourceFactory(): ((url: string) => OfficeEventSource) | null {
  return typeof EventSource === 'undefined' ? null : (url) => new EventSource(url);
}

export function useOfficeBackend(
  metadataFactory: () => BusinessEventMetadata = createBusinessEventMetadata,
  synchronizationOptions: OfficeSynchronizationOptions = {},
) {
  const optionsRef = useRef(synchronizationOptions);
  const options = optionsRef.current;
  const [snapshot, setSnapshot] = useState<OfficeSnapshot>(seedSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [pendingArtifactIds, setPendingArtifactIds] = useState<ReadonlySet<string>>(() => new Set());
  const [connectionState, setConnectionState] = useState<ProjectionConnectionState>({ mode: 'connecting', failures: 0, sseState: 'connecting', lastSnapshotAt: null, reconnectCount: 0, pollingFallback: false });
  const requestSequence = useRef(0);
  const committedRequestSequence = useRef(0);
  const snapshotRef = useRef(snapshot);

  const commitSnapshot = useCallback((next: OfficeSnapshot, request?: number) => {
    if (request !== undefined && request < committedRequestSequence.current) return false;
    const current = snapshotRef.current;
    if (next.epoch < current.epoch) return false;
    if (next.epoch === current.epoch && next.revision <= current.revision) return false;
    if (request !== undefined) committedRequestSequence.current = request;
    snapshotRef.current = next;
    setSnapshot(next);
    setError(null);
    return true;
  }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const request = ++requestSequence.current;
    try {
      const response = await fetch('/api/office-state', { signal });
      const next = await readJson<OfficeSnapshot>(response);
      commitSnapshot(next, request);
      return next;
    } catch (reason) {
      if (!signal?.aborted) setError(reason instanceof Error ? reason.message : 'Office API is unavailable');
      throw reason;
    }
  }, [commitSnapshot]);

  useEffect(() => {
    const eventSourceFactory = options.eventSourceFactory === undefined ? defaultEventSourceFactory() : options.eventSourceFactory;
    const initialSnapshotTimeoutMs = options.initialSnapshotTimeoutMs ?? 10_000;
    const pollIntervalMs = options.pollIntervalMs ?? 5_000;
    const reconnectIntervalMs = options.reconnectIntervalMs ?? 5_000;
    const failureThreshold = options.failureThreshold ?? 3;
    let stopped = false;
    let failures = 0;
    let source: OfficeEventSource | null = null;
    let initialTimer: number | undefined;
    let pollTimer: number | undefined;
    let reconnectTimer: number | undefined;
    let pollController: AbortController | null = null;
    let polling = false;
    let reconnectCount = 0;
    let attemptedConnection = false;
    let lastSnapshotAt: string | null = null;
    let pollingReason = 'SSE connection failed';

    const clearTimer = (timer: number | undefined) => { if (timer !== undefined) window.clearTimeout(timer); };
    const closeSource = () => { source?.close(); source = null; clearTimer(initialTimer); initialTimer = undefined; };
    const stopPolling = () => {
      polling = false;
      pollController?.abort(); pollController = null;
      clearTimer(pollTimer); pollTimer = undefined;
      clearTimer(reconnectTimer); reconnectTimer = undefined;
    };

    let connect = (_recovery = false) => undefined;
    const scheduleRecovery = () => {
      clearTimer(reconnectTimer);
      reconnectTimer = window.setTimeout(() => {
        if (!stopped && polling) connect(true);
      }, reconnectIntervalMs);
    };
    const poll = () => {
      if (stopped || !polling) return;
      pollController = new AbortController();
      void refresh(pollController.signal).then(() => {
        if (!stopped && polling) setConnectionState({ mode: 'polling', failures, reason: pollingReason, sseState: 'reconnecting', lastSnapshotAt, reconnectCount, pollingFallback: true });
      }).catch(() => {
        if (!stopped && polling) setConnectionState({ mode: 'offline', failures, reason: 'Office API is unavailable', sseState: 'reconnecting', lastSnapshotAt, reconnectCount, pollingFallback: true });
      }).finally(() => {
        pollController = null;
        if (!stopped && polling) pollTimer = window.setTimeout(poll, pollIntervalMs);
      });
    };
    const startPolling = (reason: string) => {
      closeSource();
      pollingReason = reason;
      if (!polling) {
        polling = true;
        setConnectionState({ mode: 'polling', failures, reason, sseState: 'reconnecting', lastSnapshotAt, reconnectCount, pollingFallback: true });
      }
      if (!pollController && pollTimer === undefined) poll();
      scheduleRecovery();
    };

    connect = (recovery = false) => {
      if (stopped) return;
      if (!eventSourceFactory) { failures = failureThreshold; startPolling('EventSource is unavailable'); return; }
      if (attemptedConnection) reconnectCount += 1; else attemptedConnection = true;
      if (recovery) {
        pollController?.abort(); pollController = null;
        clearTimer(pollTimer); pollTimer = undefined;
      }
      closeSource();
      setConnectionState({ mode: 'connecting', failures, sseState: reconnectCount > 0 ? 'reconnecting' : 'connecting', lastSnapshotAt, reconnectCount, pollingFallback: polling });
      source = eventSourceFactory('/api/office-stream');
      let receivedInitial = false;
      source.addEventListener('snapshot', (event) => {
        const message = parseStreamMessage(event.data);
        if (!message || stopped) return;
        receivedInitial = true;
        clearTimer(initialTimer); initialTimer = undefined;
        failures = 0;
        stopPolling();
        commitSnapshot(message.snapshot);
        setError(null);
        lastSnapshotAt = new Date().toISOString();
        setConnectionState({ mode: 'sse', failures: 0, sseState: 'connected', lastSnapshotAt, lastMessageAt: lastSnapshotAt, reconnectCount, pollingFallback: false });
      });
      source.onerror = () => {
        if (stopped) return;
        closeSource();
        failures += 1;
        if (recovery || failures >= failureThreshold) startPolling('SSE connection failed');
        else reconnectTimer = window.setTimeout(() => connect(false), 0);
      };
      initialTimer = window.setTimeout(() => {
        if (!receivedInitial && !stopped) startPolling('No initial SSE snapshot');
      }, initialSnapshotTimeoutMs);
    };

    connect();
    return () => { stopped = true; closeSource(); stopPolling(); };
  }, [commitSnapshot, options, refresh]);

  const postBusinessEvent = useCallback(async (event: BusinessEvent) => {
    const request = ++requestSequence.current;
    const acceptedArtifactId = event.eventType === 'artifact.accepted' ? event.payload.artifactId : null;
    if (acceptedArtifactId) setPendingArtifactIds((current) => new Set(current).add(acceptedArtifactId));
    try {
      const response = await fetch('/api/business-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
      const result = await readJson<AcceptedEventResponse>(response);
      commitSnapshot(result.snapshot, request);
      return result.snapshot;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Office API request failed');
      throw reason;
    } finally {
      if (acceptedArtifactId) setPendingArtifactIds((current) => { const next = new Set(current); next.delete(acceptedArtifactId); return next; });
    }
  }, [commitSnapshot]);

  const postRuntimeEvent = useCallback(async (signal: MotionCompletedSignal) => {
    const request = ++requestSequence.current;
    try {
      const response = await fetch('/api/runtime-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(signal) });
      const result = await readJson<RuntimeEventResponse>(response);
      commitSnapshot(result.snapshot, request);
      return result.snapshot;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Office API request failed');
      throw reason;
    }
  }, [commitSnapshot]);

  const acceptArtifact = useCallback(async (artifactId: string, assigneeDeskId: string) => {
    const notification = snapshotRef.current.notifications.find((item) => item.artifactId === artifactId);
    if (!notification) throw new OfficeApiError(404, `Unknown artifact notification: ${artifactId}`);
    return postBusinessEvent(createArtifactAcceptedEvent({ artifactId, assigneeDeskId }, notification.correlationId, notification.causationEventId, { system: 'office-ui', actorId: assigneeDeskId }, metadataFactory()));
  }, [metadataFactory, postBusinessEvent]);

  const resetProjection = useCallback(async () => {
    const next = await postBusinessEvent(createProjectionResetEvent({ system: 'event-console' }, metadataFactory()));
    setPendingArtifactIds(new Set());
    return next;
  }, [metadataFactory, postBusinessEvent]);

  return { snapshot, error, connectionState, pendingArtifactIds, postBusinessEvent, postRuntimeEvent, acceptArtifact, refresh, resetProjection };
}
