export type ArtifactCategory = 'prd' | 'feature' | 'report';

export type ArtifactScenario = {
  id: string;
  category: ArtifactCategory;
  title: string;
  status: string;
  submittedBy: string;
  confirmedBy: string;
  acceptedBy: string;
};

export type WorkspaceScenario = {
  workspaceId: string;
  onlineLabel: string;
  online: number;
  total: number;
  todayOutput: Array<{ label: string; artifactIds: string[] }>;
  queue: {
    inbox: string;
    inProgress: string;
    outbox: string;
  };
  blockers: number;
};

export type PersonScenario = {
  deskId: string;
  role: string;
  agent: string;
  currentTask?: string;
  inputArtifact?: string;
};

export type HandoffScenario = {
  time: string;
  summary: string;
};

export const demoScenario = {
  workspaces: [
    {
      workspaceId: 'pm-office',
      onlineLabel: 'Product Managers Online',
      online: 2,
      total: 3,
      todayOutput: [{ label: 'PRDs Submitted', artifactIds: ['login-requirement-prd-v1', 'account-security-prd-v1'] }],
      queue: { inbox: '1 brief awaiting review', inProgress: '1 requirement in drafting', outbox: '2 PRDs submitted' },
      blockers: 0,
    },
    {
      workspaceId: 'dev-office',
      onlineLabel: 'Developers Online',
      online: 3,
      total: 4,
      todayOutput: [{ label: 'Features In Progress', artifactIds: ['login-feature-v1', 'account-security-feature-v1', 'audit-export-feature-v1'] }],
      queue: { inbox: '2 accepted PRDs', inProgress: '3 features in progress', outbox: '1 build ready for QA' },
      blockers: 1,
    },
    {
      workspaceId: 'qa-lab',
      onlineLabel: 'QA Engineers Online',
      online: 2,
      total: 3,
      todayOutput: [{ label: 'Test Reports', artifactIds: ['login-regression-report-v1'] }],
      queue: { inbox: '1 build queued', inProgress: '1 regression suite running', outbox: '1 report submitted' },
      blockers: 0,
    },
  ] satisfies WorkspaceScenario[],
  people: [
    { deskId: 'pm-alice', role: 'Product Manager', agent: 'Product Planning Agent', currentTask: 'Reviewing login requirements' },
    { deskId: 'pm-bob', role: 'Product Manager', agent: 'Product Planning Agent', currentTask: 'Drafting account security brief' },
    { deskId: 'pm-cindy', role: 'Product Manager', agent: 'Not active' },
    { deskId: 'dev-jack', role: 'Frontend Developer', agent: 'Development Agent', currentTask: 'Implementing login flow', inputArtifact: 'Login Requirement PRD v1.0' },
    { deskId: 'dev-kara', role: 'Backend Developer', agent: 'Development Agent', currentTask: 'Preparing account service', inputArtifact: 'Account Security PRD v1.0' },
    { deskId: 'dev-leo', role: 'Platform Developer', agent: 'Development Agent', currentTask: 'Building audit export', inputArtifact: 'Audit Export Requirement PRD v1.0' },
    { deskId: 'dev-mia', role: 'Backend Developer', agent: 'Not active' },
    { deskId: 'qa-quinn', role: 'QA Engineer', agent: 'Quality Agent', currentTask: 'Running login regression', inputArtifact: 'Login Feature v1.0' },
    { deskId: 'qa-rita', role: 'QA Engineer', agent: 'Quality Agent', currentTask: 'Verifying account security', inputArtifact: 'Account Security Feature v1.0' },
    { deskId: 'qa-tina', role: 'QA Engineer', agent: 'Not active' },
  ] satisfies PersonScenario[],
  artifacts: [
    { id: 'login-requirement-prd-v1', category: 'prd', title: 'Login Requirement PRD v1.0', status: 'Confirmed', submittedBy: 'Alice', confirmedBy: 'Bob', acceptedBy: 'Jack' },
    { id: 'account-security-prd-v1', category: 'prd', title: 'Account Security PRD v1.0', status: 'Confirmed', submittedBy: 'Bob', confirmedBy: 'Alice', acceptedBy: 'Kara' },
    { id: 'login-feature-v1', category: 'feature', title: 'Login Feature v1.0', status: 'In Progress', submittedBy: 'Jack', confirmedBy: 'Alice', acceptedBy: 'Quinn' },
    { id: 'account-security-feature-v1', category: 'feature', title: 'Account Security Feature v1.0', status: 'In Progress', submittedBy: 'Kara', confirmedBy: 'Bob', acceptedBy: 'Rita' },
    { id: 'audit-export-feature-v1', category: 'feature', title: 'Audit Export Feature v1.0', status: 'In Progress', submittedBy: 'Leo', confirmedBy: 'Bob', acceptedBy: 'Quinn' },
    { id: 'login-regression-report-v1', category: 'report', title: 'Login Regression Report v1.0', status: 'Submitted', submittedBy: 'Quinn', confirmedBy: 'Rita', acceptedBy: 'Alice' },
  ] satisfies ArtifactScenario[],
  handoffs: [
    { time: '10:24', summary: 'Quinn submitted Login Regression Report to PM Office' },
    { time: '10:08', summary: 'Jack accepted Login Requirement PRD from Artifact Hub' },
    { time: '09:42', summary: 'Alice submitted Login Requirement PRD to Artifact Hub' },
  ] satisfies HandoffScenario[],
} as const;

export const hubArtifactCounts = [
  { category: 'prd' as const, label: 'PRDs', count: 2 },
  { category: 'feature' as const, label: 'Features', count: 3 },
  { category: 'report' as const, label: 'Reports', count: 1 },
];

export function getWorkspaceScenario(workspaceId: string) {
  return demoScenario.workspaces.find((workspace) => workspace.workspaceId === workspaceId);
}

export function getPersonScenario(deskId: string) {
  return demoScenario.people.find((person) => person.deskId === deskId);
}

export function getArtifactScenario(artifactId: string) {
  return demoScenario.artifacts.find((artifact) => artifact.id === artifactId);
}

export function getArtifactsByIds(artifactIds: readonly string[]) {
  return artifactIds.flatMap((artifactId) => {
    const artifact = getArtifactScenario(artifactId);
    return artifact ? [artifact] : [];
  });
}
