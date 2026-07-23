import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { BusinessEventValidationError, type BusinessEvent } from '../src/backend/businessEvents';
import { CanonicalEventAdapter } from '../src/backend/incomingEventAdapter';
import type { OfficePersistence } from '../src/backend/officeStore';
import { createDiagnosticBundle, deriveRuntimeDiagnostics, diagnosticBundleFilename, sanitizeRejectedEvent, type DiagnosticConnectionState } from '../src/backend/runtimeDiagnostics';
import { createLocalOfficePersistence, createOfficeApiStore, serveProjectionStream, type OfficeApiResponse } from '../src/backend/viteOfficeApi';
import { authenticateApiClient, type ApiClientConfig, type GatewayConfig } from './config';

export type GatewayLogEntry = {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  correlationId: string;
  eventId?: string;
  eventType?: string;
  sourceSystem?: string;
  result: string;
  durationMs: number;
  reasonCode?: string;
};

export type OfficeGatewayAddress = { host: string; port: number; origin: string };
export type OfficeGateway = {
  readonly server: Server;
  readonly api: ReturnType<typeof createOfficeApiStore>;
  start(): Promise<OfficeGatewayAddress>;
  close(): Promise<void>;
};

type GatewayOptions = {
  config: GatewayConfig;
  clients: readonly ApiClientConfig[];
  persistence?: OfficePersistence;
  logger?: (entry: GatewayLogEntry) => void;
  now?: () => Date;
  createCorrelationId?: () => string;
  fallbackPaddingMs?: number;
};

class RequestBodyError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const EXTERNAL_TYPES = new Set(['artifact.submitted', 'artifact.accepted']);
const INTERNAL_PATHS = new Set(['/api/office-state', '/api/office-stream', '/api/business-events', '/api/runtime-events']);
const INTERNAL_DIAGNOSTIC_PATHS = new Set(['/api/internal/diagnostics', '/api/internal/rejected-events', '/api/internal/recent-events', '/api/internal/diagnostic-bundle']);
const CORRELATION_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

function sendJson(response: ServerResponse, result: OfficeApiResponse) {
  if (response.writableEnded) return;
  response.statusCode = result.status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(result.body));
}

function isJsonRequest(request: IncomingMessage) {
  const contentType = request.headers['content-type'];
  return typeof contentType === 'string' && contentType.split(';', 1)[0]?.trim().toLowerCase() === 'application/json';
}

async function readJsonBody(request: IncomingMessage, maxBodyBytes: number): Promise<unknown> {
  const contentLength = Number(request.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) { request.resume(); throw new RequestBodyError(413, 'Request body is too large'); }
  return new Promise((resolveBody, reject) => {
    let raw = '';
    let bytes = 0;
    let exceeded = false;
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      if (exceeded) return;
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxBodyBytes) { exceeded = true; reject(new RequestBodyError(413, 'Request body is too large')); return; }
      raw += chunk;
    });
    request.on('end', () => {
      if (exceeded) return;
      if (!raw) { resolveBody(undefined); return; }
      try { resolveBody(JSON.parse(raw)); } catch { reject(new RequestBodyError(400, 'Request body must be valid JSON')); }
    });
    request.on('error', reject);
  });
}

function publicEventResponse(result: OfficeApiResponse): OfficeApiResponse {
  if (!isRecord(result.body)) return result;
  const { status, eventId, revision } = result.body;
  if ((status === 'accepted' || status === 'duplicate') && typeof eventId === 'string' && typeof revision === 'number') {
    return { status: result.status, body: { status, eventId, revision } };
  }
  return result;
}

function eventIdentity(value: unknown) {
  if (!isRecord(value)) return {};
  return {
    ...(typeof value.eventId === 'string' ? { eventId: value.eventId } : {}),
    ...(typeof value.eventType === 'string' ? { eventType: value.eventType } : {}),
  };
}

function injectedIndex(html: string, eventConsoleEnabled: boolean) {
  const script = `<script>window.__OFFICE_CONFIG__={"eventConsoleEnabled":${eventConsoleEnabled},"diagnosticsEnabled":${eventConsoleEnabled}};</script>`;
  return html.includes('</head>') ? html.replace('</head>', `${script}</head>`) : `${script}${html}`;
}

export function createOfficeGateway(options: GatewayOptions): OfficeGateway {
  const now = options.now ?? (() => new Date());
  const logger = options.logger ?? ((entry: GatewayLogEntry) => console.log(JSON.stringify(entry)));
  const createCorrelationId = options.createCorrelationId ?? randomUUID;
  const persistence = options.persistence ?? createLocalOfficePersistence(options.config.dataDirectory);
  const api = createOfficeApiStore({ persistence, now, ...(options.fallbackPaddingMs === undefined ? {} : { fallbackPaddingMs: options.fallbackPaddingMs }) });
  const adapter = new CanonicalEventAdapter();
  const streamCleanups = new Set<() => void>();
  const streamConnections = new Map<string, number>();
  const buckets = new Map<string, { tokens: number; updatedAt: number }>();
  const distRoot = resolve(options.config.distDirectory);
  let lastSnapshotAt = now().toISOString();
  const stopProjectionObservation = api.publisher.subscribe(() => { lastSnapshotAt = now().toISOString(); });
  let address: OfficeGatewayAddress | null = null;
  let closePromise: Promise<void> | null = null;

  const log = (startedAt: number, correlationId: string, entry: Omit<GatewayLogEntry, 'timestamp' | 'durationMs' | 'correlationId'>) => {
    logger({ timestamp: now().toISOString(), correlationId, durationMs: Math.max(0, Date.now() - startedAt), ...entry });
  };

  const correlationIdFor = (request: IncomingMessage) => {
    const supplied = request.headers['x-correlation-id'];
    return typeof supplied === 'string' && CORRELATION_PATTERN.test(supplied) ? supplied : createCorrelationId();
  };

  const applyCors = (request: IncomingMessage, response: ServerResponse) => {
    const origin = request.headers.origin;
    if (origin === undefined) return true;
    if (!options.config.corsOrigins.includes(origin)) return false;
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    return true;
  };

  const consumeRateToken = (client: ApiClientConfig) => {
    const currentTime = Date.now();
    const bucket = buckets.get(client.keyHash) ?? { tokens: options.config.rateLimitCapacity, updatedAt: currentTime };
    const elapsedSeconds = Math.max(0, currentTime - bucket.updatedAt) / 1_000;
    bucket.tokens = Math.min(options.config.rateLimitCapacity, bucket.tokens + elapsedSeconds * options.config.rateLimitRefillPerSecond);
    bucket.updatedAt = currentTime;
    if (bucket.tokens < 1) { buckets.set(client.keyHash, bucket); return false; }
    bucket.tokens -= 1;
    buckets.set(client.keyHash, bucket);
    return true;
  };

  const handleExternal = async (request: IncomingMessage, response: ServerResponse) => {
    const startedAt = Date.now();
    const correlationId = correlationIdFor(request);
    response.setHeader('X-Correlation-ID', correlationId);
    if (!applyCors(request, response)) {
      log(startedAt, correlationId, { level: 'warn', result: 'rejected', reasonCode: 'cors_denied' });
      sendJson(response, { status: 403, body: { error: 'Origin is not allowed' } }); return;
    }
    if (request.method === 'OPTIONS') {
      response.statusCode = 204;
      response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Correlation-ID');
      response.end(); return;
    }
    if (request.method !== 'POST') { sendJson(response, { status: 405, body: { error: 'Method not allowed' } }); return; }
    if (!isJsonRequest(request)) {
      log(startedAt, correlationId, { level: 'warn', result: 'rejected', reasonCode: 'unsupported_media_type' });
      sendJson(response, { status: 415, body: { error: 'Content-Type must be application/json' } }); return;
    }
    const authorization = request.headers.authorization;
    const match = typeof authorization === 'string' ? /^Bearer\s+(.+)$/.exec(authorization) : null;
    const client = match ? authenticateApiClient(match[1]!, options.clients) : null;
    if (!client) {
      request.resume();
      log(startedAt, correlationId, { level: 'warn', result: 'rejected', reasonCode: 'unauthorized' });
      sendJson(response, { status: 401, body: { error: 'Unauthorized' } }); return;
    }
    if (!consumeRateToken(client)) {
      request.resume();
      log(startedAt, correlationId, { level: 'warn', sourceSystem: client.sourceSystem, result: 'rejected', reasonCode: 'rate_limited' });
      sendJson(response, { status: 429, body: { error: 'Rate limit exceeded' } }); return;
    }
    let body: unknown;
    try { body = await readJsonBody(request, options.config.maxBodyBytes); }
    catch (reason) {
      const status = reason instanceof RequestBodyError ? reason.status : 400;
      log(startedAt, correlationId, { level: 'warn', sourceSystem: client.sourceSystem, result: 'rejected', reasonCode: status === 413 ? 'body_too_large' : 'invalid_json' });
      sendJson(response, { status, body: { error: reason instanceof Error ? reason.message : 'Invalid request body' } }); return;
    }
    const identity = eventIdentity(body);
    const requestedType = isRecord(body) && typeof body.eventType === 'string' ? body.eventType : undefined;
    if ((isRecord(body) && body.type === 'motion.completed') || (requestedType !== undefined && (!EXTERNAL_TYPES.has(requestedType) || !client.allowedEventTypes.includes(requestedType)))) {
      log(startedAt, correlationId, { level: 'warn', ...identity, sourceSystem: client.sourceSystem, result: 'rejected', reasonCode: 'event_type_forbidden' });
      sendJson(response, { status: 403, body: { error: 'Event type is not permitted' } }); return;
    }
    if (!adapter.canHandle(body)) {
      log(startedAt, correlationId, { level: 'warn', ...identity, sourceSystem: client.sourceSystem, result: 'rejected', reasonCode: 'invalid_envelope' });
      sendJson(response, { status: 400, body: { error: 'Body must be a canonical v1 business event envelope' } }); return;
    }
    let event: BusinessEvent;
    try {
      event = adapter.toBusinessEvent(body, { sourceSystem: client.sourceSystem, warn: (reasonCode) => {
        log(startedAt, correlationId, { level: 'warn', ...identity, sourceSystem: client.sourceSystem, result: 'sanitized', reasonCode });
      } }) as BusinessEvent;
    } catch (reason) {
      const message = reason instanceof BusinessEventValidationError ? reason.message : 'Invalid business event';
      const rejectedEnvelope = isRecord(body)
        ? { ...body, source: { ...(isRecord(body.source) ? body.source : {}), system: client.sourceSystem } } as Partial<BusinessEvent>
        : undefined;
      await api.recordRejected(rejectedEnvelope, 'validation_rejected', message, body);
      api.eventResults.record({ timestamp: now().toISOString(), eventId: identity.eventId ?? 'unknown', eventType: identity.eventType ?? 'unknown', sourceSystem: client.sourceSystem, correlationId: isRecord(body) && typeof body.correlationId === 'string' ? body.correlationId : correlationId, result: 'rejected', reasonCode: 'validation_rejected' });
      log(startedAt, correlationId, { level: 'warn', ...identity, sourceSystem: client.sourceSystem, result: 'rejected', reasonCode: 'validation_rejected' });
      sendJson(response, { status: 400, body: { error: message } }); return;
    }
    const result = await api.handleAsync('POST', '/api/business-events', event);
    log(startedAt, correlationId, {
      level: result.status >= 500 ? 'error' : result.status >= 400 ? 'warn' : 'info',
      eventId: event.eventId, eventType: event.eventType, sourceSystem: client.sourceSystem,
      result: result.status < 400 ? (result.status === 200 ? 'duplicate' : 'accepted') : 'rejected',
      ...(result.status >= 400 ? { reasonCode: result.status === 409 ? 'event_conflict' : 'business_rejected' } : {}),
    });
    sendJson(response, publicEventResponse(result));
  };

  const isTrustedInternalMutation = (request: IncomingMessage) => {
    if (!address) return false;
    return request.headers['sec-fetch-site'] === 'same-origin' || request.headers.origin === address.origin;
  };

  const diagnosticLimit = (url: URL) => {
    const raw = url.searchParams.get('limit');
    if (raw === null || raw === '') return 20;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) throw new RequestBodyError(400, 'limit must be a positive integer');
    return Math.min(100, value);
  };

  const currentDiagnostics = () => {
    const latest = api.publisher.latest();
    const persistence = api.getPersistenceStatus();
    return deriveRuntimeDiagnostics({
      snapshot: latest.snapshot,
      gatewayUp: true,
      ledgerState: persistence.state === 'healthy' ? 'healthy' : 'degraded',
      projectionState: persistence.state === 'healthy' ? 'ready' : 'degraded',
      lastSequence: persistence.lastSequence,
      updatedAt: lastSnapshotAt,
    });
  };

  const serverConnectionState = (): DiagnosticConnectionState => {
    const connected = [...streamConnections.values()].reduce((total, count) => total + count, 0) > 0;
    return {
      mode: connected ? 'sse' : 'connecting', failures: 0, sseState: connected ? 'connected' : 'connecting',
      lastSnapshotAt, reconnectCount: 0, pollingFallback: false,
    };
  };

  const handleDiagnostics = async (request: IncomingMessage, response: ServerResponse, url: URL) => {
    if (!options.config.eventConsoleEnabled) { sendJson(response, { status: 404, body: { error: 'Not found' } }); return; }
    if (request.method !== 'GET') { sendJson(response, { status: 405, body: { error: 'Method not allowed' } }); return; }
    if (!isTrustedInternalMutation(request)) { sendJson(response, { status: 403, body: { error: 'Internal diagnostics require a same-origin browser request' } }); return; }
    try {
      if (url.pathname === '/api/internal/diagnostics') { sendJson(response, { status: 200, body: currentDiagnostics() }); return; }
      if (url.pathname === '/api/internal/recent-events') { sendJson(response, { status: 200, body: api.eventResults.recent(diagnosticLimit(url)) }); return; }
      if (url.pathname === '/api/internal/rejected-events') {
        const rejected = await api.recentRejectedEvents(diagnosticLimit(url));
        sendJson(response, { status: 200, body: rejected.map(sanitizeRejectedEvent) }); return;
      }
      const generatedAt = now().toISOString();
      const bundle = createDiagnosticBundle({
        generatedAt, appVersion: '0.0.0', health: currentDiagnostics().health, connection: serverConnectionState(),
        recentEventResults: api.eventResults.recent(20), rejectedEvents: (await api.recentRejectedEvents(20)).map(sanitizeRejectedEvent),
      });
      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Content-Disposition', `attachment; filename="${diagnosticBundleFilename(generatedAt)}"`);
      response.end(JSON.stringify(bundle));
    } catch (reason) {
      const status = reason instanceof RequestBodyError ? reason.status : 503;
      sendJson(response, { status, body: { error: reason instanceof Error ? reason.message : 'Diagnostics are unavailable' } });
    }
  };

  const handleInternal = async (request: IncomingMessage, response: ServerResponse, path: string) => {
    if (request.method === 'GET' && path === '/api/office-stream') {
      await api.ready;
      const ip = request.socket.remoteAddress ?? 'unknown';
      const count = streamConnections.get(ip) ?? 0;
      if (count >= 5) { sendJson(response, { status: 429, body: { error: 'Too many office-stream connections' } }); return; }
      streamConnections.set(ip, count + 1);
      let cleanup: () => void = () => undefined;
      cleanup = serveProjectionStream(request, response, api.publisher, { onClose: () => {
        streamCleanups.delete(cleanup);
        const remaining = (streamConnections.get(ip) ?? 1) - 1;
        if (remaining > 0) streamConnections.set(ip, remaining); else streamConnections.delete(ip);
      } });
      streamCleanups.add(cleanup);
      return;
    }
    if (request.method === 'POST' && !isTrustedInternalMutation(request)) {
      request.resume(); sendJson(response, { status: 403, body: { error: 'Internal endpoint requires a same-origin browser request' } }); return;
    }
    if (request.method === 'POST' && !isJsonRequest(request)) {
      request.resume(); sendJson(response, { status: 415, body: { error: 'Content-Type must be application/json' } }); return;
    }
    try {
      const body = request.method === 'POST' ? await readJsonBody(request, options.config.maxBodyBytes) : undefined;
      sendJson(response, await api.handleAsync(request.method ?? 'GET', path, body));
    } catch (reason) {
      const status = reason instanceof RequestBodyError ? reason.status : 400;
      sendJson(response, { status, body: { error: reason instanceof Error ? reason.message : 'Invalid request' } });
    }
  };

  const serveStatic = async (request: IncomingMessage, response: ServerResponse, pathname: string) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') { sendJson(response, { status: 404, body: { error: 'Not found' } }); return; }
    let relativePath: string;
    try { relativePath = decodeURIComponent(pathname === '/' ? 'index.html' : pathname.slice(1)); }
    catch { sendJson(response, { status: 400, body: { error: 'Invalid path' } }); return; }
    let candidate = resolve(distRoot, relativePath);
    if (candidate !== distRoot && !candidate.startsWith(`${distRoot}${sep}`)) { sendJson(response, { status: 403, body: { error: 'Forbidden path' } }); return; }
    let isFile = false;
    try { isFile = (await stat(candidate)).isFile(); } catch { /* SPA fallback below */ }
    if (!isFile) candidate = resolve(distRoot, 'index.html');
    try {
      let content: string | Buffer = await readFile(candidate);
      const extension = extname(candidate).toLowerCase();
      if (extension === '.html') content = injectedIndex(content.toString('utf8'), options.config.eventConsoleEnabled);
      response.statusCode = 200;
      response.setHeader('Content-Type', MIME_TYPES[extension] ?? 'application/octet-stream');
      if (request.method === 'HEAD') response.end(); else response.end(content);
    } catch { sendJson(response, { status: 404, body: { error: 'Static application is not built' } }); }
  };

  const server = createServer((request, response) => {
    void (async () => {
      const url = new URL(request.url ?? '/', 'http://office.local');
      if (url.pathname === '/healthz') { sendJson(response, { status: 200, body: { status: 'ok' } }); return; }
      if (url.pathname === '/readyz') {
        try {
          await api.ready;
          const healthy = api.getPersistenceStatus().state === 'healthy' && Boolean(api.publisher.latest());
          sendJson(response, { status: healthy ? 200 : 503, body: { status: healthy ? 'ready' : 'not_ready' } });
        } catch { sendJson(response, { status: 503, body: { status: 'not_ready' } }); }
        return;
      }
      if (url.pathname === '/api/v1/events') { await handleExternal(request, response); return; }
      if (INTERNAL_PATHS.has(url.pathname)) { await handleInternal(request, response, url.pathname); return; }
      if (INTERNAL_DIAGNOSTIC_PATHS.has(url.pathname)) { await handleDiagnostics(request, response, url); return; }
      if (url.pathname.startsWith('/api/internal/')) { sendJson(response, { status: 404, body: { error: 'Not found' } }); return; }
      await serveStatic(request, response, url.pathname);
    })().catch(() => sendJson(response, { status: 500, body: { error: 'Internal gateway error' } }));
  });

  return {
    server,
    api,
    async start() {
      if (address) return address;
      await api.ready;
      await new Promise<void>((resolveStart, reject) => {
        const onError = (error: Error) => { server.off('listening', onListening); reject(error); };
        const onListening = () => { server.off('error', onError); resolveStart(); };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(options.config.port, options.config.host);
      });
      const bound = server.address();
      if (!bound || typeof bound === 'string') throw new Error('Gateway did not bind a TCP address');
      const displayHost = options.config.host.includes(':') ? `[${options.config.host}]` : options.config.host;
      address = { host: options.config.host, port: bound.port, origin: `http://${displayHost}:${bound.port}` };
      return address;
    },
    close() {
      if (closePromise) return closePromise;
      closePromise = (async () => {
        for (const cleanup of [...streamCleanups]) cleanup();
        stopProjectionObservation();
        if (server.listening) {
          await new Promise<void>((resolveClose) => {
            server.close(() => resolveClose());
            server.closeAllConnections?.();
          });
        }
        await api.dispose();
        address = null;
      })();
      return closePromise;
    },
  };
}
