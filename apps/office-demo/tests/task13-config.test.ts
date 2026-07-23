import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { authenticateApiClient, hashApiKey, loadApiClients, parseGatewayConfig } from '../server/config';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('Task 13 gateway configuration', () => {
  it('parses safe defaults and rejects unsafe production settings', () => {
    const config = parseGatewayConfig({ OFFICE_API_CLIENTS_FILE: 'clients.json' });
    expect(config).toMatchObject({ host: '127.0.0.1', port: 4175, maxBodyBytes: 262_144, eventConsoleEnabled: false, corsOrigins: [] });

    expect(() => parseGatewayConfig({ OFFICE_API_CLIENTS_FILE: 'clients.json', OFFICE_PORT: 'nope' })).toThrow(/OFFICE_PORT/);
    expect(() => parseGatewayConfig({ OFFICE_API_CLIENTS_FILE: 'clients.json', EVENT_CONSOLE_ENABLED: 'true', OFFICE_HOST: '0.0.0.0' })).toThrow(/Event Console/i);
    expect(() => parseGatewayConfig({ OFFICE_API_CLIENTS_FILE: 'clients.json', OFFICE_CORS_ORIGINS: '*' })).toThrow(/wildcard/i);
  });

  it('loads only hashed clients and authenticates with constant-shape hashes', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'office-clients-'));
    temporaryDirectories.push(directory);
    const clientFile = join(directory, 'clients.json');
    const keyHash = hashApiKey('pm-secret-from-environment');
    await writeFile(clientFile, JSON.stringify([{ keyHash, sourceSystem: 'pm-system', allowedEventTypes: ['artifact.submitted'] }]), 'utf8');

    const clients = await loadApiClients(clientFile);
    expect(clients).toEqual([{ keyHash, sourceSystem: 'pm-system', allowedEventTypes: ['artifact.submitted'] }]);
    expect(authenticateApiClient('pm-secret-from-environment', clients)?.sourceSystem).toBe('pm-system');
    expect(authenticateApiClient('wrong', clients)).toBeNull();

    await writeFile(clientFile, JSON.stringify([{ apiKey: 'plaintext', sourceSystem: 'pm-system', allowedEventTypes: [] }]), 'utf8');
    await expect(loadApiClients(clientFile)).rejects.toThrow(/keyHash/);
  });
});
