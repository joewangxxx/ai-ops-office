import type { ArtifactSubmittedEvent } from '../../backend/businessEvents';
import type { DemoScenario } from '../../data/demoScenario';
import { DispatchEventForm } from './DispatchEventForm';

type ArtifactDispatchFormProps = {
  scenario: DemoScenario;
  onSubmit: (event: ArtifactSubmittedEvent) => Promise<unknown>;
};

export function ArtifactDispatchForm({ scenario, onSubmit }: ArtifactDispatchFormProps) {
  return <DispatchEventForm
    heading="Dispatch Center"
    includeOfflineAssignees
    onSubmit={onSubmit}
    scenario={scenario}
    sourceSystem="operations-dispatch"
  />;
}
