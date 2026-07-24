import { useEffect, useMemo, useRef, useState } from 'react';
import type { DemoScenario } from '../../data/demoScenario';
import { officeLayout } from '../../data/officeLayout';
import type { OfficeNotification } from '../../backend/officeDomain';

type PeopleDirectoryProps = { scenario: DemoScenario; notifications: readonly OfficeNotification[]; pendingArtifactIds: ReadonlySet<string>; onAccept: (artifactId: string, assigneeDeskId: string) => Promise<unknown> };

const dispatchCategory: Record<string, string> = { 'pm-office': 'prd', 'dev-office': 'feature', 'qa-lab': 'report' };

export function PeopleDirectory({ scenario, notifications, pendingArtifactIds, onAccept }: PeopleDirectoryProps) {
  const parameters = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(parameters.get('q') ?? '');
  const [workspace, setWorkspace] = useState(parameters.get('workspace') ?? 'all');
  const [presence, setPresence] = useState(parameters.get('presence') ?? 'all');
  const [workState, setWorkState] = useState(parameters.get('work') ?? 'all');
  const [sort, setSort] = useState(parameters.get('sort') ?? 'default');
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [confirmArtifactId, setConfirmArtifactId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const rows = useMemo(() => scenario.people.map((person) => {
    const desk = officeLayout.desks.find((item) => item.id === person.deskId);
    const workspaceDefinition = officeLayout.workspaces.find((item) => item.id === desk?.workspaceId);
    return { person, desk, workspaceId: desk?.workspaceId ?? '', workspaceName: workspaceDefinition?.name ?? desk?.workspaceId ?? 'Unknown' };
  }).filter((row) => {
    const needle = search.trim().toLowerCase();
    return (!needle || row.desk?.occupant.displayName.toLowerCase().includes(needle) || row.workspaceName.toLowerCase().includes(needle))
      && (workspace === 'all' || row.workspaceId === workspace)
      && (presence === 'all' || row.person.availability.toLowerCase() === presence)
      && (workState === 'all' || (workState === 'pending' ? notifications.some((item) => item.assigneeDeskId === row.person.deskId && item.status !== 'completed') : row.person.activeWorks.length > 0));
  }).sort((left, right) => sort === 'name' ? (left.desk?.occupant.displayName ?? '').localeCompare(right.desk?.occupant.displayName ?? '') : sort === 'pending' ? notifications.filter((item) => item.assigneeDeskId === right.person.deskId && item.status !== 'completed').length - notifications.filter((item) => item.assigneeDeskId === left.person.deskId && item.status !== 'completed').length : sort === 'active' ? right.person.activeWorks.length - left.person.activeWorks.length : 0), [notifications, presence, scenario.people, search, sort, workState, workspace]);
  const updateQuery = (next: Record<string, string>) => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(next)) value === 'all' || !value ? url.searchParams.delete(key) : url.searchParams.set(key, value);
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  };
  return <section className="operations-people" aria-label="People operations">
    <div className="operations-filters">
      <label>Search people<input aria-label="Search people" onChange={(event) => { setSearch(event.target.value); updateQuery({ q: event.target.value }); }} value={search} /></label>
      <label>Workspace<select aria-label="Workspace filter" onChange={(event) => { setWorkspace(event.target.value); updateQuery({ workspace: event.target.value }); }} value={workspace}><option value="all">All workspaces</option>{officeLayout.workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Presence<select aria-label="Presence filter" onChange={(event) => { setPresence(event.target.value); updateQuery({ presence: event.target.value }); }} value={presence}><option value="all">All presence</option><option value="online">Online</option><option value="offline">Offline</option></select></label>
      <label>Work state<select aria-label="Work state filter" onChange={(event) => { setWorkState(event.target.value); updateQuery({ work: event.target.value }); }} value={workState}><option value="all">All work</option><option value="pending">Has Pending</option><option value="active">Has Active Work</option></select></label>
      <label>Sort<select aria-label="People sort" onChange={(event) => { setSort(event.target.value); updateQuery({ sort: event.target.value }); }} value={sort}><option value="default">Workspace order</option><option value="name">Name</option><option value="pending">Pending assignments</option><option value="active">Active work</option></select></label>
    </div>
    <p role="status">{rows.length} people shown</p>
    <table aria-label="People directory"><caption>People directory</caption><thead><tr><th>Name</th><th>Workspace</th><th>Presence</th><th>Pending Assignments</th><th>Active Work</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => {
      const pending = notifications.filter((item) => item.assigneeDeskId === row.person.deskId && item.status !== 'completed').length;
      return <tr key={row.person.deskId} onClick={() => setSelectedDeskId(row.person.deskId)}><td><button aria-label={`Open ${row.desk?.occupant.displayName ?? row.person.deskId} details`} type="button">{row.desk?.occupant.displayName ?? row.person.deskId}</button></td><td>{row.workspaceName}</td><td>{row.person.availability}</td><td>{pending}</td><td>{row.person.activeWorks.length}</td><td><a href={`/ops/dispatch?producerDeskId=${encodeURIComponent(row.person.deskId)}&category=${dispatchCategory[row.workspaceId] ?? 'prd'}`}>Create Artifact</a></td></tr>;
    })}</tbody></table>
    {selectedDeskId ? <PersonDetail acceptError={acceptError} confirmArtifactId={confirmArtifactId} notifications={notifications} onAccept={async (artifactId) => { setAcceptError(null); try { await onAccept(artifactId, selectedDeskId); setConfirmArtifactId(null); } catch (reason) { setAcceptError(reason instanceof Error ? reason.message : 'Unable to accept artifact'); } }} onClose={() => setSelectedDeskId(null)} pendingArtifactIds={pendingArtifactIds} person={scenario.people.find((item) => item.deskId === selectedDeskId)!} scenario={scenario} setConfirmArtifactId={setConfirmArtifactId} /> : null}
  </section>;
}

function PersonDetail({ acceptError, confirmArtifactId, notifications, onAccept, onClose, pendingArtifactIds, person, scenario, setConfirmArtifactId }: { acceptError: string | null; confirmArtifactId: string | null; notifications: readonly OfficeNotification[]; onAccept: (artifactId: string) => Promise<void>; onClose: () => void; pendingArtifactIds: ReadonlySet<string>; person: DemoScenario['people'][number]; scenario: DemoScenario; setConfirmArtifactId: (value: string | null) => void }) {
  const desk = officeLayout.desks.find((item) => item.id === person.deskId)!;
  const workspace = officeLayout.workspaces.find((item) => item.id === desk.workspaceId)!;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      returnFocus?.focus();
    };
  }, []);
  const assigned = notifications.filter((item) => item.assigneeDeskId === person.deskId && item.status !== 'completed');
  const related = scenario.artifacts.filter((artifact) => artifact.submittedBy === desk.occupant.displayName || assigned.some((item) => item.artifactId === artifact.id)).slice(0, 10);
  return <section aria-label={`${desk.occupant.displayName} details`} aria-modal="true" className="operations-person-detail" role="dialog"><button aria-label="Close person details" onClick={onClose} ref={closeButtonRef} type="button">Close</button><h2>{desk.occupant.displayName}</h2><dl><div><dt>Role</dt><dd>{person.role}</dd></div><div><dt>Workspace</dt><dd>{workspace.name}</dd></div><div><dt>Presence</dt><dd>{person.availability}</dd></div><div><dt>Agent pairing</dt><dd>{person.agent}</dd></div></dl><section><h3>Pending Assignments</h3>{assigned.length ? <ul>{assigned.map((item) => { const artifact = scenario.artifacts.find((entry) => entry.id === item.artifactId); return <li key={item.id}><strong>{artifact?.title ?? item.artifactId}</strong><span>{item.status === 'available' ? 'Awaiting Acceptance' : 'Pending delivery'}</span>{item.canAccept ? <button disabled={pendingArtifactIds.has(item.artifactId)} onClick={() => setConfirmArtifactId(item.artifactId)} type="button">{pendingArtifactIds.has(item.artifactId) ? 'Accepting...' : `Simulate Accept as ${desk.occupant.displayName}`}</button> : null}</li>; })}</ul> : <p>No pending assignments.</p>}</section><section><h3>Active Work</h3>{person.activeWorks.length ? <ul>{person.activeWorks.map((work) => <li key={work.id}>{work.title}</li>)}</ul> : <p>No active work.</p>}</section><section><h3>Related Artifacts</h3>{related.length ? <ul>{related.map((artifact) => <li key={artifact.id}>{artifact.title}<small>{artifact.id}</small></li>)}</ul> : <p>No related artifacts.</p>}</section>{confirmArtifactId ? <section aria-label="Confirm simulated acceptance"><p>Simulate acceptance by {desk.occupant.displayName}?</p><button onClick={() => { void onAccept(confirmArtifactId); }} type="button">Confirm acceptance</button><button onClick={() => setConfirmArtifactId(null)} type="button">Cancel</button></section> : null}{acceptError ? <p role="alert">{acceptError}</p> : null}</section>;
}
