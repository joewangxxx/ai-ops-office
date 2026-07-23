import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  createArtifactSubmittedEvent,
  createBusinessEventMetadata,
  type ArtifactSubmittedEvent,
  type BusinessEventMetadata,
} from '../../backend/businessEvents';
import type { ArtifactCategory, DemoScenario } from '../../data/demoScenario';
import { officeLayout } from '../../data/officeLayout';
import { parseArtifactEvidence, type ArtifactEvidence, type TestReportEvidence } from '../../domain/artifactEvidence';
import { getArtifactRoute } from '../../domain/artifactRouting';
import { createArtifactId, createArtifactSuffix } from '../../utils/artifactEventDraft';

type EventConsoleProps = {
  scenario: DemoScenario;
  onSubmit: (event: ArtifactSubmittedEvent) => Promise<unknown>;
  onReset: () => Promise<unknown>;
  suffixFactory?: () => string;
  metadataFactory?: () => BusinessEventMetadata;
};

type BugDraft = TestReportEvidence['bugs'][number];
type EvidenceDraft =
  | { kind: 'prd'; summary: string; priority: 'P0' | 'P1' | 'P2' | 'P3'; scope: string; userStories: string; acceptanceCriteria: string }
  | { kind: 'feature'; summary: string; commitSha: string; commitMessage: string; changedFiles: string; buildStatus: 'pending' | 'passed' | 'failed'; buildReference: string; previewUrl: string; apiContracts: string }
  | { kind: 'report'; summary: string; result: 'passed' | 'failed' | 'blocked'; total: string; passed: string; failed: string; coverage: string; regression: 'passed' | 'failed' | 'not_run'; bugs: BugDraft[] };

const CATEGORY_OPTIONS: Array<{ value: ArtifactCategory; label: string }> = [
  { value: 'prd', label: 'PRD' },
  { value: 'feature', label: 'Feature' },
  { value: 'report', label: 'Test Report' },
];

const lines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);

function createEvidenceDraft(category: ArtifactCategory): EvidenceDraft {
  if (category === 'prd') return { kind: 'prd', summary: '', priority: 'P1', scope: '', userStories: '', acceptanceCriteria: '' };
  if (category === 'feature') return { kind: 'feature', summary: '', commitSha: '', commitMessage: '', changedFiles: '0', buildStatus: 'pending', buildReference: '', previewUrl: '', apiContracts: '' };
  return { kind: 'report', summary: '', result: 'passed', total: '0', passed: '0', failed: '0', coverage: '', regression: 'not_run', bugs: [] };
}

function evidenceCandidate(draft: EvidenceDraft): ArtifactEvidence {
  if (draft.kind === 'prd') return {
    kind: 'prd', summary: draft.summary, priority: draft.priority, scope: lines(draft.scope),
    userStories: lines(draft.userStories).map((statement, index) => ({ id: `US-${index + 1}`, statement })),
    acceptanceCriteria: lines(draft.acceptanceCriteria),
  };
  if (draft.kind === 'feature') return {
    kind: 'feature', summary: draft.summary, commits: [{ sha: draft.commitSha, message: draft.commitMessage }],
    changedFiles: Number(draft.changedFiles), build: { status: draft.buildStatus, ...(draft.buildReference.trim() ? { reference: draft.buildReference } : {}) },
    ...(draft.previewUrl.trim() ? { previewUrl: draft.previewUrl } : {}), apiContracts: lines(draft.apiContracts),
  };
  return {
    kind: 'report', summary: draft.summary, result: draft.result,
    testCases: { total: Number(draft.total), passed: Number(draft.passed), failed: Number(draft.failed) },
    ...(draft.coverage.trim() ? { coverage: Number(draft.coverage) } : {}), regression: draft.regression, bugs: draft.bugs,
  };
}

function getOnlineDesks(workspaceId: string, scenario: DemoScenario) {
  return officeLayout.desks.filter((desk) => {
    if (desk.workspaceId !== workspaceId || !desk.online || !desk.occupant.avatarKey) return false;
    return scenario.people.find((person) => person.deskId === desk.id)?.availability === 'Online';
  });
}

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Office API is unavailable';
}

export function EventConsole({ scenario, onSubmit, onReset, suffixFactory = createArtifactSuffix, metadataFactory = createBusinessEventMetadata }: EventConsoleProps) {
  const initialRoute = getArtifactRoute('prd');
  const [category, setCategory] = useState<ArtifactCategory>('prd');
  const [title, setTitle] = useState('');
  const [evidenceDraft, setEvidenceDraft] = useState<EvidenceDraft>(() => createEvidenceDraft('prd'));
  const [producerDeskId, setProducerDeskId] = useState(() => getOnlineDesks(initialRoute.producerWorkspaceId, scenario)[0]?.id ?? '');
  const [assigneeDeskId, setAssigneeDeskId] = useState(() => getOnlineDesks(initialRoute.assigneeWorkspaceId, scenario)[0]?.id ?? '');
  const [draftSuffix, setDraftSuffix] = useState(() => suffixFactory());
  const [eventMetadata, setEventMetadata] = useState(() => metadataFactory());
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const route = getArtifactRoute(category);
  const producerOptions = useMemo(() => getOnlineDesks(route.producerWorkspaceId, scenario), [route.producerWorkspaceId, scenario]);
  const assigneeOptions = useMemo(() => getOnlineDesks(route.assigneeWorkspaceId, scenario), [route.assigneeWorkspaceId, scenario]);
  const artifactId = createArtifactId(category, title, draftSuffix);
  const evidence = evidenceCandidate(evidenceDraft);
  const event = createArtifactSubmittedEvent({ artifact: { id: artifactId, category, title, evidence }, producerDeskId, assigneeDeskId }, { system: 'event-console', actorId: producerDeskId }, eventMetadata);
  let validEvidence = false;
  try { parseArtifactEvidence(category, evidence); validEvidence = true; } catch { validEvidence = false; }
  const canSubmit = Boolean(title.trim() && artifactId && producerDeskId && assigneeDeskId && validEvidence) && !submitting && !resetting;

  const clearMessages = () => { setValidationError(null); setRequestError(null); setSuccess(null); };
  const updateDraft = (patch: Partial<EvidenceDraft>) => { setEvidenceDraft((current) => ({ ...current, ...patch } as EvidenceDraft)); clearMessages(); };

  const selectCategory = (nextCategory: ArtifactCategory) => {
    const nextRoute = getArtifactRoute(nextCategory);
    setCategory(nextCategory);
    setEvidenceDraft(createEvidenceDraft(nextCategory));
    setProducerDeskId(getOnlineDesks(nextRoute.producerWorkspaceId, scenario)[0]?.id ?? '');
    setAssigneeDeskId(getOnlineDesks(nextRoute.assigneeWorkspaceId, scenario)[0]?.id ?? '');
    clearMessages();
  };

  const submit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    if (submittingRef.current) return;
    if (!title.trim()) { setValidationError('Artifact title is required.'); return; }
    try { parseArtifactEvidence(category, evidence); } catch (reason) { setValidationError(errorMessage(reason)); return; }
    if (!canSubmit) return;
    submittingRef.current = true;
    setSubmitting(true);
    clearMessages();
    try {
      await onSubmit(event);
      setSuccess(`Business event received: ${title}`);
      setTitle('');
      setEvidenceDraft(createEvidenceDraft(category));
      setDraftSuffix(suffixFactory());
      setEventMetadata(metadataFactory());
    } catch (reason) {
      setRequestError(errorMessage(reason));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const reset = async () => {
    if (resetting) return;
    setResetting(true);
    setRequestError(null);
    try {
      await onReset();
      setSuccess(null); setValidationError(null); setConfirmingReset(false);
      setDraftSuffix(suffixFactory()); setEventMetadata(metadataFactory());
    } catch (reason) { setRequestError(errorMessage(reason)); }
    finally { setResetting(false); }
  };

  const disabled = submitting || resetting;
  return <div className="event-console">
    <h2>Event Console</h2>
    <p className="event-console__intro">Submit a standardized business event to the live office projection.</p>
    <form className="event-console__form" onSubmit={(formEvent) => { void submit(formEvent); }}>
      <label>Artifact Category<select aria-label="Artifact Category" disabled={disabled} onChange={(change) => selectCategory(change.target.value as ArtifactCategory)} value={category}>{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label>Artifact Title<input aria-label="Artifact Title" disabled={disabled} onBlur={() => { if (!title.trim()) setValidationError('Artifact title is required.'); }} onChange={(change) => { setTitle(change.target.value); clearMessages(); }} placeholder="e.g. Login Requirement PRD v2.0" value={title} /></label>
      <label>Evidence Summary<textarea aria-label="Evidence Summary" disabled={disabled} onChange={(change) => updateDraft({ summary: change.target.value })} value={evidenceDraft.summary} /></label>
      {evidenceDraft.kind === 'prd' ? <>
        <label>Priority<select aria-label="Priority" disabled={disabled} onChange={(change) => updateDraft({ priority: change.target.value as typeof evidenceDraft.priority })} value={evidenceDraft.priority}>{['P0', 'P1', 'P2', 'P3'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Scope<textarea aria-label="Scope" disabled={disabled} onChange={(change) => updateDraft({ scope: change.target.value })} placeholder="One scope item per line" value={evidenceDraft.scope} /></label>
        <label>User Stories<textarea aria-label="User Stories" disabled={disabled} onChange={(change) => updateDraft({ userStories: change.target.value })} placeholder="One story per line" value={evidenceDraft.userStories} /></label>
        <label>Acceptance Criteria<textarea aria-label="Acceptance Criteria" disabled={disabled} onChange={(change) => updateDraft({ acceptanceCriteria: change.target.value })} placeholder="One criterion per line" value={evidenceDraft.acceptanceCriteria} /></label>
      </> : null}
      {evidenceDraft.kind === 'feature' ? <>
        <label>Commit SHA<input aria-label="Commit SHA" disabled={disabled} onChange={(change) => updateDraft({ commitSha: change.target.value })} value={evidenceDraft.commitSha} /></label>
        <label>Commit Message<input aria-label="Commit Message" disabled={disabled} onChange={(change) => updateDraft({ commitMessage: change.target.value })} value={evidenceDraft.commitMessage} /></label>
        <label>Changed Files<input aria-label="Changed Files" disabled={disabled} min="0" onChange={(change) => updateDraft({ changedFiles: change.target.value })} type="number" value={evidenceDraft.changedFiles} /></label>
        <label>Build Status<select aria-label="Build Status" disabled={disabled} onChange={(change) => updateDraft({ buildStatus: change.target.value as typeof evidenceDraft.buildStatus })} value={evidenceDraft.buildStatus}>{['pending', 'passed', 'failed'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Build Reference<input aria-label="Build Reference" disabled={disabled} onChange={(change) => updateDraft({ buildReference: change.target.value })} value={evidenceDraft.buildReference} /></label>
        <label>Preview URL<input aria-label="Preview URL" disabled={disabled} onChange={(change) => updateDraft({ previewUrl: change.target.value })} type="url" value={evidenceDraft.previewUrl} /></label>
        <label>API Contracts<textarea aria-label="API Contracts" disabled={disabled} onChange={(change) => updateDraft({ apiContracts: change.target.value })} placeholder="One contract per line" value={evidenceDraft.apiContracts} /></label>
      </> : null}
      {evidenceDraft.kind === 'report' ? <>
        <label>Result<select aria-label="Result" disabled={disabled} onChange={(change) => updateDraft({ result: change.target.value as typeof evidenceDraft.result })} value={evidenceDraft.result}>{['passed', 'failed', 'blocked'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Total Tests<input aria-label="Total Tests" disabled={disabled} min="0" onChange={(change) => updateDraft({ total: change.target.value })} type="number" value={evidenceDraft.total} /></label>
        <label>Passed Tests<input aria-label="Passed Tests" disabled={disabled} min="0" onChange={(change) => updateDraft({ passed: change.target.value })} type="number" value={evidenceDraft.passed} /></label>
        <label>Failed Tests<input aria-label="Failed Tests" disabled={disabled} min="0" onChange={(change) => updateDraft({ failed: change.target.value })} type="number" value={evidenceDraft.failed} /></label>
        <label>Coverage<input aria-label="Coverage" disabled={disabled} max="100" min="0" onChange={(change) => updateDraft({ coverage: change.target.value })} type="number" value={evidenceDraft.coverage} /></label>
        <label>Regression<select aria-label="Regression" disabled={disabled} onChange={(change) => updateDraft({ regression: change.target.value as typeof evidenceDraft.regression })} value={evidenceDraft.regression}>{['passed', 'failed', 'not_run'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <fieldset className="event-console__bugs"><legend>Bugs</legend>{evidenceDraft.bugs.map((bug, index) => <div className="event-console__bug-row" key={`${index}-${bug.id}`}>
          <input aria-label={`Bug ${index + 1} ID`} onChange={(change) => updateDraft({ bugs: evidenceDraft.bugs.map((item, itemIndex) => itemIndex === index ? { ...item, id: change.target.value } : item) })} value={bug.id} />
          <input aria-label={`Bug ${index + 1} Title`} onChange={(change) => updateDraft({ bugs: evidenceDraft.bugs.map((item, itemIndex) => itemIndex === index ? { ...item, title: change.target.value } : item) })} value={bug.title} />
          <select aria-label={`Bug ${index + 1} Severity`} onChange={(change) => updateDraft({ bugs: evidenceDraft.bugs.map((item, itemIndex) => itemIndex === index ? { ...item, severity: change.target.value as BugDraft['severity'] } : item) })} value={bug.severity}>{['critical', 'high', 'medium', 'low'].map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label={`Bug ${index + 1} Status`} onChange={(change) => updateDraft({ bugs: evidenceDraft.bugs.map((item, itemIndex) => itemIndex === index ? { ...item, status: change.target.value as BugDraft['status'] } : item) })} value={bug.status}>{['open', 'fixed', 'verified'].map((value) => <option key={value}>{value}</option>)}</select>
          <button onClick={() => updateDraft({ bugs: evidenceDraft.bugs.filter((_, itemIndex) => itemIndex !== index) })} type="button">Remove Bug</button>
        </div>)}<button onClick={() => updateDraft({ bugs: [...evidenceDraft.bugs, { id: '', title: '', severity: 'medium', status: 'open' }] })} type="button">Add Bug</button></fieldset>
      </> : null}
      <label>Producer<select aria-label="Producer" disabled={disabled} onChange={(change) => setProducerDeskId(change.target.value)} value={producerDeskId}>{producerOptions.map((desk) => <option key={desk.id} value={desk.id}>{desk.occupant.displayName}</option>)}</select></label>
      <label>Assignee<select aria-label="Assignee" disabled={disabled} onChange={(change) => setAssigneeDeskId(change.target.value)} value={assigneeDeskId}>{assigneeOptions.map((desk) => <option key={desk.id} value={desk.id}>{desk.occupant.displayName}</option>)}</select></label>
      <label>Generated Artifact ID<input aria-label="Generated Artifact ID" readOnly value={artifactId} /></label>
      <section className="event-console__preview"><h3>Event Preview</h3><pre data-testid="event-preview">{JSON.stringify(event, null, 2)}</pre></section>
      {validationError ? <p className="event-console__message event-console__message--error" role="alert">{validationError}</p> : null}
      {requestError ? <p className="event-console__message event-console__message--error" role="alert">{requestError}</p> : null}
      {success ? <p className="event-console__message event-console__message--success" role="status">{success}</p> : null}
      <button className="event-console__submit" disabled={!canSubmit} type="submit">{submitting ? 'Submitting…' : 'Submit and Assign'}</button>
    </form>
    <section className="event-console__reset">{!confirmingReset ? <button disabled={disabled} onClick={() => setConfirmingReset(true)} type="button">Reset Projection</button> : <div className="event-console__reset-confirm"><strong>Reset the live projection?</strong><p>This clears current runtime events and motions.</p><div><button disabled={resetting} onClick={() => { void reset(); }} type="button">{resetting ? 'Resetting…' : 'Confirm Reset'}</button><button disabled={resetting} onClick={() => setConfirmingReset(false)} type="button">Cancel</button></div></div>}</section>
  </div>;
}
