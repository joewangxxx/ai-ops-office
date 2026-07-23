import { appendFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  InMemoryEventLedger,
  JsonlEventLedger,
  LedgerCorruptionError,
  type PersistedBusinessEvent,
} from '../src/backend/eventLedger';
import { InMemoryProjectionSnapshotStore, JsonProjectionSnapshotStore } from '../src/backend/projectionSnapshotStore';
import { createOfficeState, toOfficeSnapshot } from '../src/backend/officeDomain';

const tempDirectories: string[] = [];
afterEach(async () => Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true }))));

async function temporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), 'office-task11-'));
  tempDirectories.push(directory);
  return directory;
}

const record = (sequence: number, eventId = `event-${sequence}`): PersistedBusinessEvent => ({
  sequence,
  epoch: 0,
  receivedAt: '2026-07-22T07:00:00.000Z',
  envelope: {
    eventId,
    eventType: 'projection.reset',
    schemaVersion: '1.0',
    occurredAt: '2026-07-22T07:00:00.000Z',
    correlationId: eventId,
    source: { system: 'task11-test' },
    payload: { reason: 'manual-reset' },
  },
});

async function collect(ledger: { readAfter(sequence: number): AsyncIterable<PersistedBusinessEvent> }, sequence = 0) {
  const values: PersistedBusinessEvent[] = [];
  for await (const value of ledger.readAfter(sequence)) values.push(value);
  return values;
}

describe('Task 11 event ledger and snapshot storage', () => {
  it('keeps strictly increasing in-memory records and finds eventIds', async () => {
    const ledger = new InMemoryEventLedger();
    await expect(ledger.append(record(1))).resolves.toEqual({ sequence: 1 });
    await expect(ledger.append(record(2))).resolves.toEqual({ sequence: 2 });

    expect(await collect(ledger, 1)).toEqual([record(2)]);
    expect(await ledger.findByEventId('event-1')).toEqual(record(1));
    await expect(ledger.append(record(2, 'duplicate-sequence'))).rejects.toThrow(/sequence/i);
  });

  it('flushes JSONL records and reloads them in sequence order', async () => {
    const directory = await temporaryDirectory();
    const ledger = new JsonlEventLedger({ directory });
    await ledger.append(record(1));
    await ledger.append(record(2));
    await ledger.close();

    const reopened = new JsonlEventLedger({ directory });
    expect(await collect(reopened)).toEqual([record(1), record(2)]);
    expect(await reopened.findByEventId('event-2')).toEqual(record(2));
    expect((await readFile(join(directory, 'office-events.jsonl'), 'utf8')).trim().split('\n')).toHaveLength(2);
  });

  it('quarantines an incomplete final JSONL line but recovers the valid prefix', async () => {
    const directory = await temporaryDirectory();
    const ledger = new JsonlEventLedger({ directory });
    await ledger.append(record(1));
    await ledger.close();
    await appendFile(join(directory, 'office-events.jsonl'), '{"incomplete"', 'utf8');

    const recovered = new JsonlEventLedger({ directory });
    expect(await collect(recovered)).toEqual([record(1)]);
    expect(recovered.status()).toMatchObject({ state: 'healthy', tailCorruptions: 1 });
    expect(await readFile(join(directory, 'rejected-events.jsonl'), 'utf8')).toContain('ledger_tail_corrupt');
  });

  it('marks middle-line corruption degraded and never silently skips it', async () => {
    const directory = await temporaryDirectory();
    await writeFile(join(directory, 'office-events.jsonl'), `${JSON.stringify(record(1))}\n{"broken":\n${JSON.stringify(record(2))}\n`, 'utf8');
    const ledger = new JsonlEventLedger({ directory });

    await expect(collect(ledger)).rejects.toBeInstanceOf(LedgerCorruptionError);
    expect(ledger.status()).toMatchObject({ state: 'degraded' });
  });

  it('saves JSON snapshots atomically, loads valid snapshots, and ignores invalid ones', async () => {
    const directory = await temporaryDirectory();
    const store = new JsonProjectionSnapshotStore({ directory });
    const snapshot = {
      formatVersion: 1 as const,
      epoch: 0,
      lastSequence: 2,
      savedAt: '2026-07-22T07:00:00.000Z',
      projection: toOfficeSnapshot(createOfficeState()),
      idempotencyIndex: { 'event-1': 'hash-1' },
    };
    await store.save(snapshot);
    expect(await store.load()).toEqual(snapshot);
    expect((await readdir(directory)).filter((name) => name.includes('.tmp'))).toEqual([]);

    await writeFile(join(directory, 'office-snapshot.json'), '{invalid', 'utf8');
    expect(await store.load()).toBeNull();
    const memory = new InMemoryProjectionSnapshotStore();
    await memory.save(snapshot);
    expect(await memory.load()).toEqual(snapshot);
  });
});
