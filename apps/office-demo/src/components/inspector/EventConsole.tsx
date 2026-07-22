import { useMemo, useRef, useState, type FormEvent } from 'react';
import type { ArtifactCompletedEvent } from '../../backend/officeDomain';
import type { ArtifactCategory, DemoScenario } from '../../data/demoScenario';
import { officeLayout } from '../../data/officeLayout';
import { getArtifactRoute } from '../../domain/artifactRouting';
import { createArtifactId, createArtifactSuffix } from '../../utils/artifactEventDraft';

type EventConsoleProps = {
  scenario: DemoScenario;
  onSubmit: (event: ArtifactCompletedEvent) => Promise<unknown>;
  onReset: () => Promise<unknown>;
  suffixFactory?: () => string;
};

const CATEGORY_OPTIONS: Array<{ value: ArtifactCategory; label: string }> = [
  { value: 'prd', label: 'PRD' },
  { value: 'feature', label: 'Feature' },
  { value: 'report', label: 'Test Report' },
];

function getOnlineDesks(workspaceId: string, scenario: DemoScenario) {
  return officeLayout.desks.filter((desk) => {
    if (desk.workspaceId !== workspaceId || !desk.online || !desk.occupant.avatarKey) return false;
    return scenario.people.find((person) => person.deskId === desk.id)?.availability === 'Online';
  });
}

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Office API is unavailable';
}

export function EventConsole({ scenario, onSubmit, onReset, suffixFactory = createArtifactSuffix }: EventConsoleProps) {
  const initialRoute = getArtifactRoute('prd');
  const [category, setCategory] = useState<ArtifactCategory>('prd');
  const [title, setTitle] = useState('');
  const [producerDeskId, setProducerDeskId] = useState(() => getOnlineDesks(initialRoute.producerWorkspaceId, scenario)[0]?.id ?? '');
  const [assigneeDeskId, setAssigneeDeskId] = useState(() => getOnlineDesks(initialRoute.assigneeWorkspaceId, scenario)[0]?.id ?? '');
  const [draftSuffix, setDraftSuffix] = useState(() => suffixFactory());
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
  const event: ArtifactCompletedEvent = {
    type: 'artifact.completed',
    artifact: { id: artifactId, category, title },
    producerDeskId,
    assigneeDeskId,
  };
  const canSubmit = Boolean(title.trim() && artifactId && producerDeskId && assigneeDeskId) && !submitting && !resetting;

  const selectCategory = (nextCategory: ArtifactCategory) => {
    const nextRoute = getArtifactRoute(nextCategory);
    setCategory(nextCategory);
    setProducerDeskId(getOnlineDesks(nextRoute.producerWorkspaceId, scenario)[0]?.id ?? '');
    setAssigneeDeskId(getOnlineDesks(nextRoute.assigneeWorkspaceId, scenario)[0]?.id ?? '');
    setValidationError(null);
    setRequestError(null);
    setSuccess(null);
  };

  const submit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    if (submittingRef.current) return;
    if (!title.trim()) {
      setValidationError('Artifact title is required.');
      return;
    }
    if (!canSubmit) return;
    submittingRef.current = true;
    setSubmitting(true);
    setValidationError(null);
    setRequestError(null);
    setSuccess(null);
    try {
      await onSubmit(event);
      setSuccess(`Business event received: ${title}`);
      setTitle('');
      setDraftSuffix(suffixFactory());
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
      setSuccess(null);
      setValidationError(null);
      setConfirmingReset(false);
      setDraftSuffix(suffixFactory());
    } catch (reason) {
      setRequestError(errorMessage(reason));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="event-console">
      <h2>Event Console</h2>
      <p className="event-console__intro">Submit a standardized business event to the live office projection.</p>
      <form className="event-console__form" onSubmit={(formEvent) => { void submit(formEvent); }}>
        <label>Artifact Category<select aria-label="Artifact Category" disabled={submitting || resetting} onChange={(change) => selectCategory(change.target.value as ArtifactCategory)} value={category}>{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label>Artifact Title<input aria-label="Artifact Title" disabled={submitting || resetting} onBlur={() => { if (!title.trim()) setValidationError('Artifact title is required.'); }} onChange={(change) => { setTitle(change.target.value); setValidationError(null); setRequestError(null); setSuccess(null); }} placeholder="e.g. Login Requirement PRD v2.0" value={title} /></label>
        <label>Producer<select aria-label="Producer" disabled={submitting || resetting} onChange={(change) => setProducerDeskId(change.target.value)} value={producerDeskId}>{producerOptions.map((desk) => <option key={desk.id} value={desk.id}>{desk.occupant.displayName}</option>)}</select></label>
        <label>Assignee<select aria-label="Assignee" disabled={submitting || resetting} onChange={(change) => setAssigneeDeskId(change.target.value)} value={assigneeDeskId}>{assigneeOptions.map((desk) => <option key={desk.id} value={desk.id}>{desk.occupant.displayName}</option>)}</select></label>
        <label>Generated Artifact ID<input aria-label="Generated Artifact ID" readOnly value={artifactId} /></label>
        <section className="event-console__preview"><h3>Event Preview</h3><pre data-testid="event-preview">{JSON.stringify(event, null, 2)}</pre></section>
        {validationError ? <p className="event-console__message event-console__message--error" role="alert">{validationError}</p> : null}
        {requestError ? <p className="event-console__message event-console__message--error" role="alert">{requestError}</p> : null}
        {success ? <p className="event-console__message event-console__message--success" role="status">{success}</p> : null}
        <button className="event-console__submit" disabled={!canSubmit} type="submit">{submitting ? 'Submitting…' : 'Complete and Assign'}</button>
      </form>
      <section className="event-console__reset">
        {!confirmingReset ? <button disabled={submitting || resetting} onClick={() => setConfirmingReset(true)} type="button">Reset Projection</button> : <div className="event-console__reset-confirm"><strong>Reset the live projection?</strong><p>This clears current runtime events and motions.</p><div><button disabled={resetting} onClick={() => { void reset(); }} type="button">{resetting ? 'Resetting…' : 'Confirm Reset'}</button><button disabled={resetting} onClick={() => setConfirmingReset(false)} type="button">Cancel</button></div></div>}
      </section>
    </div>
  );
}
