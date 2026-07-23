import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { InMemoryEventLedger } from '../src/backend/eventLedger';
import { InMemoryProjectionSnapshotStore } from '../src/backend/projectionSnapshotStore';
import { createOfficeApiStore } from '../src/backend/viteOfficeApi';
import { hashApiKey, type ApiClientConfig, type GatewayConfig } from '../server/config';
import { createOfficeGateway, type OfficeGateway, type GatewayLogEntry } from '../server/gateway';

const openGateways: OfficeGateway[] = [];
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(openGateways.splice(0).map((gateway) => gateway.close()));
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

const apiKey = 'task13-test-key';
const clients: ApiClientConfig[] = [{
  keyHash: hashApiKey(apiKey), sourceSystem: 'trusted-pm', allowedEventTypes: ['artifact.submitted'],
}];

function submittedEvent(eventId = 'task13-submitted') {
  return {
    eventId,
    eventType: 'artifact.submitted',
    schemaVersion: '1.0',
    occurredAt: '2026-07-22T10:00:00.000Z',
    correlationId: eventId,
    source: { system: 'spoofed-source', actorId: 'pm-alice' },
    payload: {
      artifact: {
        id: `${eventId}-artifact`, category: 'prd', title: 'External Gateway PRD',
        evidence: { kind: 'prd', summary: 'SECRET-EVIDENCE-MUST-NOT-BE-LOGGED', priority: 'P1', scope: ['Gateway'], userStories: [{ id: 'US-1', statement: 'Submit externally.' }], acceptanceCriteria: ['Projection updates.'] },
      },
      producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack',
    },
  };
}

async function createTestGateway(options: { config?: Partial<GatewayConfig>; clients?: ApiClientConfig[]; logs?: GatewayLogEntry[] } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'office-gateway-'));
  temporaryDirectories.push(directory);
  const distDirectory = join(directory, 'dist');
  await mkdir(join(distDirectory, 'assets'), { recursive: true });
  await writeFile(join(distDirectory, 'index.html'), '<!doctype html><html><head></head><body><div id="root"></div></body></html>', 'utf8');
  await writeFile(join(distDirectory, 'assets', 'app.js'), 'globalThis.__STATIC_OK__ = true;', 'utf8');
  const ledger = new InMemoryEventLedger();
  const logs = options.logs ?? [];
  const config: GatewayConfig = {
    host: '127.0.0.1', port: 0, dataDirectory: join(directory, 'data'), apiClientsFile: join(directory, 'clients.json'),
    corsOrigins: ['https://allowed.example'], eventConsoleEnabled: false, maxBodyBytes: 262_144,
    rateLimitCapacity: 20, rateLimitRefillPerSecond: 20, distDirectory,
    ...options.config,
  };
  const gateway = createOfficeGateway({
    config, clients: options.clients ?? clients, logger: (entry) => logs.push(entry),
    persistence: { ledger, snapshotStore: new InMemoryProjectionSnapshotStore() },
  });
  openGateways.push(gateway);
  const address = await gateway.start();
  return { gateway, origin: address.origin, ledger, logs };
}

function externalHeaders(key = apiKey, origin?: string) {
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(origin ? { Origin: origin } : {}),
  };
}

describe('Task 13 standalone gateway', () => {
  it('serves static output and concise health/readiness without exposing the Event Console', async () => {
    const { origin } = await createTestGateway();
    const index = await fetch(origin);
    expect(index.status).toBe(200);
    expect(await index.text()).toContain('"eventConsoleEnabled":false');
    expect(await (await fetch(`${origin}/assets/app.js`)).text()).toContain('__STATIC_OK__');
    await expect((await fetch(`${origin}/healthz`)).json()).resolves.toEqual({ status: 'ok' });
    await expect((await fetch(`${origin}/readyz`)).json()).resolves.toEqual({ status: 'ready' });
  });

  it('returns 404 for removed legacy mutation endpoints', async () => {
    const { origin } = await createTestGateway();
    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'artifact.completed' }),
    };

    for (const path of ['/api/office-events', '/api/office-reset']) {
      const response = await fetch(`${origin}${path}`, request);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Not found' });
    }
  });

  it('authenticates, overwrites spoofed source, returns no snapshot, and preserves idempotency/conflicts', async () => {
    const { origin, ledger, logs } = await createTestGateway();
    const event = submittedEvent();
    const response = await fetch(`${origin}/api/v1/events`, {
      method: 'POST', headers: { ...externalHeaders(), 'X-Correlation-ID': 'request-correlation-1' }, body: JSON.stringify(event),
    });
    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe('request-correlation-1');
    expect(await response.json()).toEqual({ status: 'accepted', eventId: event.eventId, revision: 1 });
    expect(ledger.records[0]?.envelope.source.system).toBe('trusted-pm');
    expect(logs.some((entry) => entry.reasonCode === 'source_overridden' && entry.sourceSystem === 'trusted-pm')).toBe(true);

    const duplicate = await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(), body: JSON.stringify(event) });
    expect(duplicate.status).toBe(200);
    expect((await duplicate.json()).status).toBe('duplicate');

    const conflict = structuredClone(event);
    conflict.payload.artifact.title = 'Conflicting title';
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(), body: JSON.stringify(conflict) })).status).toBe(409);
  });

  it('enforces uniform auth, event permissions, content type, body limit, and CORS without mutating projection', async () => {
    const { origin } = await createTestGateway({ config: { maxBodyBytes: 2_048 } });
    const event = submittedEvent('security-event');
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) })).status).toBe(401);
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders('wrong'), body: JSON.stringify(event) })).status).toBe(401);
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: { ...externalHeaders(), 'Content-Type': 'text/plain' }, body: JSON.stringify(event) })).status).toBe(415);
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(undefined, 'https://blocked.example'), body: JSON.stringify(event) })).status).toBe(403);

    const oversized = JSON.stringify({ ...event, padding: 'x'.repeat(3_000) });
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(), body: oversized })).status).toBe(413);
    for (const eventType of ['artifact.delivered', 'artifact.received', 'artifact.accepted', 'projection.reset']) {
      const forbidden = { ...event, eventId: `forbidden-${eventType}`, eventType };
      expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(), body: JSON.stringify(forbidden) })).status).toBe(403);
    }
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(), body: JSON.stringify({ type: 'motion.completed', motionId: 'm1' }) })).status).toBe(403);
    expect((await (await fetch(`${origin}/api/office-state`)).json()).revision).toBe(0);

    const allowedCors = await fetch(`${origin}/api/v1/events`, { method: 'OPTIONS', headers: { Origin: 'https://allowed.example' } });
    expect(allowedCors.status).toBe(204);
    expect(allowedCors.headers.get('access-control-allow-origin')).toBe('https://allowed.example');
  });

  it('rate limits per authenticated client and logs no key, Authorization, body, or evidence', async () => {
    const logs: GatewayLogEntry[] = [];
    const { origin } = await createTestGateway({ logs, config: { rateLimitCapacity: 1, rateLimitRefillPerSecond: 0 } });
    const first = await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(), body: JSON.stringify(submittedEvent('rate-first')) });
    const second = await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(), body: JSON.stringify(submittedEvent('rate-second')) });
    expect(first.status).toBe(202);
    expect(second.status).toBe(429);
    const serialized = JSON.stringify(logs);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('SECRET-EVIDENCE-MUST-NOT-BE-LOGGED');
    expect(serialized).not.toContain('acceptanceCriteria');
  });

  it('produces the same projection as the internal application transport', async () => {
    const event = submittedEvent('parity-event');
    const internal = createOfficeApiStore();
    const internalResponse = internal.handle('POST', '/api/business-events', event);
    const { origin } = await createTestGateway();
    const externalResponse = await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders(), body: JSON.stringify(event) });
    expect(externalResponse.status).toBe(internalResponse.status);
    const externalState = await (await fetch(`${origin}/api/office-state`)).json();
    expect(externalState.artifacts[event.payload.artifact.id]).toEqual((internalResponse.body as { snapshot: { artifacts: Record<string, unknown> } }).snapshot.artifacts[event.payload.artifact.id]);
  });
});
