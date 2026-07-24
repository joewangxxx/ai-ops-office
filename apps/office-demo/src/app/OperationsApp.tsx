import { useEffect, useRef, useState } from 'react';
import { navigate, type AppRoute } from './appRoute';
import { useOfficeBackend } from '../hooks/useOfficeBackend';
import { ArtifactDispatchForm } from '../components/operations/ArtifactDispatchForm';
import { PeopleDirectory } from '../components/operations/PeopleDirectory';
import { ArtifactRegistry } from '../components/operations/ArtifactRegistry';
import { OperationsEvents } from '../components/operations/OperationsEvents';
import { OperationsSystem } from '../components/operations/OperationsSystem';

const navigation: ReadonlyArray<{ route: Exclude<AppRoute, '/office' | 'not-found'>; label: string; task: string }> = [
  { route: '/ops', label: 'Overview', task: 'Task 16' },
  { route: '/ops/dispatch', label: 'Dispatch', task: 'Task 16' },
  { route: '/ops/people', label: 'People', task: 'Task 17' },
  { route: '/ops/artifacts', label: 'Artifacts', task: 'Task 18' },
  { route: '/ops/events', label: 'Events', task: 'Task 19' },
  { route: '/ops/system', label: 'System', task: 'Task 19' },
];

function connectionLabel(mode: 'connecting' | 'sse' | 'polling' | 'offline') {
  if (mode === 'sse') return 'SSE connected';
  if (mode === 'polling') return 'Polling fallback';
  if (mode === 'offline') return 'Offline';
  return 'Connecting';
}

export function OperationsApp({ route }: { route: Exclude<AppRoute, '/office' | 'not-found'> }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { acceptArtifact, connectionState, error, pendingArtifactIds, postBusinessEvent, resetProjection, snapshot } = useOfficeBackend();
  const current = navigation.find((item) => item.route === route)!;

  useEffect(() => {
    document.title = `${current.label} · Operations Console`;
    titleRef.current?.focus();
  }, [current.label]);

  return <main className="operations-shell">
    <header className="operations-topbar">
      <button aria-expanded={drawerOpen} aria-label="Open Operations navigation" className="operations-menu" onClick={() => setDrawerOpen((open) => !open)} type="button">Menu</button>
      <div><strong>Operations Console</strong><span>Local / Internal</span></div>
      <p role="status">{connectionLabel(connectionState.mode)}</p>
      <a href="/office">Open Office View</a>
    </header>
    <aside aria-label="Operations navigation" className="operations-sidebar" data-open={drawerOpen}>
      <nav aria-label="Operations">
        {navigation.map((item) => <a aria-current={item.route === route ? 'page' : undefined} href={item.route} key={item.route} onClick={(event) => { event.preventDefault(); setDrawerOpen(false); navigate(item.route); }}>{item.label}</a>)}
      </nav>
    </aside>
    <section className="operations-content">
      <p className="operations-eyebrow">Internal operations</p>
      <h1 ref={titleRef} tabIndex={-1}>{current.label}</h1>
      {route === '/ops' ? <Overview connection={connectionState.mode} error={error} snapshot={snapshot} /> : route === '/ops/dispatch' ? <ArtifactDispatchForm onSubmit={postBusinessEvent} scenario={snapshot.scenario} /> : route === '/ops/people' ? <PeopleDirectory notifications={snapshot.notifications} onAccept={acceptArtifact} pendingArtifactIds={pendingArtifactIds} scenario={snapshot.scenario} /> : route === '/ops/artifacts' ? <ArtifactRegistry loaded={connectionState.mode !== 'connecting'} notifications={snapshot.notifications} onAccept={acceptArtifact} pendingArtifactIds={pendingArtifactIds} snapshot={snapshot} /> : route === '/ops/events' ? <OperationsEvents /> : route === '/ops/system' ? <OperationsSystem connectionState={connectionState} onReset={resetProjection} /> : null}
    </section>
  </main>;
}

function Overview({ connection, error, snapshot }: { connection: 'connecting' | 'sse' | 'polling' | 'offline'; error: string | null; snapshot: ReturnType<typeof useOfficeBackend>['snapshot'] }) {
  const peopleOnline = snapshot.scenario.people.filter((person) => person.availability === 'Online').length;
  const today = { prd: 0, feature: 0, report: 0 };
  const handoff = { delivering: 0, awaiting: 0, collecting: 0, active: 0 };
  const todayIds = new Set(snapshot.scenario.workspaces.flatMap((workspace) => workspace.todayOutput.flatMap((output) => output.artifactIds)));
  for (const artifact of snapshot.scenario.artifacts) {
    if (todayIds.has(artifact.id)) today[artifact.category] += 1;
    if (artifact.status === 'Delivering') handoff.delivering += 1;
    else if (artifact.status === 'Available') handoff.awaiting += 1;
    else if (artifact.status === 'Collecting') handoff.collecting += 1;
  }
  for (const person of snapshot.scenario.people) handoff.active += person.activeWorks.length;
  return <>
    <p className="operations-intro">Current read model derived from the shared office projection.</p>
    <section className="operations-overview-grid" aria-label="Organization Snapshot"><div><strong>People Online</strong><span>{peopleOnline} / {snapshot.scenario.people.length}</span></div><div><strong>PRDs Submitted Today</strong><span>{today.prd}</span></div><div><strong>Features Submitted Today</strong><span>{today.feature}</span></div><div><strong>Test Reports Submitted Today</strong><span>{today.report}</span></div></section>
    <section className="operations-overview-grid" aria-label="Handoff Status"><div><strong>Delivering</strong><span>{handoff.delivering}</span></div><div><strong>Awaiting Acceptance</strong><span>{handoff.awaiting}</span></div><div><strong>Collecting</strong><span>{handoff.collecting}</span></div><div><strong>Active Work</strong><span>{handoff.active}</span></div></section>
    <section className="operations-placeholder" aria-label="Recent Business Activity"><strong>Recent Business Activity</strong>{snapshot.scenario.handoffs.length ? <ul>{snapshot.scenario.handoffs.slice(0, 5).map((handoff) => <li key={`${handoff.time}-${handoff.summary}`}><time>{handoff.time}</time> {handoff.summary}</li>)}</ul> : <p>No recent business activity.</p>}</section>
    {error ? <section className="operations-placeholder" aria-label="System Summary error"><p role="alert">System status is partially unavailable: {error}</p><a href="/ops/system">Open system details</a></section> : null}
    <section className="operations-placeholder" aria-label="System Summary"><strong>System Summary</strong><p>Gateway: Up · Ledger: Writable · Projection: Ready · Connection: {connectionLabel(connection)}</p></section>
  </>;
}
