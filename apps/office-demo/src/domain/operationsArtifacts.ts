import type { OfficeSnapshot } from '../backend/officeDomain';
import { officeLayout } from '../data/officeLayout';
import type { ArtifactCategory } from '../data/demoScenario';
import type { PersistedBusinessEvent } from '../backend/eventLedger';

export type OperationsArtifactState = 'Delivering' | 'Awaiting Acceptance' | 'Accepted' | 'Collecting' | 'Active Work';
export type OperationsArtifactSummary = { id: string; title: string; category: string; producerDeskId?: string; assigneeDeskId?: string; lifecycleState: OperationsArtifactState; submittedAt?: string; updatedAt?: string };
export type OperationsArtifactPage = { items: OperationsArtifactSummary[]; nextCursor: string | null; total: number };
export type OperationsArtifactListQuery = { query?: string; category?: ArtifactCategory; lifecycleState?: OperationsArtifactState; producerDeskId?: string; assigneeDeskId?: string; workspaceId?: string; limit?: number; cursor?: string; sort?: 'updated' | 'title' | 'submitted'; direction?: 'asc' | 'desc' };
export type OperationsArtifactDetail = OperationsArtifactSummary & { evidence: OfficeSnapshot['scenario']['artifacts'][number]['evidence']; submittedBy: string; confirmedBy: string; acceptedBy: string; baseline: boolean };

export function getOperationsArtifactState(artifactId: string, snapshot: OfficeSnapshot): OperationsArtifactState {
  const runtime = snapshot.artifacts[artifactId];
  if (runtime?.status === 'Delivering') return 'Delivering';
  if (runtime?.status === 'Awaiting Acceptance') return 'Awaiting Acceptance';
  if (runtime?.status === 'Collecting') return 'Collecting';
  if (runtime?.status === 'Accepted') return 'Active Work';
  if (snapshot.scenario.people.some((person) => person.activeWorks.some((work) => work.sourceArtifactId === artifactId))) return 'Active Work';
  if (snapshot.scenario.hubArtifactIds.prd.includes(artifactId) || snapshot.scenario.hubArtifactIds.feature.includes(artifactId) || snapshot.scenario.hubArtifactIds.report.includes(artifactId)) return 'Awaiting Acceptance';
  const scenarioArtifact = snapshot.scenario.artifacts.find((artifact) => artifact.id === artifactId);
  return scenarioArtifact?.status === 'Submitted' ? 'Delivering' : 'Accepted';
}

function deskIdForName(name: string) { return officeLayout.desks.find((desk) => desk.occupant.displayName === name)?.id; }

function artifactSummary(artifact: OfficeSnapshot['scenario']['artifacts'][number], snapshot: OfficeSnapshot): OperationsArtifactSummary {
  const runtime = snapshot.artifacts[artifact.id];
  const producerDeskId = runtime?.producerDeskId ?? deskIdForName(artifact.submittedBy);
  const assigneeDeskId = runtime?.assigneeDeskId
    ?? snapshot.scenario.people.find((person) => person.activeWorks.some((work) => work.sourceArtifactId === artifact.id))?.deskId
    ?? deskIdForName(artifact.acceptedBy);
  return { id: artifact.id, title: artifact.title, category: artifact.category, producerDeskId, assigneeDeskId, lifecycleState: getOperationsArtifactState(artifact.id, snapshot) };
}

type ArtifactMetadata = { submittedAt?: string; updatedAt?: string };
type Cursor = { epoch: number; revision: number; sort: NonNullable<OperationsArtifactListQuery['sort']>; direction: NonNullable<OperationsArtifactListQuery['direction']>; key: string; id: string };

export class InvalidArtifactCursorError extends Error {}

function relatedArtifactId(record: PersistedBusinessEvent) {
  const payload = record.envelope.payload as Record<string, unknown>;
  return record.envelope.eventType === 'artifact.submitted' ? (payload.artifact as Record<string, unknown> | undefined)?.id : payload.artifactId;
}

function artifactMetadata(records: readonly PersistedBusinessEvent[]) {
  const metadata = new Map<string, ArtifactMetadata>();
  for (const record of records) {
    const artifactId = relatedArtifactId(record);
    if (typeof artifactId !== 'string') continue;
    const current = metadata.get(artifactId) ?? {};
    if (record.envelope.eventType === 'artifact.submitted' && !current.submittedAt) current.submittedAt = record.envelope.occurredAt;
    current.updatedAt = record.envelope.occurredAt;
    metadata.set(artifactId, current);
  }
  return metadata;
}

function cursorFor(value: Cursor) { return encodeURIComponent(JSON.stringify(value)); }
function parseCursor(value: string | undefined, snapshot: OfficeSnapshot, sort: Cursor['sort'], direction: Cursor['direction']): Cursor | null {
  if (!value) return null;
  try {
    const decoded: unknown = JSON.parse(decodeURIComponent(value));
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) throw new Error();
    const cursor = decoded as Partial<Cursor>;
    if (cursor.epoch !== snapshot.epoch || cursor.revision !== snapshot.revision || cursor.sort !== sort || cursor.direction !== direction || typeof cursor.key !== 'string' || typeof cursor.id !== 'string') throw new Error();
    return cursor as Cursor;
  } catch { throw new InvalidArtifactCursorError('Invalid or stale artifact cursor'); }
}

export function listOperationsArtifacts(snapshot: OfficeSnapshot, query: OperationsArtifactListQuery = {}, records: readonly PersistedBusinessEvent[] = []): OperationsArtifactPage {
  const limit = Math.max(1, Math.min(100, query.limit ?? 25));
  const needle = query.query?.trim().toLowerCase() ?? '';
  const sort = query.sort ?? 'updated';
  const direction = query.direction ?? 'desc';
  const metadata = artifactMetadata(records);
  const all = snapshot.scenario.artifacts.map((artifact, sourceIndex) => ({ ...artifactSummary(artifact, snapshot), ...metadata.get(artifact.id), sourceIndex })).filter((artifact) => {
    const matchesWorkspace = !query.workspaceId || [artifact.producerDeskId, artifact.assigneeDeskId].some((deskId) => officeLayout.desks.find((desk) => desk.id === deskId)?.workspaceId === query.workspaceId);
    return (!needle || artifact.title.toLowerCase().includes(needle) || artifact.id.toLowerCase().includes(needle))
      && (!query.category || artifact.category === query.category)
      && (!query.lifecycleState || artifact.lifecycleState === query.lifecycleState)
      && (!query.producerDeskId || artifact.producerDeskId === query.producerDeskId)
      && (!query.assigneeDeskId || artifact.assigneeDeskId === query.assigneeDeskId)
      && matchesWorkspace;
  }).map((artifact) => ({ ...artifact, cursorKey: sort === 'title' ? artifact.title.toLocaleLowerCase() : sort === 'submitted' ? artifact.submittedAt ?? '' : artifact.updatedAt ?? '' })).sort((left, right) => {
    const comparison = left.cursorKey.localeCompare(right.cursorKey) || left.id.localeCompare(right.id);
    return direction === 'asc' ? comparison : -comparison;
  });
  const cursor = parseCursor(query.cursor, snapshot, sort, direction);
  const eligible = cursor ? all.filter((artifact) => {
    const comparison = artifact.cursorKey.localeCompare(cursor.key) || artifact.id.localeCompare(cursor.id);
    return direction === 'asc' ? comparison > 0 : comparison < 0;
  }) : all;
  const page = eligible.slice(0, limit);
  const last = page.at(-1);
  return { items: page.map(({ sourceIndex: _sourceIndex, cursorKey: _cursorKey, ...artifact }) => artifact), nextCursor: last && eligible.length > page.length ? cursorFor({ epoch: snapshot.epoch, revision: snapshot.revision, sort, direction, key: last.cursorKey, id: last.id }) : null, total: all.length };
}

export function getOperationsArtifactDetail(artifactId: string, snapshot: OfficeSnapshot): OperationsArtifactDetail | null {
  const artifact = snapshot.scenario.artifacts.find((item) => item.id === artifactId);
  if (!artifact) return null;
  const runtime = snapshot.artifacts[artifact.id];
  return { ...artifactSummary(artifact, snapshot), evidence: artifact.evidence, submittedBy: artifact.submittedBy, confirmedBy: artifact.confirmedBy, acceptedBy: artifact.acceptedBy, baseline: !runtime };
}

export function getOperationsArtifactTimeline(artifactId: string, snapshot: OfficeSnapshot, records: readonly PersistedBusinessEvent[] = []) {
  const detail = getOperationsArtifactDetail(artifactId, snapshot);
  if (!detail) return null;
  if (detail.baseline) return [{ kind: 'baseline' as const, label: 'Baseline state loaded' }];
  const matchingEvents = records.filter((record) => {
    return relatedArtifactId(record) === artifactId;
  });
  const included = new Set<string>();
  const correlations = new Set<string>();
  for (const record of matchingEvents) {
    if (record.envelope.eventType === 'artifact.submitted') {
      included.add(record.envelope.eventId);
      correlations.add(record.envelope.correlationId);
    }
  }
  for (let changed = true; changed;) {
    changed = false;
    for (const record of matchingEvents) {
      if (included.has(record.envelope.eventId)) continue;
      if (correlations.has(record.envelope.correlationId) || (record.envelope.causationId && included.has(record.envelope.causationId))) {
        included.add(record.envelope.eventId);
        correlations.add(record.envelope.correlationId);
        changed = true;
      }
    }
  }
  const lifecycleRecords = included.size ? matchingEvents.filter((record) => included.has(record.envelope.eventId)) : matchingEvents;
  const events = lifecycleRecords.map((record) => {
    const labels: Record<string, string> = { 'artifact.submitted': 'Submitted', 'artifact.delivered': 'Delivered to Artifact Hub', 'artifact.accepted': 'Accepted', 'artifact.received': 'Received / Active Work' };
    return { kind: 'event' as const, eventId: record.envelope.eventId, eventType: record.envelope.eventType, occurredAt: record.envelope.occurredAt, correlationId: record.envelope.correlationId, ...(record.envelope.causationId ? { causationId: record.envelope.causationId } : {}), actor: record.envelope.source.system, label: labels[record.envelope.eventType] ?? 'Lifecycle event' };
  }).sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  return events.length ? events : [{ kind: 'projection' as const, label: detail.lifecycleState }];
}
