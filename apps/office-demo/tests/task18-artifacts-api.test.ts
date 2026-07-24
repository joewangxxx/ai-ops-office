import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { InMemoryEventLedger } from '../src/backend/eventLedger';
import { InMemoryProjectionSnapshotStore } from '../src/backend/projectionSnapshotStore';
import { type GatewayConfig } from '../server/config';
import { createOfficeGateway, type OfficeGateway } from '../server/gateway';

const gateways: OfficeGateway[] = [];
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(gateways.splice(0).map((gateway) => gateway.close()));
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function startGateway(internalMode = true) {
  const directory = await mkdtemp(join(tmpdir(), 'office-artifacts-'));
  directories.push(directory);
  const distDirectory = join(directory, 'dist');
  await mkdir(distDirectory, { recursive: true });
  await writeFile(join(distDirectory, 'index.html'), '<html><head></head><body>Office</body></html>', 'utf8');
  const config: GatewayConfig = { host: '127.0.0.1', port: 0, dataDirectory: join(directory, '.data'), apiClientsFile: join(directory, 'clients.json'), corsOrigins: [], operationsConsoleEnabled: internalMode, maxBodyBytes: 262_144, rateLimitCapacity: 50, rateLimitRefillPerSecond: 50, distDirectory };
  const gateway = createOfficeGateway({ config, clients: [], persistence: { ledger: new InMemoryEventLedger(), snapshotStore: new InMemoryProjectionSnapshotStore() } });
  gateways.push(gateway);
  return { gateway, origin: (await gateway.start()).origin };
}

describe('Task 18 artifact APIs', () => {
  it('serves bounded sanitized artifact summaries only to internal callers', async () => {
    const { gateway, origin } = await startGateway();
    const response = await fetch(`${origin}/api/internal/artifacts?query=login&limit=1`, { headers: { Origin: origin } });
    expect(response.status).toBe(200);
    const page = await response.json() as { items: Array<Record<string, unknown>>; total: number; nextCursor: string | null };
    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBeTruthy();
    expect(JSON.stringify(page.items)).not.toMatch(/acceptanceCriteria|commits|testCases/);
    const filtered = await fetch(`${origin}/api/internal/artifacts?category=report&state=Awaiting%20Acceptance&workspaceId=qa-lab`, { headers: { Origin: origin } });
    await expect(filtered.json()).resolves.toMatchObject({ total: 1, items: [{ id: 'login-regression-report-v1' }] });
    expect((await fetch(`${origin}/api/internal/artifacts?cursor=not-a-cursor`, { headers: { Origin: origin } })).status).toBe(400);
    expect((await fetch(`${origin}/api/internal/artifacts?query=${'x'.repeat(161)}`, { headers: { Origin: origin } })).status).toBe(400);
    expect((await fetch(`${origin}/api/internal/artifacts/%ZZ`, { headers: { Origin: origin } })).status).toBe(400);
    const detail = await fetch(`${origin}/api/internal/artifacts/login-requirement-prd-v1`, { headers: { Origin: origin } });
    expect(detail.status).toBe(200);
    await expect(detail.json()).resolves.toMatchObject({ id: 'login-requirement-prd-v1', lifecycleState: 'Active Work', baseline: true });
    const timeline = await fetch(`${origin}/api/internal/artifacts/login-requirement-prd-v1/events`, { headers: { Origin: origin } });
    expect(timeline.status).toBe(200);
    await expect(timeline.json()).resolves.toEqual([{ kind: 'baseline', label: 'Baseline state loaded' }]);
    await gateway.api.handleAsync('POST', '/api/business-events', {
      eventId: 'timeline-submitted', eventType: 'artifact.submitted', schemaVersion: '1.0', occurredAt: '2026-07-24T10:00:00.000Z', correlationId: 'timeline-chain', source: { system: 'operations-dispatch' },
      payload: { artifact: { id: 'timeline-prd', category: 'prd', title: 'Timeline PRD', evidence: { kind: 'prd', summary: 'Trace lifecycle safely.', priority: 'P1', scope: ['Registry'], userStories: [{ id: 'US-1', statement: 'Audit lifecycle.' }], acceptanceCriteria: ['Show submitted event.'] } }, producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack' },
    });
    const eventTimeline = await fetch(`${origin}/api/internal/artifacts/timeline-prd/events`, { headers: { Origin: origin } });
    await expect(eventTimeline.json()).resolves.toMatchObject([{ kind: 'event', eventType: 'artifact.submitted', correlationId: 'timeline-chain', label: 'Submitted' }]);
    const { origin: publicOrigin } = await startGateway(false);
    expect((await fetch(`${publicOrigin}/api/internal/artifacts`, { headers: { Origin: publicOrigin } })).status).toBe(404);
  });
});
