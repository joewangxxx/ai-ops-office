import type { ArtifactCategory } from '../data/demoScenario';

export type ArtifactRoute = {
  producerWorkspaceId: string;
  assigneeWorkspaceId: string;
};

export const ARTIFACT_ROUTES = {
  prd: { producerWorkspaceId: 'pm-office', assigneeWorkspaceId: 'dev-office' },
  feature: { producerWorkspaceId: 'dev-office', assigneeWorkspaceId: 'qa-lab' },
  report: { producerWorkspaceId: 'qa-lab', assigneeWorkspaceId: 'pm-office' },
} as const satisfies Record<ArtifactCategory, ArtifactRoute>;

export function isArtifactCategory(value: unknown): value is ArtifactCategory {
  return typeof value === 'string' && Object.hasOwn(ARTIFACT_ROUTES, value);
}

export function getArtifactRoute(category: ArtifactCategory): ArtifactRoute {
  return ARTIFACT_ROUTES[category];
}
