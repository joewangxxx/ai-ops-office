import type { ArtifactCategory } from '../data/demoScenario';

export type PrdEvidence = {
  kind: 'prd';
  summary: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  scope: string[];
  userStories: Array<{ id: string; statement: string }>;
  acceptanceCriteria: string[];
};

export type FeatureEvidence = {
  kind: 'feature';
  summary: string;
  commits: Array<{ sha: string; message: string }>;
  changedFiles: number;
  build: { status: 'pending' | 'passed' | 'failed'; reference?: string };
  previewUrl?: string;
  apiContracts: string[];
};

export type TestReportEvidence = {
  kind: 'report';
  summary: string;
  result: 'passed' | 'failed' | 'blocked';
  testCases: { total: number; passed: number; failed: number };
  coverage?: number;
  regression: 'passed' | 'failed' | 'not_run';
  bugs: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'fixed' | 'verified';
  }>;
};

export type ArtifactEvidence = PrdEvidence | FeatureEvidence | TestReportEvidence;

export class ArtifactEvidenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArtifactEvidenceValidationError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

function record(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) throw new ArtifactEvidenceValidationError(`${name} must be an object`);
  return value;
}

function text(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ArtifactEvidenceValidationError(`${name} must be a non-empty string`);
  }
  return value;
}

function choice<T extends string>(value: unknown, values: readonly T[], name: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new ArtifactEvidenceValidationError(`${name} must be one of ${values.join(', ')}`);
  }
  return value as T;
}

function count(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ArtifactEvidenceValidationError(`${name} must be a non-negative integer`);
  }
  return value;
}

function textArray(value: unknown, name: string, requireOne = false): string[] {
  if (!Array.isArray(value) || (requireOne && value.length === 0)) {
    throw new ArtifactEvidenceValidationError(`${name} ${requireOne ? 'requires at least one item' : 'must be an array'}`);
  }
  return value.map((item, index) => text(item, `${name}[${index}]`));
}

function parsePrd(value: Record<string, unknown>): PrdEvidence {
  const scope = textArray(value.scope, 'PRD evidence scope', true);
  if (!Array.isArray(value.userStories) || value.userStories.length === 0) {
    throw new ArtifactEvidenceValidationError('PRD evidence requires at least one user story');
  }
  const acceptanceCriteria = textArray(value.acceptanceCriteria, 'PRD evidence acceptance criteria');
  if (acceptanceCriteria.length === 0) {
    throw new ArtifactEvidenceValidationError('PRD evidence requires at least one acceptance criterion');
  }
  return {
    kind: 'prd',
    summary: text(value.summary, 'PRD evidence summary'),
    priority: choice(value.priority, ['P0', 'P1', 'P2', 'P3'] as const, 'PRD evidence priority'),
    scope,
    userStories: value.userStories.map((item, index) => {
      const story = record(item, `PRD evidence userStories[${index}]`);
      return { id: text(story.id, `PRD evidence userStories[${index}].id`), statement: text(story.statement, `PRD evidence userStories[${index}].statement`) };
    }),
    acceptanceCriteria,
  };
}

function parseFeature(value: Record<string, unknown>): FeatureEvidence {
  if (!Array.isArray(value.commits) || value.commits.length === 0) {
    throw new ArtifactEvidenceValidationError('Feature evidence requires at least one commit');
  }
  const build = record(value.build, 'Feature evidence build');
  const previewUrl = value.previewUrl === undefined ? undefined : text(value.previewUrl, 'Feature evidence previewUrl');
  if (previewUrl !== undefined) {
    let protocol = '';
    try { protocol = new URL(previewUrl).protocol; } catch { throw new ArtifactEvidenceValidationError('Feature evidence previewUrl must be an http or https URL'); }
    if (protocol !== 'http:' && protocol !== 'https:') throw new ArtifactEvidenceValidationError('Feature evidence previewUrl must be an http or https URL');
  }
  const reference = build.reference === undefined ? undefined : text(build.reference, 'Feature evidence build.reference');
  return {
    kind: 'feature',
    summary: text(value.summary, 'Feature evidence summary'),
    commits: value.commits.map((item, index) => {
      const commit = record(item, `Feature evidence commits[${index}]`);
      return { sha: text(commit.sha, `Feature evidence commits[${index}].sha`), message: text(commit.message, `Feature evidence commits[${index}].message`) };
    }),
    changedFiles: count(value.changedFiles, 'Feature evidence changedFiles'),
    build: {
      status: choice(build.status, ['pending', 'passed', 'failed'] as const, 'Feature evidence build.status'),
      ...(reference === undefined ? {} : { reference }),
    },
    ...(previewUrl === undefined ? {} : { previewUrl }),
    apiContracts: textArray(value.apiContracts, 'Feature evidence apiContracts'),
  };
}

function parseReport(value: Record<string, unknown>): TestReportEvidence {
  const testCases = record(value.testCases, 'Test Report evidence testCases');
  const total = count(testCases.total, 'Test Report evidence testCases.total');
  const passed = count(testCases.passed, 'Test Report evidence testCases.passed');
  const failed = count(testCases.failed, 'Test Report evidence testCases.failed');
  if (passed + failed > total) throw new ArtifactEvidenceValidationError('Test Report passed and failed counts cannot exceed total');
  const result = choice(value.result, ['passed', 'failed', 'blocked'] as const, 'Test Report evidence result');
  const coverage = value.coverage === undefined ? undefined : value.coverage;
  if (coverage !== undefined && (typeof coverage !== 'number' || coverage < 0 || coverage > 100)) {
    throw new ArtifactEvidenceValidationError('Test Report evidence coverage must be between 0 and 100');
  }
  if (!Array.isArray(value.bugs)) throw new ArtifactEvidenceValidationError('Test Report evidence bugs must be an array');
  const bugs = value.bugs.map((item, index) => {
    const bug = record(item, `Test Report evidence bugs[${index}]`);
    return {
      id: text(bug.id, `Test Report evidence bugs[${index}].id`),
      title: text(bug.title, `Test Report evidence bugs[${index}].title`),
      severity: choice(bug.severity, ['critical', 'high', 'medium', 'low'] as const, `Test Report evidence bugs[${index}].severity`),
      status: choice(bug.status, ['open', 'fixed', 'verified'] as const, `Test Report evidence bugs[${index}].status`),
    };
  });
  if (result === 'passed' && failed !== 0) throw new ArtifactEvidenceValidationError('A passed Test Report cannot contain failed test cases');
  if (result === 'passed' && bugs.some((bug) => bug.severity === 'critical' && bug.status === 'open')) {
    throw new ArtifactEvidenceValidationError('A passed Test Report cannot contain an open critical bug');
  }
  return {
    kind: 'report',
    summary: text(value.summary, 'Test Report evidence summary'),
    result,
    testCases: { total, passed, failed },
    ...(coverage === undefined ? {} : { coverage }),
    regression: choice(value.regression, ['passed', 'failed', 'not_run'] as const, 'Test Report evidence regression'),
    bugs,
  };
}

export function parseArtifactEvidence(category: ArtifactCategory, value: unknown): ArtifactEvidence {
  const evidence = record(value, 'Artifact evidence');
  if (evidence.kind !== category) {
    throw new ArtifactEvidenceValidationError(`Evidence kind ${String(evidence.kind)} does not match category ${category}`);
  }
  if (category === 'prd') return parsePrd(evidence);
  if (category === 'feature') return parseFeature(evidence);
  return parseReport(evidence);
}
