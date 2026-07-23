import type { FeatureEvidence, PrdEvidence, TestReportEvidence } from '../../domain/artifactEvidence';
import type { ReactNode } from 'react';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt>{label}</dt><dd>{children}</dd></div>;
}

function List({ values }: { values: readonly string[] }) {
  return <ul className="artifact-evidence__list">{values.map((value, index) => <li key={`${index}-${value}`}>{value}</li>)}</ul>;
}

export function PrdEvidencePanel({ evidence }: { evidence: PrdEvidence }) {
  return <section className="inspector-section artifact-evidence"><h3>PRD Evidence</h3><dl className="inspector-detail-list">
    <Detail label="Summary">{evidence.summary}</Detail>
    <Detail label="Priority">{evidence.priority}</Detail>
    <Detail label="Scope"><List values={evidence.scope} /></Detail>
    <Detail label="User Stories"><ul className="artifact-evidence__list">{evidence.userStories.map((story) => <li key={story.id}><strong>{story.id}</strong> {story.statement}</li>)}</ul></Detail>
    <Detail label="Acceptance Criteria"><List values={evidence.acceptanceCriteria} /></Detail>
  </dl></section>;
}

function safePreviewUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch { return undefined; }
}

export function FeatureEvidencePanel({ evidence }: { evidence: FeatureEvidence }) {
  const previewUrl = safePreviewUrl(evidence.previewUrl);
  return <section className="inspector-section artifact-evidence"><h3>Feature Evidence</h3><dl className="inspector-detail-list">
    <Detail label="Summary">{evidence.summary}</Detail>
    <Detail label="Build"><span className={`artifact-evidence__status artifact-evidence__status--${evidence.build.status}`}>{evidence.build.status}</span>{evidence.build.reference ? ` · ${evidence.build.reference}` : ''}</Detail>
    <Detail label="Commits"><ul className="artifact-evidence__list">{evidence.commits.map((commit) => <li key={`${commit.sha}-${commit.message}`}><code>{commit.sha}</code> {commit.message}</li>)}</ul></Detail>
    <Detail label="Changed Files">{evidence.changedFiles}</Detail>
    {previewUrl ? <Detail label="Preview"><a href={previewUrl} rel="noopener noreferrer" target="_blank">Open preview</a></Detail> : null}
    {evidence.apiContracts.length > 0 ? <Detail label="API Contracts"><List values={evidence.apiContracts} /></Detail> : null}
  </dl></section>;
}

export function TestReportEvidencePanel({ evidence }: { evidence: TestReportEvidence }) {
  return <section className="inspector-section artifact-evidence"><h3>Test Report Evidence</h3><dl className="inspector-detail-list">
    <Detail label="Summary">{evidence.summary}</Detail>
    <Detail label="Result">{evidence.result}</Detail>
    <Detail label="Test Cases">{evidence.testCases.passed} / {evidence.testCases.total} passed{evidence.testCases.failed > 0 ? ` · ${evidence.testCases.failed} failed` : ''}</Detail>
    {evidence.coverage !== undefined ? <Detail label="Coverage">{evidence.coverage}%</Detail> : null}
    <Detail label="Regression">{evidence.regression}</Detail>
    {evidence.bugs.length > 0 ? <Detail label="Bugs"><ul className="artifact-evidence__list">{evidence.bugs.map((bug) => <li key={bug.id}><strong>{bug.id}</strong> {bug.title} · {bug.severity} · {bug.status}</li>)}</ul></Detail> : null}
  </dl></section>;
}
