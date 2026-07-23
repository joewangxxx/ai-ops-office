import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { hashApiKey, type GatewayConfig } from '../server/config';
import { createOfficeGateway, type OfficeGateway } from '../server/gateway';

const gateways: OfficeGateway[] = [];
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(gateways.splice(0).map((gateway) => gateway.close()));
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('Task 13 standalone persistence and SSE', () => {
  it('recovers a durable external event after restart and streams the recovered snapshot without Vite', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'office-standalone-'));
    directories.push(directory);
    const distDirectory = join(directory, 'dist');
    await mkdir(distDirectory, { recursive: true });
    await writeFile(join(distDirectory, 'index.html'), '<!doctype html><html><head></head><body>Standalone Office</body></html>', 'utf8');
    const config: GatewayConfig = {
      host: '127.0.0.1', port: 0, dataDirectory: join(directory, 'data'), apiClientsFile: join(directory, 'clients.json'),
      corsOrigins: [], eventConsoleEnabled: true, maxBodyBytes: 262_144, rateLimitCapacity: 10, rateLimitRefillPerSecond: 10, distDirectory,
    };
    const clients = [{ keyHash: hashApiKey('restart-key'), sourceSystem: 'pm-external', allowedEventTypes: ['artifact.submitted'] }];
    const event = {
      eventId: 'restart-event', eventType: 'artifact.submitted', schemaVersion: '1.0', occurredAt: '2026-07-22T11:00:00.000Z', correlationId: 'restart-event',
      source: { system: 'caller' }, payload: {
        artifact: { id: 'restart-prd', category: 'prd', title: 'Restart PRD', evidence: { kind: 'prd', summary: 'Durable.', priority: 'P1', scope: ['Recovery'], userStories: [{ id: 'US-1', statement: 'Recover after restart.' }], acceptanceCriteria: ['State is restored.'] } },
        producerDeskId: 'pm-alice', assigneeDeskId: 'dev-jack',
      },
    };

    const first = createOfficeGateway({ config, clients });
    gateways.push(first);
    const firstAddress = await first.start();
    const accepted = await fetch(`${firstAddress.origin}/api/v1/events`, { method: 'POST', headers: { Authorization: 'Bearer restart-key', 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
    expect(accepted.status).toBe(202);
    await first.close();
    gateways.splice(gateways.indexOf(first), 1);

    const second = createOfficeGateway({ config, clients });
    gateways.push(second);
    const secondAddress = await second.start();
    const recovered = await (await fetch(`${secondAddress.origin}/api/office-state`)).json();
    expect(recovered.artifacts['restart-prd']).toMatchObject({ title: 'Restart PRD', status: 'Delivering' });

    const abort = new AbortController();
    const stream = await fetch(`${secondAddress.origin}/api/office-stream`, { signal: abort.signal });
    expect(stream.headers.get('content-type')).toContain('text/event-stream');
    const chunk = await stream.body!.getReader().read();
    const text = new TextDecoder().decode(chunk.value);
    abort.abort();
    expect(text).toContain('event: snapshot');
    expect(text).toContain('restart-prd');
    expect(await (await fetch(secondAddress.origin)).text()).toContain('Standalone Office');
  });
});
