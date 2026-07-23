import { createHash } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BusinessEventEnvelope } from './businessEvents';

export type PersistedBusinessEvent = {
  sequence: number;
  epoch: number;
  receivedAt: string;
  envelope: BusinessEventEnvelope<string, unknown>;
};

export type RejectedEventRecord = {
  rejectedAt: string;
  eventId?: string;
  eventType?: string;
  sourceSystem?: string;
  correlationId?: string;
  reasonCode: string;
  message: string;
  payloadHash: string;
};

export type AppendResult = { sequence: number };
export type LedgerStatus = { state: 'healthy' | 'degraded'; tailCorruptions: number; message?: string };

export interface EventLedger {
  append(event: PersistedBusinessEvent): Promise<AppendResult>;
  readAfter(sequence: number): AsyncIterable<PersistedBusinessEvent>;
  findByEventId(eventId: string): Promise<PersistedBusinessEvent | null>;
  appendRejected(record: RejectedEventRecord): Promise<void>;
  recent(limit: number): Promise<PersistedBusinessEvent[]>;
  recentRejected(limit: number): Promise<RejectedEventRecord[]>;
  status(): LedgerStatus;
  close(): Promise<void>;
}

export class LedgerCorruptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerCorruptionError';
  }
}

export function hashPayload(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export class InMemoryEventLedger implements EventLedger {
  readonly records: PersistedBusinessEvent[] = [];
  readonly rejections: RejectedEventRecord[] = [];

  async append(event: PersistedBusinessEvent): Promise<AppendResult> {
    const expected = (this.records.at(-1)?.sequence ?? 0) + 1;
    if (event.sequence !== expected) throw new Error(`Ledger sequence must be ${expected}`);
    this.records.push(structuredClone(event));
    return { sequence: event.sequence };
  }

  async *readAfter(sequence: number) {
    for (const event of this.records) if (event.sequence > sequence) yield structuredClone(event);
  }

  async findByEventId(eventId: string) {
    const event = this.records.find((entry) => entry.envelope.eventId === eventId);
    return event ? structuredClone(event) : null;
  }

  async appendRejected(record: RejectedEventRecord) { this.rejections.push(structuredClone(record)); }
  async recent(limit: number) { return this.records.slice(-Math.max(0, limit)).map((record) => structuredClone(record)); }
  async recentRejected(limit: number) { return this.rejections.slice(-Math.max(0, limit)).map((record) => structuredClone(record)); }
  status(): LedgerStatus { return { state: 'healthy', tailCorruptions: 0 }; }
  async close() {}
}

type JsonlEventLedgerOptions = { directory: string; maxLineBytes?: number; maxRejectedFileBytes?: number; retainedRejectedFiles?: number };

export class JsonlEventLedger implements EventLedger {
  private readonly eventsPath: string;
  private readonly rejectedPath: string;
  private readonly maxLineBytes: number;
  private readonly maxRejectedFileBytes: number;
  private readonly retainedRejectedFiles: number;
  private records: PersistedBusinessEvent[] | null = null;
  private queue: Promise<void> = Promise.resolve();
  private ledgerStatus: LedgerStatus = { state: 'healthy', tailCorruptions: 0 };

  constructor(private readonly options: JsonlEventLedgerOptions) {
    this.eventsPath = join(options.directory, 'office-events.jsonl');
    this.rejectedPath = join(options.directory, 'rejected-events.jsonl');
    this.maxLineBytes = options.maxLineBytes ?? 1024 * 1024;
    this.maxRejectedFileBytes = options.maxRejectedFileBytes ?? 5 * 1024 * 1024;
    this.retainedRejectedFiles = options.retainedRejectedFiles ?? 5;
  }

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async ensureDirectory() { await mkdir(this.options.directory, { recursive: true }); }

  private async appendLine(path: string, value: unknown) {
    await this.ensureDirectory();
    const line = `${JSON.stringify(value)}\n`;
    if (Buffer.byteLength(line) > this.maxLineBytes) throw new Error(`Ledger line exceeds ${this.maxLineBytes} bytes`);
    const handle = await open(path, 'a');
    try { await handle.writeFile(line, 'utf8'); await handle.sync(); } finally { await handle.close(); }
  }

  private isPersistedEvent(value: unknown): value is PersistedBusinessEvent {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const candidate = value as Partial<PersistedBusinessEvent>;
    return Number.isInteger(candidate.sequence) && Number.isInteger(candidate.epoch) && typeof candidate.receivedAt === 'string'
      && candidate.envelope !== null && typeof candidate.envelope === 'object' && typeof candidate.envelope.eventId === 'string';
  }

  private async loadRecords() {
    if (this.records) return this.records;
    await this.ensureDirectory();
    let raw = '';
    try { raw = await readFile(this.eventsPath, 'utf8'); } catch (reason) {
      if ((reason as NodeJS.ErrnoException).code !== 'ENOENT') throw reason;
    }
    const parts = raw.split('\n');
    const nonEmpty = parts.map((line, index) => ({ line, index })).filter(({ line }) => line.trim().length > 0);
    const parsed: PersistedBusinessEvent[] = [];
    for (let position = 0; position < nonEmpty.length; position += 1) {
      const { line } = nonEmpty[position]!;
      try {
        if (Buffer.byteLength(line) > this.maxLineBytes) throw new Error('line too large');
        const value: unknown = JSON.parse(line);
        if (!this.isPersistedEvent(value)) throw new Error('invalid persisted event');
        const expected = (parsed.at(-1)?.sequence ?? 0) + 1;
        if (value.sequence !== expected) throw new Error(`expected sequence ${expected}`);
        parsed.push(value);
      } catch (reason) {
        const isTail = position === nonEmpty.length - 1 && !raw.endsWith('\n');
        if (!isTail) {
          this.ledgerStatus = { state: 'degraded', tailCorruptions: this.ledgerStatus.tailCorruptions, message: `Corrupt ledger line ${position + 1}` };
          throw new LedgerCorruptionError(`Corrupt ledger line ${position + 1}: ${reason instanceof Error ? reason.message : 'invalid JSON'}`);
        }
        this.ledgerStatus.tailCorruptions += 1;
        const clean = parsed.map((entry) => JSON.stringify(entry)).join('\n');
        const temporary = `${this.eventsPath}.tail-recovery.tmp`;
        await writeFile(temporary, clean ? `${clean}\n` : '', 'utf8');
        await rename(temporary, this.eventsPath);
        await this.appendLine(this.rejectedPath, {
          rejectedAt: new Date().toISOString(), reasonCode: 'ledger_tail_corrupt', message: 'Incomplete final ledger line quarantined', payloadHash: hashPayload(line),
        } satisfies RejectedEventRecord);
      }
    }
    this.records = parsed;
    return parsed;
  }

  append(event: PersistedBusinessEvent): Promise<AppendResult> {
    return this.serialize(async () => {
      if (this.ledgerStatus.state === 'degraded') throw new LedgerCorruptionError(this.ledgerStatus.message ?? 'Ledger is degraded');
      const records = await this.loadRecords();
      const expected = (records.at(-1)?.sequence ?? 0) + 1;
      if (event.sequence !== expected) throw new Error(`Ledger sequence must be ${expected}`);
      await this.appendLine(this.eventsPath, event);
      records.push(structuredClone(event));
      return { sequence: event.sequence };
    });
  }

  async *readAfter(sequence: number) {
    const records = await this.loadRecords();
    for (const event of records) if (event.sequence > sequence) yield structuredClone(event);
  }

  async findByEventId(eventId: string) {
    const records = await this.loadRecords();
    const event = records.find((entry) => entry.envelope.eventId === eventId);
    return event ? structuredClone(event) : null;
  }

  appendRejected(record: RejectedEventRecord): Promise<void> {
    return this.serialize(async () => {
      await this.ensureDirectory();
      const line = `${JSON.stringify(record)}\n`;
      if (Buffer.byteLength(line) > this.maxLineBytes) throw new Error(`Ledger line exceeds ${this.maxLineBytes} bytes`);
      let currentBytes = 0;
      try { currentBytes = (await stat(this.rejectedPath)).size; } catch (reason) {
        if ((reason as NodeJS.ErrnoException).code !== 'ENOENT') throw reason;
      }
      if (currentBytes > 0 && currentBytes + Buffer.byteLength(line) > this.maxRejectedFileBytes) {
        const finalIndex = Math.max(1, this.retainedRejectedFiles - 1);
        await rm(`${this.rejectedPath}.${finalIndex}`, { force: true });
        for (let index = finalIndex; index >= 1; index -= 1) {
          const source = index === 1 ? this.rejectedPath : `${this.rejectedPath}.${index - 1}`;
          try { await rename(source, `${this.rejectedPath}.${index}`); } catch (reason) {
            if ((reason as NodeJS.ErrnoException).code !== 'ENOENT') throw reason;
          }
        }
      }
      const handle = await open(this.rejectedPath, 'a');
      try { await handle.writeFile(line, 'utf8'); await handle.sync(); } finally { await handle.close(); }
    });
  }

  async recent(limit: number) {
    const records = await this.loadRecords();
    return records.slice(-Math.max(0, limit)).map((record) => structuredClone(record));
  }

  async recentRejected(limit: number) {
    await this.queue;
    const records: RejectedEventRecord[] = [];
    const lastRotation = Math.max(0, this.retainedRejectedFiles - 1);
    const paths = [...Array.from({ length: lastRotation }, (_, index) => `${this.rejectedPath}.${lastRotation - index}`), this.rejectedPath];
    for (const path of paths) {
      let raw = '';
      try { raw = await readFile(path, 'utf8'); } catch (reason) {
        if ((reason as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw reason;
      }
      for (const line of raw.split('\n').filter((entry) => entry.trim())) {
        try {
          const value: unknown = JSON.parse(line);
          if (value !== null && typeof value === 'object' && typeof (value as RejectedEventRecord).reasonCode === 'string') records.push(value as RejectedEventRecord);
        } catch { /* diagnostics skip malformed rejected records */ }
      }
    }
    return records.slice(-Math.max(0, limit)).map((record) => structuredClone(record));
  }

  status() { return { ...this.ledgerStatus }; }
  async close() { await this.queue; }
}
