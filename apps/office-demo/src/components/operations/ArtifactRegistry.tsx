import { useEffect, useMemo, useRef, useState } from 'react';
import type { OfficeNotification, OfficeSnapshot } from '../../backend/officeDomain';
import { getArtifactRoute } from '../../domain/artifactRouting';
import { getOperationsArtifactDetail, getOperationsArtifactState, listOperationsArtifacts, type OperationsArtifactPage, type OperationsArtifactState } from '../../domain/operationsArtifacts';
import { officeLayout } from '../../data/officeLayout';
import { FeatureEvidencePanel, PrdEvidencePanel, TestReportEvidencePanel } from '../inspector/ArtifactEvidencePanels';

type ArtifactRegistryProps = { snapshot: OfficeSnapshot; loaded: boolean; notifications: readonly OfficeNotification[]; pendingArtifactIds: ReadonlySet<string>; onAccept: (artifactId: string, assigneeDeskId: string) => Promise<unknown> };
type CategoryFilter = 'all' | 'prd' | 'feature' | 'report';
type StateFilter = 'all' | OperationsArtifactState;
type ArtifactSort = 'updated' | 'title' | 'submitted';
type Direction = 'asc' | 'desc';
type TimelineItem = { kind: string; label: string; occurredAt?: string; actor?: string; eventId?: string };

function writeQuery(next: Record<string, string>, push = false) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(next)) value === 'all' || !value ? url.searchParams.delete(key) : url.searchParams.set(key, value);
  window.history[push ? 'pushState' : 'replaceState']({}, '', `${url.pathname}${url.search}`);
}

function deskName(deskId: string | undefined) { return officeLayout.desks.find((desk) => desk.id === deskId)?.occupant.displayName ?? 'Unassigned'; }
function initialValue<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[], fallback: T) { const value = params.get(key) as T | null; return value && allowed.includes(value) ? value : fallback; }

export function ArtifactRegistry({ snapshot, loaded, notifications, pendingArtifactIds, onAccept }: ArtifactRegistryProps) {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get('query') ?? '');
  const [category, setCategory] = useState<CategoryFilter>(initialValue<CategoryFilter>(params, 'category', ['all', 'prd', 'feature', 'report'], 'all'));
  const [state, setState] = useState<StateFilter>(initialValue<StateFilter>(params, 'state', ['all', 'Delivering', 'Awaiting Acceptance', 'Accepted', 'Collecting', 'Active Work'], 'all'));
  const [producerDeskId, setProducerDeskId] = useState(initialValue(params, 'producerDeskId', ['all', ...officeLayout.desks.map((desk) => desk.id)], 'all'));
  const [assigneeDeskId, setAssigneeDeskId] = useState(initialValue(params, 'assigneeDeskId', ['all', ...officeLayout.desks.map((desk) => desk.id)], 'all'));
  const [workspaceId, setWorkspaceId] = useState(initialValue(params, 'workspaceId', ['all', ...officeLayout.workspaces.map((workspace) => workspace.id)], 'all'));
  const [sort, setSort] = useState<ArtifactSort>(initialValue<ArtifactSort>(params, 'sort', ['updated', 'title', 'submitted'], 'updated'));
  const [direction, setDirection] = useState<Direction>(initialValue<Direction>(params, 'direction', ['asc', 'desc'], 'desc'));
  const [limit, setLimit] = useState(initialValue(params, 'limit', ['25', '50', '100'], '25'));
  const [cursor, setCursor] = useState(params.get('cursor') ?? '');
  const [previousCursors, setPreviousCursors] = useState<string[]>([]);
  const [page, setPage] = useState<OperationsArtifactPage>(() => listOperationsArtifacts(snapshot, { limit: Number(limit), sort, direction }));
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(params.get('artifactId'));
  const triggerRef = useRef<HTMLElement | null>(null);

  const queryString = useMemo(() => {
    const search = new URLSearchParams();
    if (query) search.set('query', query);
    if (category !== 'all') search.set('category', category);
    if (state !== 'all') search.set('state', state);
    if (producerDeskId !== 'all') search.set('producerDeskId', producerDeskId);
    if (assigneeDeskId !== 'all') search.set('assigneeDeskId', assigneeDeskId);
    if (workspaceId !== 'all') search.set('workspaceId', workspaceId);
    search.set('sort', sort); search.set('direction', direction); search.set('limit', limit);
    if (cursor) search.set('cursor', cursor);
    return search.toString();
  }, [assigneeDeskId, category, cursor, direction, limit, producerDeskId, query, sort, state, workspaceId]);

  useEffect(() => {
    let current = true;
    const fallback = (includeCursor = true) => listOperationsArtifacts(snapshot, { query, ...(category === 'all' ? {} : { category }), ...(state === 'all' ? {} : { lifecycleState: state }), ...(producerDeskId === 'all' ? {} : { producerDeskId }), ...(assigneeDeskId === 'all' ? {} : { assigneeDeskId }), ...(workspaceId === 'all' ? {} : { workspaceId }), sort, direction, limit: Number(limit), ...(cursor && includeCursor ? { cursor } : {}) });
    void fetch(`/api/internal/artifacts?${queryString}`).then(async (response) => {
      if (!response.ok) throw new Error('Artifact registry is unavailable');
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== 'object' || !Array.isArray((payload as OperationsArtifactPage).items)) throw new Error('Artifact registry returned an invalid response');
      return payload as OperationsArtifactPage;
    }).then((next) => { if (current) { setPage(next); setListError(null); } }).catch(() => { if (current) { try { setPage(fallback()); } catch { setCursor(''); setPreviousCursors([]); writeQuery({ cursor: '' }); setPage(fallback(false)); } setListError('Live registry data is temporarily unavailable; showing the current projection.'); } });
    return () => { current = false; };
  }, [assigneeDeskId, category, cursor, direction, limit, producerDeskId, query, queryString, snapshot, sort, state, workspaceId]);

  useEffect(() => {
    const onPopState = () => setSelectedId(new URLSearchParams(window.location.search).get('artifactId'));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (loaded && selectedId && !snapshot.scenario.artifacts.some((artifact) => artifact.id === selectedId)) {
      setSelectedId(null); writeQuery({ artifactId: '' });
    }
  }, [loaded, selectedId, snapshot]);

  const resetCursor = (next: Record<string, string>) => { setCursor(''); setPreviousCursors([]); writeQuery({ ...next, cursor: '' }); };
  const select = (artifactId: string, trigger: HTMLButtonElement) => { triggerRef.current = trigger; setSelectedId(artifactId); writeQuery({ artifactId }, true); };
  const close = () => { setSelectedId(null); writeQuery({ artifactId: '' }); window.setTimeout(() => triggerRef.current?.focus(), 0); };
  const selected = selectedId ? getOperationsArtifactDetail(selectedId, snapshot) : null;

  return <section className="operations-artifacts" aria-label="Artifact operations">
    <div className="operations-filters">
      <label>Search artifacts<input aria-label="Search artifacts" onChange={(event) => { setQuery(event.target.value); resetCursor({ query: event.target.value }); }} value={query} /></label>
      <label>Category<select aria-label="Artifact category filter" onChange={(event) => { const value = event.target.value as CategoryFilter; setCategory(value); resetCursor({ category: value }); }} value={category}><option value="all">All categories</option><option value="prd">PRD</option><option value="feature">Feature</option><option value="report">Test Report</option></select></label>
      <label>Lifecycle<select aria-label="Artifact lifecycle filter" onChange={(event) => { const value = event.target.value as StateFilter; setState(value); resetCursor({ state: value }); }} value={state}><option value="all">All lifecycle states</option>{['Delivering', 'Awaiting Acceptance', 'Accepted', 'Collecting', 'Active Work'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Producer<select aria-label="Producer filter" onChange={(event) => { setProducerDeskId(event.target.value); resetCursor({ producerDeskId: event.target.value }); }} value={producerDeskId}><option value="all">All producers</option>{officeLayout.desks.map((desk) => <option key={desk.id} value={desk.id}>{desk.occupant.displayName}</option>)}</select></label>
      <label>Assignee<select aria-label="Assignee filter" onChange={(event) => { setAssigneeDeskId(event.target.value); resetCursor({ assigneeDeskId: event.target.value }); }} value={assigneeDeskId}><option value="all">All assignees</option>{officeLayout.desks.map((desk) => <option key={desk.id} value={desk.id}>{desk.occupant.displayName}</option>)}</select></label>
      <label>Workspace<select aria-label="Workspace filter" onChange={(event) => { setWorkspaceId(event.target.value); resetCursor({ workspaceId: event.target.value }); }} value={workspaceId}><option value="all">All workspaces</option>{officeLayout.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
      <label>Sort<select aria-label="Artifact sort" onChange={(event) => { setSort(event.target.value as ArtifactSort); resetCursor({ sort: event.target.value }); }} value={sort}><option value="updated">Updated</option><option value="title">Title</option><option value="submitted">Submitted time</option></select></label>
      <label>Direction<select aria-label="Artifact sort direction" onChange={(event) => { setDirection(event.target.value as Direction); resetCursor({ direction: event.target.value }); }} value={direction}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
      <label>Results per page<select aria-label="Results per page" onChange={(event) => { setLimit(event.target.value); resetCursor({ limit: event.target.value }); }} value={limit}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label>
    </div>
    {listError ? <p role="status">{listError}</p> : null}
    <p role="status">{page.total} artifacts found</p>
    {page.items.length ? <table aria-label="Artifact registry"><caption>Artifact registry</caption><thead><tr><th>Title</th><th>Category</th><th>Producer</th><th>Assignee</th><th>Lifecycle State</th><th>Updated</th></tr></thead><tbody>{page.items.map((row) => <tr key={row.id}><td><button aria-label={`Open ${row.title} details`} onClick={(event) => select(row.id, event.currentTarget)} type="button">{row.title}</button><small>{row.id}</small></td><td>{row.category === 'prd' ? 'PRD' : row.category === 'feature' ? 'Feature' : 'Test Report'}</td><td>{deskName(row.producerDeskId)}</td><td>{deskName(row.assigneeDeskId)}</td><td>{row.lifecycleState}</td><td>{row.updatedAt ? <time>{row.updatedAt}</time> : 'Baseline'}</td></tr>)}</tbody></table> : <p>No matching Artifacts. <button onClick={() => { setQuery(''); setCategory('all'); setState('all'); setProducerDeskId('all'); setAssigneeDeskId('all'); setWorkspaceId('all'); resetCursor({ query: '', category: '', state: '', producerDeskId: '', assigneeDeskId: '', workspaceId: '' }); }} type="button">Clear filters</button></p>}
    <nav aria-label="Artifact pagination"><button disabled={!previousCursors.length} onClick={() => { const previous = previousCursors.at(-1) ?? ''; setPreviousCursors((items) => items.slice(0, -1)); setCursor(previous); writeQuery({ cursor: previous }); }} type="button">Previous page</button><button disabled={!page.nextCursor} onClick={() => { if (!page.nextCursor) return; setPreviousCursors((items) => [...items, cursor]); setCursor(page.nextCursor); writeQuery({ cursor: page.nextCursor }); }} type="button">Next page</button></nav>
    {selected ? <ArtifactDetail notifications={notifications} onAccept={onAccept} onClose={close} pendingArtifactIds={pendingArtifactIds} row={selected} snapshot={snapshot} /> : null}
  </section>;
}

function ArtifactDetail({ notifications, onAccept, onClose, pendingArtifactIds, row, snapshot }: { notifications: readonly OfficeNotification[]; onAccept: (artifactId: string, assigneeDeskId: string) => Promise<unknown>; onClose: () => void; pendingArtifactIds: ReadonlySet<string>; row: ReturnType<typeof getOperationsArtifactDetail> extends infer Result ? NonNullable<Result> : never; snapshot: OfficeSnapshot }) {
  const route = getArtifactRoute(row.category as 'prd' | 'feature' | 'report');
  const notification = notifications.find((item) => item.artifactId === row.id && item.status === 'available' && item.canAccept);
  const [confirming, setConfirming] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<readonly TimelineItem[] | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    let current = true;
    void fetch(`/api/internal/artifacts/${encodeURIComponent(row.id)}/events`).then(async (response) => {
      if (!response.ok) throw new Error('Timeline unavailable');
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error('Timeline unavailable');
      return payload as readonly TimelineItem[];
    }).then((items) => { if (current) setTimeline(items); }).catch(() => { if (current) setTimeline(null); });
    return () => { current = false; };
  }, [row.id, snapshot.revision]);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [onClose]);
  const accept = async () => {
    if (!notification) return;
    setError(null);
    try { await onAccept(row.id, notification.assigneeDeskId); setAccepted(true); setConfirming(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to accept artifact'); }
  };
  const fallbackTimeline: readonly TimelineItem[] = row.baseline ? [{ kind: 'baseline', label: 'Baseline state loaded' }] : [{ kind: 'projection', label: row.lifecycleState }];
  return <section aria-label={`${row.title} details`} aria-modal="true" className="operations-person-detail" role="dialog"><button aria-label="Close artifact details" onClick={onClose} ref={closeRef} type="button">Close</button><h2>{row.title}</h2><dl><div><dt>Category</dt><dd>{row.category === 'report' ? 'Test Report' : row.category.toUpperCase()}</dd></div><div><dt>Lifecycle</dt><dd>{row.lifecycleState}</dd></div><div><dt>Producer</dt><dd>{deskName(row.producerDeskId)}</dd></div><div><dt>Assignee</dt><dd>{deskName(row.assigneeDeskId)}</dd></div><div><dt>Submitted by</dt><dd>{row.submittedBy}</dd></div><div><dt>Confirmed by</dt><dd>{row.confirmedBy}</dd></div></dl>{row.lifecycleState === 'Awaiting Acceptance' && row.assigneeDeskId ? <p>Waiting for {deskName(row.assigneeDeskId)} to accept</p> : null}<section><h3>Evidence</h3>{row.evidence.kind === 'prd' ? <PrdEvidencePanel evidence={row.evidence} /> : row.evidence.kind === 'feature' ? <FeatureEvidencePanel evidence={row.evidence} /> : <TestReportEvidencePanel evidence={row.evidence} />}</section><section><h3>Lifecycle timeline</h3><ol>{(timeline ?? fallbackTimeline).map((item, index) => <li key={item.eventId ?? `${item.kind}-${index}`}><strong>{item.label}</strong>{item.occurredAt ? <p><time>{item.occurredAt}</time>{item.actor ? ` · ${item.actor}` : ''}</p> : item.kind === 'baseline' ? <p>Complete event history is available only for artifacts added after event-driven operations began.</p> : <p>Current projection state.</p>}{item.eventId ? <details><summary>Technical event ID</summary><code>{item.eventId}</code></details> : null}</li>)}</ol></section>{notification ? !confirming ? <button disabled={pendingArtifactIds.has(row.id)} onClick={() => setConfirming(true)} type="button">{pendingArtifactIds.has(row.id) ? 'Accepting...' : `Accept as ${deskName(notification.assigneeDeskId)}`}</button> : <section aria-label="Confirm artifact acceptance"><p>Accept this artifact as {deskName(notification.assigneeDeskId)}?</p><button onClick={() => { void accept(); }} type="button">Confirm acceptance</button><button onClick={() => setConfirming(false)} type="button">Cancel</button></section> : null}{accepted ? <p role="status">Accept request submitted.</p> : null}{error ? <p role="alert">{error}</p> : null}<a href={`/ops/dispatch?producerDeskId=${encodeURIComponent(row.producerDeskId ?? officeLayout.desks.find((desk) => desk.workspaceId === route.producerWorkspaceId)?.id ?? '')}&category=${row.category}`}>Create Follow-up Artifact</a></section>;
}
