import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import {
  applyOfficeEvent,
  createOfficeState,
  OfficeDomainError,
  toOfficeSnapshot,
  type OfficeEvent,
  type OfficeState,
} from './officeDomain';

export type OfficeApiResponse = { status: number; body: unknown };

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function parseEvent(value: unknown): OfficeEvent {
  if (!isRecord(value) || !isString(value.type)) throw new OfficeDomainError(400, 'Event must be an object with a type');

  if (value.type === 'artifact.completed') {
    const artifact = value.artifact;
    if (
      !isRecord(artifact)
      || !isString(artifact.id)
      || !isString(artifact.title)
      || !['prd', 'feature', 'report'].includes(String(artifact.category))
      || !isString(value.producerDeskId)
      || !isString(value.assigneeDeskId)
    ) throw new OfficeDomainError(400, 'Invalid artifact.completed event');
    return {
      type: value.type,
      artifact: { id: artifact.id, title: artifact.title, category: artifact.category as 'prd' | 'feature' | 'report' },
      producerDeskId: value.producerDeskId,
      assigneeDeskId: value.assigneeDeskId,
    };
  }

  if (value.type === 'artifact.accepted') {
    if (!isString(value.artifactId) || !isString(value.assigneeDeskId)) throw new OfficeDomainError(400, 'Invalid artifact.accepted event');
    return { type: value.type, artifactId: value.artifactId, assigneeDeskId: value.assigneeDeskId };
  }

  if (value.type === 'motion.completed') {
    if (!isString(value.motionId)) throw new OfficeDomainError(400, 'Invalid motion.completed event');
    return { type: value.type, motionId: value.motionId };
  }

  throw new OfficeDomainError(400, `Unsupported office event: ${value.type}`);
}

export function createOfficeApiStore() {
  let state: OfficeState = createOfficeState();

  return {
    handle(method: string, path: string, body?: unknown): OfficeApiResponse {
      try {
        if (method === 'GET' && path === '/api/office-state') return { status: 200, body: toOfficeSnapshot(state) };
        if (method === 'POST' && path === '/api/office-reset') {
          state = createOfficeState();
          return { status: 200, body: toOfficeSnapshot(state) };
        }
        if (method === 'POST' && path === '/api/office-events') {
          state = applyOfficeEvent(state, parseEvent(body));
          return { status: 200, body: toOfficeSnapshot(state) };
        }
        return { status: 404, body: { error: 'Not found' } };
      } catch (error) {
        if (error instanceof OfficeDomainError) return { status: error.status, body: { error: error.message } };
        return { status: 500, body: { error: 'Internal office API error' } };
      }
    },
  };
}

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => { raw += chunk; });
    request.on('end', () => {
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new OfficeDomainError(400, 'Request body must be valid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, result: OfficeApiResponse) {
  response.statusCode = result.status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(result.body));
}

export function officeApiPlugin(): Plugin {
  return {
    name: 'office-api',
    apply: 'serve',
    configureServer(server) {
      const api = createOfficeApiStore();
      server.middlewares.use(async (request, response, next) => {
        const path = new URL(request.url ?? '/', 'http://office.local').pathname;
        if (!path.startsWith('/api/office-')) return next();
        try {
          const body = request.method === 'POST' ? await readJsonBody(request) : undefined;
          sendJson(response, api.handle(request.method ?? 'GET', path, body));
        } catch (error) {
          const result = error instanceof OfficeDomainError
            ? { status: error.status, body: { error: error.message } }
            : { status: 500, body: { error: 'Internal office API error' } };
          sendJson(response, result);
        }
      });
    },
  };
}
