import { useCallback, useState } from 'react';
import type { ArtifactSubmittedEvent } from '../backend/businessEvents';
import { InspectorShell } from '../components/inspector/InspectorShell';
import { OfficeScene } from '../components/office/OfficeScene';
import { getHubArtifactCounts } from '../data/demoScenario';
import { useOfficeBackend } from '../hooks/useOfficeBackend';
import { useOfficeMotionRunner } from '../hooks/useOfficeMotionRunner';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { officeSelection, type Selection } from '../types/selection';

export function App() {
  const eventConsoleEnabled = typeof window === 'undefined' ? true : window.__OFFICE_CONFIG__?.eventConsoleEnabled ?? true;
  const diagnosticsEnabled = typeof window === 'undefined' ? false : window.__OFFICE_CONFIG__?.diagnosticsEnabled ?? false;
  const [selection, setSelection] = useState<Selection>(officeSelection);
  const prefersReducedMotion = usePrefersReducedMotion();
  const {
    acceptArtifact: acceptArtifactRequest,
    connectionState,
    error,
    pendingArtifactIds,
    postBusinessEvent,
    postRuntimeEvent,
    resetProjection,
    snapshot,
  } = useOfficeBackend();
  const motion = useOfficeMotionRunner(snapshot.activeMotion, postRuntimeEvent, prefersReducedMotion);
  const hubCounts = getHubArtifactCounts({
    prd: snapshot.scenario.hubArtifactIds.prd.length,
    feature: snapshot.scenario.hubArtifactIds.feature.length,
    report: snapshot.scenario.hubArtifactIds.report.length,
  });
  const acceptArtifact = useCallback(async (artifactId: string, assigneeDeskId: string) => {
    await acceptArtifactRequest(artifactId, assigneeDeskId);
  }, [acceptArtifactRequest]);
  const submitArtifact = useCallback(async (event: ArtifactSubmittedEvent) => {
    await postBusinessEvent(event);
  }, [postBusinessEvent]);

  return (
    <main className="app-shell">
      <section aria-label="Office scene stage" className="office-stage">
        <OfficeScene motion={motion} onSelectionChange={setSelection} snapshot={snapshot} />
      </section>
      <InspectorShell
        error={error}
        connectionState={connectionState}
        diagnosticsEnabled={diagnosticsEnabled}
        eventConsoleEnabled={eventConsoleEnabled}
        hubCounts={hubCounts}
        mobileOpen={selection.kind !== 'office'}
        notifications={snapshot.notifications}
        onAccept={acceptArtifact}
        onClose={() => setSelection(officeSelection)}
        onSubmitArtifact={submitArtifact}
        onResetProjection={resetProjection}
        onSelectionChange={setSelection}
        pendingArtifactIds={pendingArtifactIds}
        scenario={snapshot.scenario}
        selection={selection}
      />
    </main>
  );
}
