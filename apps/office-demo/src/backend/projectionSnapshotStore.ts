import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { OfficeSnapshot } from './officeDomain';

export type PersistedProjectionSnapshot = {
  formatVersion: 1;
  epoch: number;
  lastSequence: number;
  savedAt: string;
  projection: OfficeSnapshot;
  idempotencyIndex: Record<string, string>;
};

export interface ProjectionSnapshotStore {
  load(): Promise<PersistedProjectionSnapshot | null>;
  save(snapshot: PersistedProjectionSnapshot): Promise<void>;
}

function isSnapshot(value: unknown): value is PersistedProjectionSnapshot {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const snapshot = value as Partial<PersistedProjectionSnapshot>;
  return snapshot.formatVersion === 1 && Number.isInteger(snapshot.epoch) && Number.isInteger(snapshot.lastSequence)
    && typeof snapshot.savedAt === 'string' && snapshot.projection !== null && typeof snapshot.projection === 'object'
    && snapshot.idempotencyIndex !== null && typeof snapshot.idempotencyIndex === 'object' && !Array.isArray(snapshot.idempotencyIndex);
}

export class InMemoryProjectionSnapshotStore implements ProjectionSnapshotStore {
  snapshot: PersistedProjectionSnapshot | null = null;
  async load() { return this.snapshot ? structuredClone(this.snapshot) : null; }
  async save(snapshot: PersistedProjectionSnapshot) { this.snapshot = structuredClone(snapshot); }
}

export class JsonProjectionSnapshotStore implements ProjectionSnapshotStore {
  private readonly path: string;
  constructor(private readonly options: { directory: string }) { this.path = join(options.directory, 'office-snapshot.json'); }

  async load() {
    try {
      const value: unknown = JSON.parse(await readFile(this.path, 'utf8'));
      return isSnapshot(value) ? value : null;
    } catch { return null; }
  }

  async save(snapshot: PersistedProjectionSnapshot) {
    await mkdir(this.options.directory, { recursive: true });
    const temporary = `${this.path}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, JSON.stringify(snapshot), 'utf8');
    await rename(temporary, this.path);
  }
}
