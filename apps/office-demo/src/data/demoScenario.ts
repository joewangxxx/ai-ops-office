import type { ArtifactEvidence } from '../domain/artifactEvidence';

export type ArtifactCategory = 'prd' | 'feature' | 'report';

export type ArtifactScenario = {
  id: string;
  category: ArtifactCategory;
  title: string;
  status: string;
  submittedBy: string;
  confirmedBy: string;
  acceptedBy: string;
  evidence: ArtifactEvidence;
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
  availability: string;
  currentTask?: string;
  inputArtifact?: string;
  activeWorks: Array<{
    id: string;
    title: string;
    sourceArtifactId?: string;
    status: 'active' | 'waiting_human';
  }>;
};

export type HandoffScenario = {
  time: string;
  summary: string;
};

export type HubArtifactCount = {
  category: ArtifactCategory;
  label: string;
  count: number;
};

export type DemoScenario = {
  workspaces: WorkspaceScenario[];
  people: PersonScenario[];
  artifacts: ArtifactScenario[];
  hubArtifactIds: Record<ArtifactCategory, string[]>;
  handoffs: HandoffScenario[];
};

export const demoScenario: DemoScenario = {
  workspaces: [
    {
      workspaceId: 'pm-office',
      onlineLabel: 'Product Managers Online',
      online: 2,
      total: 3,
      todayOutput: [{ label: 'PRDs Submitted', artifactIds: ['account-security-prd-v1'] }],
      queue: { inbox: '1 brief awaiting review', inProgress: '1 requirement in drafting', outbox: '1 PRD submitted' },
      blockers: 0,
    },
    {
      workspaceId: 'dev-office',
      onlineLabel: 'Developers Online',
      online: 3,
      total: 4,
      todayOutput: [{ label: 'Features In Progress', artifactIds: ['account-security-feature-v1', 'audit-export-feature-v1', 'notification-center-feature-v1'] }],
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
  ],
  people: [
    { deskId: 'pm-alice', role: 'Product Manager', agent: 'Product Planning Agent', availability: 'Online', currentTask: 'Reviewing login requirements', activeWorks: [{ id: 'alice-login-review', title: 'Reviewing login requirements', status: 'active' }] },
    { deskId: 'pm-bob', role: 'Product Manager', agent: 'Product Planning Agent', availability: 'Online', currentTask: 'Drafting account security brief', activeWorks: [{ id: 'bob-account-brief', title: 'Drafting account security brief', status: 'active' }] },
    { deskId: 'pm-cindy', role: 'Product Manager', agent: 'Not active', availability: 'Offline', activeWorks: [] },
    { deskId: 'dev-jack', role: 'Frontend Developer', agent: 'Development Agent', availability: 'Online', currentTask: 'Implementing login flow', inputArtifact: 'Login Requirement PRD v1.0', activeWorks: [{ id: 'jack-login-prd', title: 'Implementing login flow', sourceArtifactId: 'login-requirement-prd-v1', status: 'active' }] },
    { deskId: 'dev-kara', role: 'Backend Developer', agent: 'Development Agent', availability: 'Online', currentTask: 'Preparing account service', inputArtifact: 'Account Security PRD v1.0', activeWorks: [{ id: 'kara-account-prd', title: 'Preparing account service', sourceArtifactId: 'account-security-prd-v1', status: 'active' }] },
    { deskId: 'dev-leo', role: 'Platform Developer', agent: 'Development Agent', availability: 'Online', currentTask: 'Building audit export', inputArtifact: 'Audit Export Requirement PRD v1.0', activeWorks: [{ id: 'leo-audit-prd', title: 'Building audit export', sourceArtifactId: 'audit-export-feature-v1', status: 'active' }] },
    { deskId: 'dev-mia', role: 'Backend Developer', agent: 'Not active', availability: 'Offline', activeWorks: [] },
    { deskId: 'qa-quinn', role: 'QA Engineer', agent: 'Quality Agent', availability: 'Online', activeWorks: [] },
    { deskId: 'qa-rita', role: 'QA Engineer', agent: 'Quality Agent', availability: 'Online', currentTask: 'Verifying account security', inputArtifact: 'Account Security Feature v1.0', activeWorks: [{ id: 'rita-account-feature', title: 'Verifying account security', sourceArtifactId: 'account-security-feature-v1', status: 'active' }] },
    { deskId: 'qa-tina', role: 'QA Engineer', agent: 'Not active', availability: 'Offline', activeWorks: [] },
  ],
  artifacts: [
    { id: 'login-requirement-prd-v1', category: 'prd', title: 'Login Requirement PRD v1.0', status: 'Confirmed', submittedBy: 'Alice', confirmedBy: 'Bob', acceptedBy: 'Pending', evidence: { kind: 'prd', summary: 'Defines the login experience and session rules.', priority: 'P1', scope: ['Email sign-in', 'Session expiry'], userStories: [{ id: 'LOGIN-1', statement: 'As a user, I can sign in with valid credentials.' }], acceptanceCriteria: ['Valid credentials open the dashboard.', 'Expired sessions return to sign-in.'] } },
    { id: 'account-security-prd-v1', category: 'prd', title: 'Account Security PRD v1.0', status: 'Confirmed', submittedBy: 'Bob', confirmedBy: 'Alice', acceptedBy: 'Kara', evidence: { kind: 'prd', summary: 'Defines account protection and recovery behavior.', priority: 'P0', scope: ['Credential protection', 'Account recovery'], userStories: [{ id: 'SEC-1', statement: 'As a user, I can recover access securely.' }], acceptanceCriteria: ['Recovery links expire after one use.'] } },
    { id: 'login-feature-v1', category: 'feature', title: 'Login Feature v1.0', status: 'In Progress', submittedBy: 'Jack', confirmedBy: 'Alice', acceptedBy: 'Quinn', evidence: { kind: 'feature', summary: 'Implements the login form and session creation.', commits: [{ sha: 'a1b2c3d', message: 'feat: add login flow' }], changedFiles: 8, build: { status: 'passed', reference: 'build-login-18' }, apiContracts: ['POST /api/session'] } },
    { id: 'account-security-feature-v1', category: 'feature', title: 'Account Security Feature v1.0', status: 'In Progress', submittedBy: 'Kara', confirmedBy: 'Bob', acceptedBy: 'Rita', evidence: { kind: 'feature', summary: 'Adds secure recovery and credential controls.', commits: [{ sha: 'b2c3d4e', message: 'feat: add account recovery' }], changedFiles: 12, build: { status: 'passed', reference: 'build-security-24' }, apiContracts: ['POST /api/account/recovery'] } },
    { id: 'audit-export-feature-v1', category: 'feature', title: 'Audit Export Feature v1.0', status: 'In Progress', submittedBy: 'Leo', confirmedBy: 'Bob', acceptedBy: 'Quinn', evidence: { kind: 'feature', summary: 'Exports filtered audit entries for review.', commits: [{ sha: 'c3d4e5f', message: 'feat: add audit export' }], changedFiles: 6, build: { status: 'passed', reference: 'build-audit-12' }, apiContracts: ['GET /api/audit/export'] } },
    { id: 'notification-center-feature-v1', category: 'feature', title: 'Notification Center Feature v1.0', status: 'In Progress', submittedBy: 'Mia', confirmedBy: 'Bob', acceptedBy: 'Pending', evidence: { kind: 'feature', summary: 'Groups actionable product notifications.', commits: [{ sha: 'd4e5f6a', message: 'feat: add notification center' }], changedFiles: 10, build: { status: 'pending' }, apiContracts: [] } },
    { id: 'login-regression-report-v1', category: 'report', title: 'Login Regression Report v1.0', status: 'Submitted', submittedBy: 'Quinn', confirmedBy: 'Rita', acceptedBy: 'Alice', evidence: { kind: 'report', summary: 'Login regression completed without failures.', result: 'passed', testCases: { total: 24, passed: 24, failed: 0 }, coverage: 91, regression: 'passed', bugs: [] } },
  ],
  hubArtifactIds: {
    prd: ['account-security-prd-v1'],
    feature: ['account-security-feature-v1', 'audit-export-feature-v1'],
    report: ['login-regression-report-v1'],
  },
  handoffs: [
    { time: '10:24', summary: 'Quinn submitted Login Regression Report to Artifact Hub' },
    { time: '10:12', summary: 'Kara submitted Account Security Feature to Artifact Hub' },
    { time: '09:58', summary: 'Bob submitted Account Security PRD to Artifact Hub' },
  ],
};

export type HubArtifactTally = Partial<Record<ArtifactCategory, number>>;

export function getHubArtifactCounts(tally: HubArtifactTally | number = {}): HubArtifactCount[] {
  const values = typeof tally === 'number' ? { prd: tally } : tally;
  return [
    { category: 'prd', label: 'PRDs', count: values.prd ?? 1 },
    { category: 'feature', label: 'Features', count: values.feature ?? 2 },
    { category: 'report', label: 'Reports', count: values.report ?? 1 },
  ];
}

export const hubArtifactCounts = getHubArtifactCounts();

export function getWorkspaceScenario(workspaceId: string, scenario: DemoScenario = demoScenario) {
  return scenario.workspaces.find((workspace) => workspace.workspaceId === workspaceId);
}

export function getPersonScenario(deskId: string, scenario: DemoScenario = demoScenario) {
  return scenario.people.find((person) => person.deskId === deskId);
}

export function getArtifactScenario(artifactId: string, scenario: DemoScenario = demoScenario) {
  return scenario.artifacts.find((artifact) => artifact.id === artifactId);
}

export function getArtifactsByIds(artifactIds: readonly string[], scenario: DemoScenario = demoScenario) {
  return artifactIds.flatMap((artifactId) => {
    const artifact = getArtifactScenario(artifactId, scenario);
    return artifact ? [artifact] : [];
  });
}
