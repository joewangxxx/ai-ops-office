import { useState } from 'react';
import { InspectorShell } from '../components/inspector/InspectorShell';
import { OfficeScene } from '../components/office/OfficeScene';
import { officeSelection, type Selection } from '../types/selection';

export function App() {
  const [selection, setSelection] = useState<Selection>(officeSelection);

  return (
    <main className="app-shell">
      <section aria-label="Office scene stage" className="office-stage">
        <OfficeScene onSelectionChange={setSelection} />
      </section>
      <InspectorShell
        mobileOpen={selection.kind !== 'office'}
        onClose={() => setSelection(officeSelection)}
        onSelectionChange={setSelection}
        selection={selection}
      />
    </main>
  );
}
