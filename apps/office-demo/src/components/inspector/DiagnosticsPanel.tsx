import { useCallback, useEffect, useState } from 'react';
import type { SanitizedEventResult } from '../../backend/eventResultStore';
import type { ProjectionRuntimeSummary, RuntimeHealth, SanitizedRejectedEvent } from '../../backend/runtimeDiagnostics';
import type { ProjectionConnectionState } from '../../hooks/useOfficeBackend';

type DiagnosticsOverview = { health: RuntimeHealth; runtime: ProjectionRuntimeSummary };

async function readJson<T>(response: Response): Promise<T> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const message = body !== null && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : `Diagnostics request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

const label = (value: string) => value.split('_').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ');
const timeLabel = (value: string | null) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Not yet received';

export function DiagnosticsPanel({ connectionState }: { connectionState: ProjectionConnectionState }) {
  const [overview, setOverview] = useState<DiagnosticsOverview | null>(null);
  const [recentEvents, setRecentEvents] = useState<SanitizedEventResult[]>([]);
  const [rejectedEvents, setRejectedEvents] = useState<SanitizedRejectedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRejected, setLoadingRejected] = useState(false);

  const refreshOverview = useCallback(async () => {
    try {
      const response = await fetch('/api/internal/diagnostics');
      setOverview(await readJson<DiagnosticsOverview>(response));
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Diagnostics are unavailable'); }
  }, []);

  useEffect(() => {
    void refreshOverview();
    const timer = window.setInterval(() => { void refreshOverview(); }, 5_000);
    return () => window.clearInterval(timer);
  }, [refreshOverview]);

  const refreshEvents = async () => {
    setLoadingEvents(true);
    try { setRecentEvents(await readJson<SanitizedEventResult[]>(await fetch('/api/internal/recent-events?limit=20'))); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Event intake is unavailable'); }
    finally { setLoadingEvents(false); }
  };

  const refreshRejected = async () => {
    setLoadingRejected(true);
    try { setRejectedEvents(await readJson<SanitizedRejectedEvent[]>(await fetch('/api/internal/rejected-events?limit=20'))); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Rejected events are unavailable'); }
    finally { setLoadingRejected(false); }
  };

  const downloadBundle = async () => {
    try {
      const response = await fetch('/api/internal/diagnostic-bundle');
      const serverBundle = await readJson<Record<string, unknown>>(response);
      const blob = new Blob([JSON.stringify({ ...serverBundle, connection: connectionState }, null, 2)], { type: 'application/json' });
      const disposition = response.headers.get('content-disposition') ?? '';
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'office-diagnostics.json';
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = filename; anchor.click();
      URL.revokeObjectURL(url);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Diagnostic bundle download failed'); }
  };

  const connectionOverall = connectionState.mode === 'offline' ? 'offline' : connectionState.mode === 'polling' ? 'degraded' : overview?.health.overall;

  return <div className="diagnostics-panel">
    <h2>Diagnostics</h2>
    {error ? <p className="diagnostics-panel__error" role="alert">{error}</p> : null}
    {!overview ? <p role="status">Loading system health…</p> : <>
      <section className="diagnostics-section"><h3>System Health</h3><dl className="diagnostics-grid">
        <div><dt>Overall</dt><dd>{label(connectionOverall ?? overview.health.overall)}</dd></div>
        <div><dt>Gateway</dt><dd>{label(overview.health.gateway)}</dd></div>
        <div><dt>Ledger</dt><dd>{label(overview.health.ledger)}</dd></div>
        <div><dt>Projection</dt><dd>{label(overview.health.projection)}</dd></div>
        <div><dt>Current Epoch</dt><dd>{overview.health.epoch}</dd></div>
        <div><dt>Projection Revision</dt><dd>{overview.health.revision}</dd></div>
        <div><dt>Last Accepted Sequence</dt><dd>{overview.health.lastSequence}</dd></div>
      </dl></section>
      <section className="diagnostics-section"><h3>Projection Runtime</h3><dl className="diagnostics-grid">
        <div><dt>Active Motion</dt><dd>{overview.health.activeMotionCount}</dd></div>
        <div><dt>Motion Queue Count</dt><dd>{overview.health.motionQueueCount}</dd></div>
        <div><dt>Pending Delivery Count</dt><dd>{overview.runtime.pendingDeliveryCount}</dd></div>
        <div><dt>Awaiting Acceptance Count</dt><dd>{overview.runtime.awaitingAcceptanceCount}</dd></div>
        <div><dt>Collecting Count</dt><dd>{overview.runtime.collectingCount}</dd></div>
        <div><dt>Active Work Count</dt><dd>{overview.runtime.activeWorkCount}</dd></div>
      </dl></section>
    </>}
    <section className="diagnostics-section"><h3>Live Connection</h3><dl className="diagnostics-grid">
      <div><dt>Mode</dt><dd>{connectionState.mode === 'sse' ? 'SSE' : label(connectionState.mode)}</dd></div>
      <div><dt>SSE State</dt><dd>{label(connectionState.sseState)}</dd></div>
      <div><dt>Last Snapshot Time</dt><dd>{timeLabel(connectionState.lastSnapshotAt)}</dd></div>
      <div><dt>Reconnect Count</dt><dd>{connectionState.reconnectCount}</dd></div>
      <div><dt>Polling Fallback</dt><dd>{connectionState.pollingFallback ? 'Yes' : 'No'}</dd></div>
    </dl></section>
    <section className="diagnostics-section"><div className="diagnostics-section__heading"><h3>Event Intake</h3><button disabled={loadingEvents} onClick={() => { void refreshEvents(); }} type="button">{loadingEvents ? 'Refreshing…' : 'Refresh Events'}</button></div>
      {recentEvents.length === 0 ? <p>No event outcomes loaded.</p> : <ul className="diagnostics-list">{recentEvents.map((event, index) => <li key={`${event.timestamp}-${event.eventId}-${index}`}><time>{timeLabel(event.timestamp)}</time><code>{event.eventId}</code><span>{event.eventType}</span><span>{event.sourceSystem}</span><strong>{event.result}</strong>{event.reasonCode ? <small>{event.reasonCode}</small> : null}</li>)}</ul>}
    </section>
    <section className="diagnostics-section"><div className="diagnostics-section__heading"><h3>Rejected Events</h3><button disabled={loadingRejected} onClick={() => { void refreshRejected(); }} type="button">{loadingRejected ? 'Refreshing…' : 'Refresh Rejections'}</button></div>
      {rejectedEvents.length === 0 ? <p>No rejected events loaded.</p> : <ul className="diagnostics-list">{rejectedEvents.map((event, index) => <li key={`${event.rejectedAt}-${event.eventId ?? index}`}><time>{timeLabel(event.rejectedAt)}</time>{event.eventId ? <code>{event.eventId}</code> : null}<span>{event.eventType ?? 'Unknown event'}</span><span>{event.sourceSystem ?? 'Unknown source'}</span><strong>{event.reasonCode}</strong><small>{event.message}</small>{event.correlationId ? <code>{event.correlationId}</code> : null}</li>)}</ul>}
    </section>
    <button className="diagnostics-panel__download" onClick={() => { void downloadBundle(); }} type="button">Download Diagnostic Bundle</button>
  </div>;
}
