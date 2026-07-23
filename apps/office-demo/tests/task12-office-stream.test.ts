import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';
import { createProjectionPublisher } from '../src/backend/projectionPublisher';
import { serveProjectionStream } from '../src/backend/viteOfficeApi';

function transport(lastEventId?: string) {
  const request = new EventEmitter() as EventEmitter & { headers: Record<string, string>; socket: { remoteAddress: string } };
  request.headers = lastEventId ? { 'last-event-id': lastEventId } : {};
  request.socket = { remoteAddress: '127.0.0.1' };
  const headers = new Map<string, string>();
  const chunks: string[] = [];
  const response = new EventEmitter() as EventEmitter & {
    statusCode: number; setHeader(name: string, value: string): void; write(chunk: string): boolean; end(): void;
  };
  response.statusCode = 0;
  response.setHeader = (name, value) => { headers.set(name, value); };
  response.write = (chunk) => { chunks.push(chunk); return true; };
  response.end = vi.fn();
  return { request, response, headers, chunks };
}

const message = (revision: number, sequence = revision) => {
  const snapshot = toOfficeSnapshot(createOfficeState());
  snapshot.revision = revision;
  return { epoch: 0, revision, sequence, snapshot };
};

describe('Task 12 SSE transport', () => {
  it('sets streaming headers, sends current projection immediately, and cleans up on close', () => {
    vi.useFakeTimers();
    const publisher = createProjectionPublisher(message(0));
    const stream = transport();
    const cleanup = serveProjectionStream(stream.request as never, stream.response as never, publisher, { heartbeatMs: 15_000 });

    expect(stream.headers.get('Content-Type')).toBe('text/event-stream; charset=utf-8');
    expect(stream.headers.get('X-Accel-Buffering')).toBe('no');
    expect(stream.chunks.join('')).toContain('id: 0:0');
    expect(stream.chunks.join('')).toContain('event: snapshot');
    publisher.publish(message(1));
    expect(stream.chunks.join('')).toContain('id: 0:1');
    vi.advanceTimersByTime(15_000);
    expect(stream.chunks.join('')).toContain(': heartbeat ');
    stream.request.emit('close');
    const count = stream.chunks.length;
    publisher.publish(message(2));
    expect(stream.chunks).toHaveLength(count);
    cleanup();
    vi.useRealTimers();
  });

  it('replays messages after a valid Last-Event-ID and sends latest for an expired cursor', () => {
    const publisher = createProjectionPublisher(message(0), 3);
    publisher.publish(message(1)); publisher.publish(message(2)); publisher.publish(message(3));
    const replay = transport('0:1');
    serveProjectionStream(replay.request as never, replay.response as never, publisher, { heartbeatMs: 60_000 });
    expect(replay.chunks.join('')).not.toContain('id: 0:1\n');
    expect(replay.chunks.join('')).toContain('id: 0:2');
    expect(replay.chunks.join('')).toContain('id: 0:3');

    const expired = transport('0:0');
    serveProjectionStream(expired.request as never, expired.response as never, publisher, { heartbeatMs: 60_000 });
    expect(expired.chunks.join('').match(/event: snapshot/g)).toHaveLength(1);
    expect(expired.chunks.join('')).toContain('id: 0:3');
  });
});
