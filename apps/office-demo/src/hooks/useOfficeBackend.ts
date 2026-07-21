import { useCallback, useEffect, useState } from 'react';
import { createOfficeState, toOfficeSnapshot, type OfficeEvent, type OfficeSnapshot } from '../backend/officeDomain';

const POLL_INTERVAL_MS = 500;
const seedSnapshot = toOfficeSnapshot(createOfficeState());

async function readSnapshot(response: Response): Promise<OfficeSnapshot> {
  const body = await response.json() as OfficeSnapshot | { error?: string };
  if (!response.ok) throw new Error('error' in body && body.error ? body.error : `Office API request failed (${response.status})`);
  return body as OfficeSnapshot;
}

export function useOfficeBackend() {
  const [snapshot, setSnapshot] = useState<OfficeSnapshot>(seedSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [pendingArtifactId, setPendingArtifactId] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch('/api/office-state', { signal });
    const next = await readSnapshot(response);
    setSnapshot(next);
    setError(null);
    return next;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const poll = () => { void refresh(controller.signal).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Office API is unavailable');
    }); };
    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refresh]);

  const postEvent = useCallback(async (event: OfficeEvent) => {
    if (event.type === 'artifact.accepted') setPendingArtifactId(event.artifactId);
    try {
      const response = await fetch('/api/office-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const next = await readSnapshot(response);
      setSnapshot(next);
      setError(null);
      return next;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Office API request failed';
      setError(message);
      throw reason;
    } finally {
      if (event.type === 'artifact.accepted') setPendingArtifactId(null);
    }
  }, []);

  return { snapshot, error, pendingArtifactId, postEvent, refresh };
}
