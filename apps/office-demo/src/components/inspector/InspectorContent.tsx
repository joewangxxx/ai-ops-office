import { useState } from 'react';
import { FeatureEvidencePanel, PrdEvidencePanel, TestReportEvidencePanel } from './ArtifactEvidencePanels';
import {
  getArtifactScenario,
  getArtifactsByIds,
  getPersonScenario,
  getWorkspaceScenario,
  type ArtifactCategory,
  type DemoScenario,
  type HubArtifactCount,
} from '../../data/demoScenario';
import { officeLayout } from '../../data/officeLayout';
import type { OfficeNotification } from '../../backend/officeDomain';
import type { Selection } from '../../types/selection';

type InspectorContentProps = {
  selection: Selection;
  onSelectionChange: (selection: Selection) => void;
  scenario: DemoScenario;
  hubCounts: readonly HubArtifactCount[];
  notifications?: readonly OfficeNotification[];
  onAccept?: (artifactId: string, assigneeDeskId: string) => Promise<void> | void;
  pendingArtifactIds?: ReadonlySet<string>;
};

function ArtifactList({ artifactIds, onSelectionChange, scenario }: { artifactIds: readonly string[]; onSelectionChange: (selection: Selection) => void; scenario: DemoScenario }) {
  return <ul className="inspector-artifact-list">{getArtifactsByIds(artifactIds, scenario).map((artifact) => <li key={artifact.id}><button onClick={() => onSelectionChange({ kind: 'artifact', artifactId: artifact.id })} type="button">{artifact.title}</button></li>)}</ul>;
}

function HandoffList({ scenario }: { scenario: DemoScenario }) {
  return <ul className="inspector-handoff-list">{scenario.handoffs.slice(0, 3).map((handoff) => <li data-testid="handoff-row" key={`${handoff.time}-${handoff.summary}`}><time>{handoff.time}</time><span>{handoff.summary}</span></li>)}</ul>;
}

function LatestHandoffDisclosure({ scenario }: { scenario: DemoScenario }) {
  const [isOpen, setIsOpen] = useState(true);
  return <section className="inspector-section"><button aria-expanded={isOpen} className="inspector-section__disclosure" onClick={() => setIsOpen((open) => !open)} type="button">Latest Handoff</button>{isOpen ? <HandoffList scenario={scenario} /> : null}</section>;
}

function OfficeSummary({ onSelectionChange, scenario }: Pick<InspectorContentProps, 'onSelectionChange' | 'scenario'>) {
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [openMetric, setOpenMetric] = useState<string | null>(null);
  const online = scenario.workspaces.reduce((sum, workspace) => sum + workspace.online, 0);
  const total = scenario.workspaces.reduce((sum, workspace) => sum + workspace.total, 0);
  const output = scenario.workspaces.flatMap((workspace) => workspace.todayOutput);

  return <>
    <h2>Office Summary</h2>
    <section className="inspector-section">
      <button aria-expanded={peopleOpen} className="inspector-section__disclosure" onClick={() => setPeopleOpen((open) => !open)} type="button">People Online</button>
      <p className="inspector-stat inspector-stat--primary">{online} / {total}</p>
       {peopleOpen ? <ul className="inspector-aggregate-list">{scenario.workspaces.map((workspace) => <li key={workspace.workspaceId}><span>{workspace.onlineLabel}</span><strong>{workspace.online} / {workspace.total}</strong></li>)}</ul> : null}
    </section>
    <section className="inspector-section">
      <h3>Today</h3>
      <div className="inspector-metric-list">{output.map((metric) => {
        const isMetricOpen = openMetric === metric.label;
        return <div className="inspector-metric" key={metric.label}><button aria-expanded={isMetricOpen} aria-label={metric.label} onClick={() => setOpenMetric(isMetricOpen ? null : metric.label)} type="button">{metric.label}<strong>{metric.artifactIds.length}</strong></button>{isMetricOpen ? <ArtifactList artifactIds={metric.artifactIds} onSelectionChange={onSelectionChange} scenario={scenario} /> : null}</div>;
      })}</div>
    </section>
    <LatestHandoffDisclosure scenario={scenario} />
  </>;
}

function WorkspaceOverview({ workspaceId, onSelectionChange, scenario }: { workspaceId: string; onSelectionChange: (selection: Selection) => void; scenario: DemoScenario }) {
  const workspace = officeLayout.workspaces.find((item) => item.id === workspaceId);
  const workspaceScenario = getWorkspaceScenario(workspaceId, scenario);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [openMetric, setOpenMetric] = useState<string | null>(null);
  if (!workspace || !workspaceScenario) return <OfficeSummary onSelectionChange={onSelectionChange} scenario={scenario} />;
  const workspaceDesks = officeLayout.desks.filter((desk) => desk.workspaceId === workspaceId);
  const teamLabel = workspaceScenario.onlineLabel.replace(' Online', '');
  return <>
    <h2>{workspace.name} Overview</h2>
    <section className="inspector-section">
      <button aria-expanded={peopleOpen} aria-label={`${teamLabel} ${workspaceScenario.online} / ${workspaceScenario.total}`} className="inspector-section__disclosure" onClick={() => setPeopleOpen((open) => !open)} type="button">
        <span>{teamLabel}</span><strong>{workspaceScenario.online} / {workspaceScenario.total}</strong>
      </button>
      {peopleOpen ? <ul className="inspector-people-list">{workspaceDesks.map((desk) => <li key={desk.id}>{`${desk.occupant.displayName} ${desk.online ? 'Online' : 'Offline'}`}</li>)}</ul> : null}
    </section>
    <section className="inspector-section"><h3>Today Output</h3><div className="inspector-metric-list">{workspaceScenario.todayOutput.map((metric) => {
      const isOpen = openMetric === metric.label;
      return <div className="inspector-metric" key={metric.label}><button aria-expanded={isOpen} aria-label={`${metric.label} ${metric.artifactIds.length}`} onClick={() => setOpenMetric(isOpen ? null : metric.label)} type="button">{metric.label}<strong>{metric.artifactIds.length}</strong></button>{isOpen ? <ArtifactList artifactIds={metric.artifactIds} onSelectionChange={onSelectionChange} scenario={scenario} /> : null}</div>;
    })}</div></section>
    {workspaceScenario.blockers > 0 ? <section className="inspector-section"><h3>Blockers</h3><p className="inspector-stat">{workspaceScenario.blockers}</p></section> : null}
  </>;
}

function AvatarDetail({ deskId, notifications, onAccept, pendingArtifactIds, onSelectionChange, scenario }: {
  deskId: string;
  notifications: readonly OfficeNotification[];
  onAccept?: (artifactId: string, assigneeDeskId: string) => Promise<void> | void;
  pendingArtifactIds: ReadonlySet<string>;
  onSelectionChange: (selection: Selection) => void;
  scenario: DemoScenario;
}) {
  const desk = officeLayout.desks.find((item) => item.id === deskId);
  const person = getPersonScenario(deskId, scenario);
  if (!desk || !person) return null;
  const assigned = notifications.filter((notification) => notification.assigneeDeskId === deskId && notification.status !== 'completed');
  return <><h2>{desk.occupant.displayName}</h2><dl className="inspector-detail-list"><div><dt>Role</dt><dd>{person.role}</dd></div><div><dt>Agent</dt><dd>{person.agent}</dd></div></dl><section className="inspector-section"><h3>Active Work</h3><ul className="inspector-artifact-list">{person.activeWorks.map((work) => <li key={work.id}>{work.sourceArtifactId ? <button onClick={() => onSelectionChange({ kind: 'artifact', artifactId: work.sourceArtifactId! })} type="button">{work.title}</button> : <span>{work.title}</span>}<small>{work.status === 'waiting_human' ? 'Waiting for human' : 'Active'}</small></li>)}</ul></section>{assigned.map((notification) => {
    const artifact = getArtifactScenario(notification.artifactId, scenario);
    if (!artifact) return null;
    return <section className="inspector-section" data-testid={`assignment-${notification.artifactId}`} key={notification.id}><h3>Assigned Artifact</h3><p>{notification.message}</p><button aria-label={`Accept ${artifact.title}`} disabled={!notification.canAccept || pendingArtifactIds.has(artifact.id)} onClick={() => { void Promise.resolve(onAccept?.(artifact.id, deskId)).catch(() => undefined); }} type="button">Accept</button></section>;
  })}</>;
}

function OfflineDeskDetail({ deskId, scenario }: { deskId: string; scenario: DemoScenario }) {
  const desk = officeLayout.desks.find((item) => item.id === deskId);
  const person = getPersonScenario(deskId, scenario);
  if (!desk || !person) return null;
  return <><h2>{desk.occupant.displayName}</h2><dl className="inspector-detail-list"><div><dt>Role</dt><dd>{person.role}</dd></div><div><dt>Availability</dt><dd>{person.availability}</dd></div><div><dt>Agent</dt><dd>{person.agent}</dd></div></dl></>;
}

function ArtifactHubOverview({ hubCounts, onSelectionChange, scenario }: Pick<InspectorContentProps, 'hubCounts' | 'onSelectionChange' | 'scenario'>) {
  const [openCategory, setOpenCategory] = useState<ArtifactCategory | null>(null);
  return <><h2>Artifact Hub</h2><section className="inspector-section"><h3>Stored Artifacts Today</h3><div className="inspector-metric-list">{hubCounts.map((item) => {
    const isOpen = openCategory === item.category;
    const artifactIds = scenario.hubArtifactIds[item.category];
    return <div className="inspector-metric" key={item.category}><button aria-expanded={isOpen} onClick={() => setOpenCategory(isOpen ? null : item.category)} type="button">{item.label}<strong>{item.count}</strong></button>{isOpen ? <ArtifactList artifactIds={artifactIds} onSelectionChange={onSelectionChange} scenario={scenario} /> : null}</div>;
  })}</div></section><LatestHandoffDisclosure scenario={scenario} /></>;
}

function ArtifactDetail({ artifactId, scenario }: { artifactId: string; scenario: DemoScenario }) {
  const artifact = getArtifactScenario(artifactId, scenario);
  if (!artifact) return null;
  return <><h2>{artifact.title}</h2><dl className="inspector-detail-list"><div><dt>Status</dt><dd>{artifact.status}</dd></div><div><dt>Submitted By</dt><dd>{artifact.submittedBy}</dd></div><div><dt>Confirmed By</dt><dd>{artifact.confirmedBy}</dd></div><div><dt>Accepted By</dt><dd>{artifact.acceptedBy}</dd></div></dl>{artifact.evidence.kind === 'prd' ? <PrdEvidencePanel evidence={artifact.evidence} /> : artifact.evidence.kind === 'feature' ? <FeatureEvidencePanel evidence={artifact.evidence} /> : <TestReportEvidencePanel evidence={artifact.evidence} />}</>;
}

export function InspectorContent({ hubCounts, notifications = [], onAccept, onSelectionChange, pendingArtifactIds = new Set(), scenario, selection }: InspectorContentProps) {
  if (selection.kind === 'workspace') return <WorkspaceOverview onSelectionChange={onSelectionChange} scenario={scenario} workspaceId={selection.workspaceId} />;
  if (selection.kind === 'avatar') return <AvatarDetail deskId={selection.deskId} notifications={notifications} onAccept={onAccept} onSelectionChange={onSelectionChange} pendingArtifactIds={pendingArtifactIds} scenario={scenario} />;
  if (selection.kind === 'offlineDesk') return <OfflineDeskDetail deskId={selection.deskId} scenario={scenario} />;
  if (selection.kind === 'hub') return <ArtifactHubOverview hubCounts={hubCounts} onSelectionChange={onSelectionChange} scenario={scenario} />;
  if (selection.kind === 'artifact') return <ArtifactDetail artifactId={selection.artifactId} scenario={scenario} />;
  return <OfficeSummary onSelectionChange={onSelectionChange} scenario={scenario} />;
}
