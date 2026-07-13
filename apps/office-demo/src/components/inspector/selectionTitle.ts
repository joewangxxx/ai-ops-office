import { getArtifactScenario } from '../../data/demoScenario';
import { officeLayout } from '../../data/officeLayout';
import type { Selection } from '../../types/selection';

export function getInspectorTitle(selection: Selection) {
  if (selection.kind === 'office') return 'Office Summary';
  if (selection.kind === 'workspace') return `${officeLayout.workspaces.find((workspace) => workspace.id === selection.workspaceId)?.name ?? 'Workspace'} Overview`;
  if (selection.kind === 'avatar' || selection.kind === 'offlineDesk') return officeLayout.desks.find((desk) => desk.id === selection.deskId)?.occupant.displayName ?? 'Desk';
  if (selection.kind === 'hub') return 'Artifact Hub';
  return getArtifactScenario(selection.artifactId)?.title ?? 'Artifact';
}
