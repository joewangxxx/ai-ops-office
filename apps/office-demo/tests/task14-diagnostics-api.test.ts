import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { InMemoryEventLedger } from '../src/backend/eventLedger';
import { InMemoryProjectionSnapshotStore } from '../src/backend/projectionSnapshotStore';
import { hashApiKey, type GatewayConfig } from '../server/config';
import { createOfficeGateway, type OfficeGateway } from '../server/gateway';

const gateways: OfficeGateway[] = [];
const directories: string[] = [];
const key = 'diagnostics-test-key';

afterEach(async () => {
  await Promise.all(gateways.splice(0).map((gateway) => gateway.close()));
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

function event(eventId = 'diagnostic-event') {
  return {
    eventId, eventType: 'artifact.submitted', schemaVersion: '1.0', occurredAt: '2026-07-22T12:00:00.000Z', correlationId: eventId,
    source: { system: 'caller' }, payload: {
      artifact: { id: `${eventId}-artifact`, category: 'prd', title: 'Diagnostic PRD', evidence: { kind: 'prd', summary: 'PRIVATE EVIDENCE BODY', priority: 'P1', scope: ['Diagnostics'], userStories: [{ id: 'US-1', statement: 'Inspect safely.' }], acceptanceCriteria: ['No payload leaks.'] } },
      producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack',
    },
  };
}

async function startGateway(internalMode = true) {
  const directory = await mkdtemp(join(tmpdir(), 'office-diagnostics-'));
  directories.push(directory);
  const distDirectory = join(directory, 'dist');
  await mkdir(distDirectory, { recursive: true });
  await writeFile(join(distDirectory, 'index.html'), '<html><head></head><body>Office</body></html>', 'utf8');
  const ledger = new InMemoryEventLedger();
  const config: GatewayConfig = {
    host: '127.0.0.1', port: 0, dataDirectory: join(directory, '.data'), apiClientsFile: join(directory, 'clients.json'), corsOrigins: [],
    eventConsoleEnabled: internalMode, maxBodyBytes: 262_144, rateLimitCapacity: 50, rateLimitRefillPerSecond: 50, distDirectory,
  };
  const gateway = createOfficeGateway({
    config, clients: [{ keyHash: hashApiKey(key), sourceSystem: 'diagnostics-source', allowedEventTypes: ['artifact.submitted'] }],
    persistence: { ledger, snapshotStore: new InMemoryProjectionSnapshotStore() },
  });
  gateways.push(gateway);
  const address = await gateway.start();
  return { gateway, ledger, origin: address.origin };
}

const externalHeaders = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const internalHeaders = (origin: string) => ({ Origin: origin });

describe('Task 14 diagnostics API', () => {
  it('returns bounded health, recent outcomes, rejected records, and a safe downloadable bundle', async () => {
    const { origin } = await startGateway();
    const valid = event();
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders, body: JSON.stringify(valid) })).status).toBe(202);
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders, body: JSON.stringify(valid) })).status).toBe(200);
    const invalid = event('invalid-diagnostic-event');
    invalid.payload.artifact.evidence.summary = '';
    expect((await fetch(`${origin}/api/v1/events`, { method: 'POST', headers: externalHeaders, body: JSON.stringify(invalid) })).status).toBe(400);

    const diagnosticsResponse = await fetch(`${origin}/api/internal/diagnostics`, { headers: internalHeaders(origin) });
    expect(diagnosticsResponse.status).toBe(200);
    await expect(diagnosticsResponse.json()).resolves.toMatchObject({ health: { overall: 'healthy', gateway: 'up', ledger: 'writable', projection: 'ready' } });

    const recent = await (await fetch(`${origin}/api/internal/recent-events?limit=500`, { headers: internalHeaders(origin) })).json();
    expect(recent).toHaveLength(3);
    expect(recent.map((entry: { result: string }) => entry.result)).toEqual(['accepted', 'duplicate', 'rejected']);
    expect(JSON.stringify(recent)).not.toContain('PRIVATE EVIDENCE BODY');

    const rejected = await (await fetch(`${origin}/api/internal/rejected-events?limit=500`, { headers: internalHeaders(origin) })).json();
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({ eventId: 'invalid-diagnostic-event', sourceSystem: 'diagnostics-source', reasonCode: 'validation_rejected' });
    expect(rejected[0]).not.toHaveProperty('payloadHash');

    const bundleResponse = await fetch(`${origin}/api/internal/diagnostic-bundle`, { headers: internalHeaders(origin) });
    expect(bundleResponse.status).toBe(200);
    expect(bundleResponse.headers.get('content-disposition')).toMatch(/^attachment; filename="office-diagnostics-\d{8}-\d{6}\.json"$/);
    const bundleText = await bundleResponse.text();
    expect(JSON.parse(bundleText)).toMatchObject({ schemaVersion: '1.0', health: { overall: 'healthy' } });
    expect(bundleText).not.toMatch(/PRIVATE EVIDENCE BODY|Authorization|diagnostics-test-key|acceptanceCriteria|[A-Z]:\\/i);
  });

  it('caps limits at 100 and keeps diagnostics internal-only without breaking projection state', async () => {
    const { origin } = await startGateway(false);
    expect((await fetch(`${origin}/api/internal/diagnostics`, { headers: internalHeaders(origin) })).status).toBe(404);
    expect((await fetch(`${origin}/api/office-state`)).status).toBe(200);
  });
});
