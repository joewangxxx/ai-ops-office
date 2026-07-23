import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { JsonlEventLedger } from '../src/backend/eventLedger';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('Task 14 rejected-event retention', () => {
  it('rotates the bounded rejected ledger and reads newest records in chronological order', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'office-rejected-rotation-'));
    directories.push(directory);
    const ledger = new JsonlEventLedger({ directory, maxRejectedFileBytes: 360, retainedRejectedFiles: 2 });
    for (let index = 0; index < 8; index += 1) {
      await ledger.appendRejected({
        rejectedAt: `2026-07-22T12:00:0${index}.000Z`, eventId: `reject-${index}`, eventType: 'artifact.submitted', sourceSystem: 'rotation-test', correlationId: `corr-${index}`,
        reasonCode: 'validation_rejected', message: `Safe summary ${index}`, payloadHash: `hash-${index}`,
      });
    }
    const files = (await readdir(directory)).filter((file) => file.startsWith('rejected-events.jsonl'));
    expect(files.length).toBeLessThanOrEqual(2);
    const recent = await ledger.recentRejected(100);
    expect(recent.at(-1)?.eventId).toBe('reject-7');
    expect(recent.map((record) => record.rejectedAt)).toEqual([...recent].map((record) => record.rejectedAt).sort());
    await ledger.close();
  });
});
