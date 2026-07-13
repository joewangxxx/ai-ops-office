export type Selection =
  | { kind: 'office' }
  | { kind: 'workspace'; workspaceId: string }
  | { kind: 'avatar'; deskId: string }
  | { kind: 'offlineDesk'; deskId: string }
  | { kind: 'hub' }
  | { kind: 'artifact'; artifactId: string };

export const officeSelection: Selection = { kind: 'office' };
