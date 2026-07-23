import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type ApiClientConfig = {
  keyHash: string;
  sourceSystem: string;
  allowedEventTypes: string[];
};

export type GatewayConfig = {
  host: string;
  port: number;
  dataDirectory: string;
  apiClientsFile: string;
  corsOrigins: string[];
  eventConsoleEnabled: boolean;
  maxBodyBytes: number;
  rateLimitCapacity: number;
  rateLimitRefillPerSecond: number;
  distDirectory: string;
};

const EXTERNAL_EVENT_TYPES = new Set(['artifact.submitted', 'artifact.accepted']);
const HASH_PATTERN = /^[a-f0-9]{64}$/i;

function positiveInteger(value: string | undefined, fallback: number, name: string, allowZero = false) {
  if (value === undefined || value.trim() === '') return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || (allowZero ? number < 0 : number <= 0)) throw new Error(`${name} must be ${allowZero ? 'a non-negative' : 'a positive'} integer`);
  return number;
}

function booleanValue(value: string | undefined, fallback: boolean, name: string) {
  if (value === undefined || value.trim() === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} must be true or false`);
}

function isTrustedHost(host: string) {
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (/^10\./.test(host) || /^192\.168\./.test(host)) return true;
  const match = /^172\.(\d+)\./.exec(host);
  return match ? Number(match[1]) >= 16 && Number(match[1]) <= 31 : false;
}

function corsOrigins(value: string | undefined) {
  if (!value?.trim()) return [];
  const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.includes('*')) throw new Error('OFFICE_CORS_ORIGINS cannot use a wildcard');
  for (const origin of origins) {
    let parsed: URL;
    try { parsed = new URL(origin); } catch { throw new Error(`Invalid CORS origin: ${origin}`); }
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.origin !== origin) throw new Error(`Invalid CORS origin: ${origin}`);
  }
  return [...new Set(origins)];
}

export function parseGatewayConfig(environment: Record<string, string | undefined>): GatewayConfig {
  const host = environment.OFFICE_HOST?.trim() || '127.0.0.1';
  const port = positiveInteger(environment.OFFICE_PORT, 4175, 'OFFICE_PORT');
  if (port > 65_535) throw new Error('OFFICE_PORT must be at most 65535');
  const eventConsoleEnabled = booleanValue(environment.EVENT_CONSOLE_ENABLED, false, 'EVENT_CONSOLE_ENABLED');
  if (eventConsoleEnabled && !isTrustedHost(host)) throw new Error('Event Console can only be enabled on loopback or a trusted private-network host');
  const apiClientsFile = environment.OFFICE_API_CLIENTS_FILE?.trim();
  if (!apiClientsFile) throw new Error('OFFICE_API_CLIENTS_FILE is required');
  return {
    host,
    port,
    dataDirectory: resolve(environment.OFFICE_DATA_DIR?.trim() || '.data'),
    apiClientsFile: resolve(apiClientsFile),
    corsOrigins: corsOrigins(environment.OFFICE_CORS_ORIGINS),
    eventConsoleEnabled,
    maxBodyBytes: positiveInteger(environment.OFFICE_MAX_BODY_BYTES, 262_144, 'OFFICE_MAX_BODY_BYTES'),
    rateLimitCapacity: positiveInteger(environment.OFFICE_RATE_LIMIT_CAPACITY, 60, 'OFFICE_RATE_LIMIT_CAPACITY'),
    rateLimitRefillPerSecond: positiveInteger(environment.OFFICE_RATE_LIMIT_REFILL_PER_SECOND, 1, 'OFFICE_RATE_LIMIT_REFILL_PER_SECOND', true),
    distDirectory: resolve(environment.OFFICE_DIST_DIR?.trim() || 'dist'),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseClient(value: unknown, index: number): ApiClientConfig {
  if (!isRecord(value) || typeof value.keyHash !== 'string' || !HASH_PATTERN.test(value.keyHash)) throw new Error(`API client ${index} requires a SHA-256 keyHash`);
  if (typeof value.sourceSystem !== 'string' || !value.sourceSystem.trim()) throw new Error(`API client ${index} requires sourceSystem`);
  if (!Array.isArray(value.allowedEventTypes) || value.allowedEventTypes.some((type) => typeof type !== 'string' || !EXTERNAL_EVENT_TYPES.has(type))) {
    throw new Error(`API client ${index} has invalid allowedEventTypes`);
  }
  return { keyHash: value.keyHash.toLowerCase(), sourceSystem: value.sourceSystem, allowedEventTypes: [...new Set(value.allowedEventTypes)] as string[] };
}

export async function loadApiClients(path: string): Promise<ApiClientConfig[]> {
  const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('API clients file must contain a non-empty array');
  const clients = parsed.map(parseClient);
  if (new Set(clients.map((client) => client.keyHash)).size !== clients.length) throw new Error('API client keyHash values must be unique');
  return clients;
}

export function hashApiKey(key: string) {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

export function authenticateApiClient(key: string, clients: readonly ApiClientConfig[]): ApiClientConfig | null {
  const presented = Buffer.from(hashApiKey(key), 'hex');
  let match: ApiClientConfig | null = null;
  for (const client of clients) {
    const expected = Buffer.from(client.keyHash, 'hex');
    if (expected.length === presented.length && timingSafeEqual(expected, presented)) match = client;
  }
  return match;
}
