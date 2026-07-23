import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import {
  BusinessEventValidationError,
  parseBusinessEventEnvelope,
  parseMotionCompletedSignal,
  type BusinessEvent,
} from './businessEvents';
import { InMemoryEventLedger, JsonlEventLedger } from './eventLedger';
import { createEventResultStore, type EventResultStore, type SanitizedEventResult } from './eventResultStore';
import { OfficeDomainError, type OfficeSnapshot } from './officeDomain';
import { createOfficeStore, type OfficePersistence, type OfficeStoreDependencies } from './officeStore';
import { InMemoryProjectionSnapshotStore, JsonProjectionSnapshotStore } from './projectionSnapshotStore';
import type { ProjectionPublisher, ProjectionStreamMessage } from './projectionPublisher';

export type OfficeApiResponse = { status: number; body: unknown };
export type AcceptedEventResponse = {
  status: 'accepted' | 'duplicate';
  eventId: string;
  revision: number;
  snapshot: OfficeSnapshot;
};
export type OfficeApiDependencies = OfficeStoreDependencies & { eventResultStore?: EventResultStore };

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

function errorResponse(error: unknown): OfficeApiResponse {
  if (error instanceof OfficeDomainError) return { status: error.status, body: { error: error.message } };
  if (error instanceof BusinessEventValidationError) return { status: 400, body: { error: error.message } };
  return { status: 500, body: { error: 'Internal office API error' } };
}

export function createOfficeApiStore(dependencies: OfficeApiDependencies = {}) {
  const now = dependencies.now ?? (() => new Date());
  const store = createOfficeStore({ ...dependencies, now });
  const eventResults = dependencies.eventResultStore ?? createEventResultStore();

  const resultIdentity = (value: unknown) => {
    if (!isRecord(value)) return { eventId: 'unknown', eventType: 'unknown', sourceSystem: 'unknown', correlationId: 'unknown' };
    const source = isRecord(value.source) ? value.source : {};
    return {
      eventId: typeof value.eventId === 'string' ? value.eventId : 'unknown',
      eventType: typeof value.eventType === 'string' ? value.eventType : 'unknown',
      sourceSystem: typeof source.system === 'string' ? source.system : 'unknown',
      correlationId: typeof value.correlationId === 'string' ? value.correlationId : 'unknown',
    };
  };
  const recordResult = (event: BusinessEvent, response: OfficeApiResponse, reasonCode?: string) => {
    const body = isRecord(response.body) ? response.body : {};
    const result: SanitizedEventResult['result'] = response.status >= 400 ? 'rejected' : body.status === 'duplicate' ? 'duplicate' : 'accepted';
    eventResults.record({ timestamp: now().toISOString(), eventId: event.eventId, eventType: event.eventType, sourceSystem: event.source.system, correlationId: event.correlationId, result, ...(result === 'rejected' ? { reasonCode: reasonCode ?? (response.status === 409 ? 'event_conflict' : 'business_rejected') } : {}) });
  };
  const recordInvalid = (value: unknown, reasonCode = 'validation_rejected') => {
    eventResults.record({ timestamp: now().toISOString(), ...resultIdentity(value), result: 'rejected', reasonCode });
  };
  const acceptTrackedSync = (event: BusinessEvent) => {
    try { const response = store.acceptBusinessEventSync(event); recordResult(event, response); return response; }
    catch (reason) { recordResult(event, errorResponse(reason)); throw reason; }
  };
  const acceptTracked = async (event: BusinessEvent) => {
    try { const response = await store.acceptBusinessEvent(event); recordResult(event, response); return response; }
    catch (reason) { recordResult(event, errorResponse(reason)); throw reason; }
  };
  const ready = store.ready.then(async () => {
    if (eventResults.recent(1).length > 0) return;
    const recent = await store.recentPersistedEvents(20);
    for (const record of recent) {
      const event = record.envelope;
      eventResults.record({ timestamp: record.receivedAt, eventId: event.eventId, eventType: event.eventType, sourceSystem: event.source.system, correlationId: event.correlationId, result: 'accepted' });
    }
  });

  const handle = (method: string, path: string, body?: unknown): OfficeApiResponse => {
    try {
      if (method === 'GET' && path === '/api/office-state') return { status: 200, body: store.snapshot() };
      if (method === 'POST' && path === '/api/business-events') return acceptTrackedSync(parseBusinessEventEnvelope(body));
      if (method === 'POST' && path === '/api/runtime-events') return store.acceptRuntimeSignalSync(parseMotionCompletedSignal(body));
      return { status: 404, body: { error: 'Not found' } };
    } catch (error) { if (error instanceof BusinessEventValidationError) recordInvalid(body); return errorResponse(error); }
  };

  const handleAsync = async (method: string, path: string, body?: unknown): Promise<OfficeApiResponse> => {
    await ready;
    try {
      if (method === 'GET' && path === '/api/office-state') return { status: 200, body: store.snapshot() };
      if (method === 'POST' && path === '/api/business-events') return await acceptTracked(parseBusinessEventEnvelope(body));
      if (method === 'POST' && path === '/api/runtime-events') return await store.acceptRuntimeSignal(parseMotionCompletedSignal(body));
      return { status: 404, body: { error: 'Not found' } };
    } catch (error) {
      const response = errorResponse(error);
      if (error instanceof BusinessEventValidationError) {
        await store.recordRejected(isRecord(body) ? body as Partial<BusinessEvent> : undefined, 'validation_rejected', String((response.body as { error?: string }).error), body);
        recordInvalid(body);
      }
      return response;
    }
  };

  return {
    handle, handleAsync, ready, dispose: store.dispose, getPersistenceStatus: store.status, publisher: store.publisher, eventResults,
    recordRejected: store.recordRejected,
    recentRejectedEvents: store.recentRejectedEvents,
  };
}

function formatProjectionMessage(message: ProjectionStreamMessage) {
  return `id: ${message.epoch}:${message.revision}\nevent: snapshot\ndata: ${JSON.stringify(message)}\n\n`;
}

export function serveProjectionStream(
  request: IncomingMessage,
  response: ServerResponse,
  publisher: ProjectionPublisher,
  options: { heartbeatMs?: number; onClose?: () => void } = {},
) {
  const heartbeatMs = options.heartbeatMs ?? 15_000;
  let closed = false;
  let unsubscribe: () => void = () => undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    unsubscribe();
    if (heartbeat) clearInterval(heartbeat);
    request.removeListener('close', cleanup);
    response.removeListener('close', cleanup);
    options.onClose?.();
  };
  const write = (chunk: string) => {
    if (closed) return;
    if (!response.write(chunk)) { cleanup(); response.end(); }
  };

  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('X-Accel-Buffering', 'no');
  response.flushHeaders?.();
  request.on('close', cleanup);
  response.on('close', cleanup);

  const rawCursor = request.headers['last-event-id'];
  const cursor = Array.isArray(rawCursor) ? rawCursor[0] : rawCursor;
  const initial = cursor ? publisher.replayAfter(cursor) : [publisher.latest()];
  for (const message of initial) write(formatProjectionMessage(message));
  unsubscribe = publisher.subscribe((message) => write(formatProjectionMessage(message)));
  heartbeat = setInterval(() => write(`: heartbeat ${new Date().toISOString()}\n\n`), heartbeatMs);
  return cleanup;
}

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody, reject) => {
    let raw = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => { raw += chunk; });
    request.on('end', () => {
      if (!raw) return resolveBody(undefined);
      try { resolveBody(JSON.parse(raw)); } catch { reject(new OfficeDomainError(400, 'Request body must be valid JSON')); }
    });
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, result: OfficeApiResponse) {
  response.statusCode = result.status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(result.body));
}

const API_PATHS = new Set(['/api/office-state', '/api/office-stream', '/api/business-events', '/api/runtime-events']);

export function createLocalOfficePersistence(directory = resolve(process.cwd(), '.data')): OfficePersistence {
  return { ledger: new JsonlEventLedger({ directory }), snapshotStore: new JsonProjectionSnapshotStore({ directory }) };
}

export function createInMemoryOfficePersistence(): OfficePersistence {
  return { ledger: new InMemoryEventLedger(), snapshotStore: new InMemoryProjectionSnapshotStore() };
}

export function officeApiPlugin(options: { dataDirectory?: string } = {}): Plugin {
  return {
    name: 'office-api',
    apply: 'serve',
    configureServer(server) {
      const configuredPadding = Number(process.env.OFFICE_FALLBACK_PADDING_MS);
      const api = createOfficeApiStore({
        persistence: createLocalOfficePersistence(options.dataDirectory),
        ...(Number.isFinite(configuredPadding) && configuredPadding >= 0 ? { fallbackPaddingMs: configuredPadding } : {}),
      });
      const streamCleanups = new Set<() => void>();
      const connectionsByIp = new Map<string, number>();
      server.httpServer?.once('close', () => {
        for (const cleanup of [...streamCleanups]) cleanup();
        void api.dispose();
      });
      server.middlewares.use(async (request, response, next) => {
        const path = new URL(request.url ?? '/', 'http://office.local').pathname;
        if (!API_PATHS.has(path)) return next();
        try {
          if (request.method === 'GET' && path === '/api/office-stream') {
            await api.ready;
            const ip = request.socket.remoteAddress ?? 'unknown';
            const current = connectionsByIp.get(ip) ?? 0;
            if (current >= 5) { sendJson(response, { status: 429, body: { error: 'Too many office-stream connections' } }); return; }
            connectionsByIp.set(ip, current + 1);
            let cleanup: () => void = () => undefined;
            cleanup = serveProjectionStream(request, response, api.publisher, { onClose: () => {
              streamCleanups.delete(cleanup);
              const remaining = (connectionsByIp.get(ip) ?? 1) - 1;
              if (remaining > 0) connectionsByIp.set(ip, remaining); else connectionsByIp.delete(ip);
            } });
            streamCleanups.add(cleanup);
            return;
          }
          const body = request.method === 'POST' ? await readJsonBody(request) : undefined;
          sendJson(response, await api.handleAsync(request.method ?? 'GET', path, body));
        } catch (error) { sendJson(response, errorResponse(error)); }
      });
    },
  };
}
