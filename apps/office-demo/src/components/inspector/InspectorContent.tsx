import { useState } from 'react';
import {
  demoScenario,
  getArtifactScenario,
  getArtifactsByIds,
  getPersonScenario,
  getWorkspaceScenario,
  hubArtifactCounts,
  type ArtifactCategory,
} from '../../data/demoScenario';
import { officeLayout } from '../../data/officeLayout';
import type { Selection } from '../../types/selection';

type InspectorContentProps = {
  selection: Selection;
  onSelectionChange: (selection: Selection) => void;
};

function ArtifactList({ artifactIds, onSelectionChange }: { artifactIds: readonly string[]; onSelectionChange: (selection: Selection) => void }) {
  return <ul className="inspector-artifact-list">{getArtifactsByIds(artifactIds).map((artifact) => <li key={artifact.id}><button onClick={() => onSelectionChange({ kind: 'artifact', artifactId: artifact.id })} type="button">{artifact.title}</button></li>)}</ul>;
}

function HandoffList() {
  return <ul className="inspector-handoff-list">{demoScenario.handoffs.map((handoff) => <li data-testid="handoff-row" key={`${handoff.time}-${handoff.summary}`}><time>{handoff.time}</time><span>{handoff.summary}</span></li>)}</ul>;
}

function LatestHandoffDisclosure() {
  const [isOpen, setIsOpen] = useState(true);
  return <section className="inspector-section"><button aria-expanded={isOpen} className="inspector-section__disclosure" onClick={() => setIsOpen((open) => !open)} type="button">Latest Handoff</button>{isOpen ? <HandoffList /> : null}</section>;
}

function OfficeSummary({ onSelectionChange }: Omit<InspectorContentProps, 'selection'>) {
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [openMetric, setOpenMetric] = useState<string | null>(null);
  const online = demoScenario.workspaces.reduce((sum, workspace) => sum + workspace.online, 0);
  const total = demoScenario.workspaces.reduce((sum, workspace) => sum + workspace.total, 0);
  const output = demoScenario.workspaces.flatMap((workspace) => workspace.todayOutput);

  return <>
    <h2>Office Summary</h2>
    <section className="inspector-section">
      <button aria-expanded={peopleOpen} className="inspector-section__disclosure" onClick={() => setPeopleOpen((open) => !open)} type="button">People Online</button>
      <p className="inspector-stat inspector-stat--primary">{online} / {total}</p>
      {peopleOpen ? <ul className="inspector-aggregate-list">{demoScenario.workspaces.map((workspace) => <li key={workspace.workspaceId}><span>{workspace.onlineLabel}</span><strong>{workspace.online} / {workspace.total}</strong></li>)}</ul> : null}
    </section>
    <section className="inspector-section">
      <button aria-expanded="true" className="inspector-section__disclosure" type="button">Today</button>
      <div className="inspector-metric-list">{output.map((metric) => {
        const isMetricOpen = openMetric === metric.label;
        return <div className="inspector-metric" key={metric.label}><button aria-expanded={isMetricOpen} aria-label={metric.label} onClick={() => setOpenMetric(isMetricOpen ? null : metric.label)} type="button">{metric.label}<strong>{metric.artifactIds.length}</strong></button>{isMetricOpen ? <ArtifactList artifactIds={metric.artifactIds} onSelectionChange={onSelectionChange} /> : null}</div>;
      })}</div>
    </section>
    <LatestHandoffDisclosure />
  </>;
}

function WorkspaceOverview({ workspaceId, onSelectionChange }: { workspaceId: string; onSelectionChange: (selection: Selection) => void }) {
  const workspace = officeLayout.workspaces.find((item) => item.id === workspaceId);
  const scenario = getWorkspaceScenario(workspaceId);
  if (!workspace || !scenario) return <OfficeSummary onSelectionChange={onSelectionChange} />;
  return <>
    <h2>{workspace.name} Overview</h2>
    <section className="inspector-section"><p className="inspector-online-line">{`${scenario.onlineLabel} ${scenario.online} / ${scenario.total}`}</p></section>
    <section className="inspector-section"><h3>Today Output</h3>{scenario.todayOutput.map((metric) => <div className="inspector-metric" key={metric.label}><span>{metric.label}</span><ArtifactList artifactIds={metric.artifactIds} onSelectionChange={onSelectionChange} /></div>)}</section>
    <section className="inspector-section"><h3>Current Queue</h3><dl className="inspector-detail-list"><div><dt>Inbox</dt><dd>{scenario.queue.inbox}</dd></div><div><dt>In Progress</dt><dd>{scenario.queue.inProgress}</dd></div><div><dt>Outbox</dt><dd>{scenario.queue.outbox}</dd></div></dl></section>
    {scenario.blockers > 0 ? <section className="inspector-section"><h3>Blockers</h3><p className="inspector-stat">{scenario.blockers}</p></section> : null}
  </>;
}

function AvatarDetail({ deskId }: { deskId: string }) {
  const desk = officeLayout.desks.find((item) => item.id === deskId);
  const person = getPersonScenario(deskId);
  if (!desk || !person) return null;
  return <><h2>{desk.occupant.displayName}</h2><dl className="inspector-detail-list"><div><dt>Role</dt><dd>{person.role}</dd></div><div><dt>Agent</dt><dd>{person.agent}</dd></div>{person.currentTask ? <div><dt>Current Task</dt><dd>{person.currentTask}</dd></div> : null}{person.inputArtifact ? <div><dt>Input Artifact</dt><dd>{person.inputArtifact}</dd></div> : null}</dl></>;
}

function OfflineDeskDetail({ deskId }: { deskId: string }) {
  const desk = officeLayout.desks.find((item) => item.id === deskId);
  const person = getPersonScenario(deskId);
  if (!desk || !person) return null;
  return <><h2>{desk.occupant.displayName}</h2><dl className="inspector-detail-list"><div><dt>Role</dt><dd>{person.role}</dd></div><div><dt>Availability</dt><dd>Offline</dd></div><div><dt>Agent</dt><dd>Not active</dd></div></dl></>;
}

function ArtifactHubOverview({ onSelectionChange }: Omit<InspectorContentProps, 'selection'>) {
  const [openCategory, setOpenCategory] = useState<ArtifactCategory | null>(null);
  return <><h2>Artifact Hub</h2><section className="inspector-section"><h3>Stored Artifacts Today</h3><div className="inspector-metric-list">{hubArtifactCounts.map((item) => {
    const isOpen = openCategory === item.category;
    const artifactIds = demoScenario.artifacts.filter((artifact) => artifact.category === item.category).map((artifact) => artifact.id);
    return <div className="inspector-metric" key={item.category}><button aria-expanded={isOpen} onClick={() => setOpenCategory(isOpen ? null : item.category)} type="button">{item.label}<strong>{item.count}</strong></button>{isOpen ? <ArtifactList artifactIds={artifactIds} onSelectionChange={onSelectionChange} /> : null}</div>;
  })}</div></section><LatestHandoffDisclosure /></>;
}

function ArtifactDetail({ artifactId }: { artifactId: string }) {
  const artifact = getArtifactScenario(artifactId);
  if (!artifact) return null;
  return <><h2>{artifact.title}</h2><dl className="inspector-detail-list"><div><dt>Status</dt><dd>{artifact.status}</dd></div><div><dt>Submitted By</dt><dd>{artifact.submittedBy}</dd></div><div><dt>Confirmed By</dt><dd>{artifact.confirmedBy}</dd></div><div><dt>Accepted By</dt><dd>{artifact.acceptedBy}</dd></div></dl></>;
}

export function getInspectorTitle(selection: Selection) {
  if (selection.kind === 'office') return 'Office Summary';
  if (selection.kind === 'workspace') return `${officeLayout.workspaces.find((workspace) => workspace.id === selection.workspaceId)?.name ?? 'Workspace'} Overview`;
  if (selection.kind === 'avatar' || selection.kind === 'offlineDesk') return officeLayout.desks.find((desk) => desk.id === selection.deskId)?.occupant.displayName ?? 'Desk';
  if (selection.kind === 'hub') return 'Artifact Hub';
  return getArtifactScenario(selection.artifactId)?.title ?? 'Artifact';
}

export function InspectorContent({ selection, onSelectionChange }: InspectorContentProps) {
  if (selection.kind === 'workspace') return <WorkspaceOverview onSelectionChange={onSelectionChange} workspaceId={selection.workspaceId} />;
  if (selection.kind === 'avatar') return <AvatarDetail deskId={selection.deskId} />;
  if (selection.kind === 'offlineDesk') return <OfflineDeskDetail deskId={selection.deskId} />;
  if (selection.kind === 'hub') return <ArtifactHubOverview onSelectionChange={onSelectionChange} />;
  if (selection.kind === 'artifact') return <ArtifactDetail artifactId={selection.artifactId} />;
  return <OfficeSummary onSelectionChange={onSelectionChange} />;
}
