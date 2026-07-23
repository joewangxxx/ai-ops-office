import { useEffect, useState } from 'react';
import type { ArtifactSubmittedEvent } from '../../backend/businessEvents';
import type { OfficeNotification } from '../../backend/officeDomain';
import type { DemoScenario, HubArtifactCount } from '../../data/demoScenario';
import type { Selection } from '../../types/selection';
import { EventConsole } from './EventConsole';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { InspectorContent } from './InspectorContent';
import { getInspectorTitle } from './selectionTitle';

type InspectorShellProps = {
  selection: Selection;
  mobileOpen: boolean;
  onClose: () => void;
  onSelectionChange: (selection: Selection) => void;
  scenario: DemoScenario;
  hubCounts: readonly HubArtifactCount[];
  notifications: readonly OfficeNotification[];
  onAccept: (artifactId: string, assigneeDeskId: string) => Promise<void>;
  onSubmitArtifact: (event: ArtifactSubmittedEvent) => Promise<void>;
  onResetProjection: () => Promise<unknown>;
  pendingArtifactIds: ReadonlySet<string>;
  error: string | null;
  eventConsoleEnabled?: boolean;
  diagnosticsEnabled?: boolean;
  connectionState?: import('../../hooks/useOfficeBackend').ProjectionConnectionState;
};

export function InspectorShell({ connectionState = { mode: 'connecting', failures: 0, sseState: 'connecting', lastSnapshotAt: null, reconnectCount: 0, pollingFallback: false }, diagnosticsEnabled = false, error, eventConsoleEnabled = true, hubCounts, mobileOpen, notifications, onAccept, onClose, onResetProjection, onSelectionChange, onSubmitArtifact, pendingArtifactIds, scenario, selection }: InspectorShellProps) {
  const [view, setView] = useState<'inspect' | 'console' | 'diagnostics'>('inspect');
  const title = view === 'console' ? 'Event Console' : view === 'diagnostics' ? 'Diagnostics' : getInspectorTitle(selection);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileOpen) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen, onClose]);

  return (
    <aside aria-label={title} className="inspector-shell" data-mobile-open={mobileOpen} role="complementary">
      <div className="inspector-shell__header">
        <div className="inspector-shell__header-row">
          <p className="inspector-shell__eyebrow">Live Backend</p>
          <button aria-label="Close Inspector" className="inspector-shell__close" onClick={onClose} type="button">×</button>
        </div>
        <div aria-label="Inspector views" className="inspector-shell__tabs" role="tablist">
          <button aria-selected={view === 'inspect'} onClick={() => setView('inspect')} role="tab" type="button">Inspect</button>
          {eventConsoleEnabled ? <button aria-selected={view === 'console'} onClick={() => setView('console')} role="tab" type="button">Event Console</button> : null}
          {diagnosticsEnabled ? <button aria-selected={view === 'diagnostics'} onClick={() => setView('diagnostics')} role="tab" type="button">Diagnostics</button> : null}
        </div>
      </div>
      {error && view === 'inspect' ? <p className="inspector-shell__error" role="status">{error}</p> : null}
      <div className="inspector-shell__content">
        {view === 'console'
          ? <EventConsole onReset={onResetProjection} onSubmit={onSubmitArtifact} scenario={scenario} />
          : view === 'diagnostics'
            ? <DiagnosticsPanel connectionState={connectionState} />
            : <InspectorContent hubCounts={hubCounts} notifications={notifications} onAccept={onAccept} onSelectionChange={onSelectionChange} pendingArtifactIds={pendingArtifactIds} scenario={scenario} selection={selection} />}
      </div>
    </aside>
  );
}
