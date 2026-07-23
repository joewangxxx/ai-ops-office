import { describe, expect, it } from 'vitest';
import { applyBusinessEvent, createOfficeState, OfficeDomainError } from '../src/backend/officeDomain';
import { createOfficeApiStore } from '../src/backend/viteOfficeApi';
import { demoScenario } from '../src/data/demoScenario';

const prdEvidence = {
  kind: 'prd',
  summary: 'Defines secure sign-in behavior.',
  priority: 'P1',
  scope: ['Email sign-in'],
  userStories: [{ id: 'US-1', statement: 'As a user, I can sign in securely.' }],
  acceptanceCriteria: ['Valid credentials open the dashboard.'],
};

const featureEvidence = {
  kind: 'feature',
  summary: 'Implements secure sign-in.',
  commits: [{ sha: 'abc1234', message: 'feat: add secure sign-in' }],
  changedFiles: 4,
  build: { status: 'passed', reference: 'build-42' },
  previewUrl: 'https://preview.example.test/sign-in',
  apiContracts: ['POST /api/session'],
};

const reportEvidence = {
  kind: 'report',
  summary: 'Sign-in regression passed.',
  result: 'passed',
  testCases: { total: 8, passed: 8, failed: 0 },
  coverage: 92,
  regression: 'passed',
  bugs: [],
};

function submitted(category: 'prd' | 'feature' | 'report', evidence: unknown = prdEvidence) {
  const routes = {
    prd: ['pm-alice', 'dev-jack'],
    feature: ['dev-jack', 'qa-quinn'],
    report: ['qa-quinn', 'pm-alice'],
  } as const;
  const [producerDeskId, assigneeDeskId] = routes[category];
  return {
    eventId: `task10-${category}`,
    eventType: 'artifact.submitted',
    schemaVersion: '1.0',
    occurredAt: '2026-07-22T06:00:00.000Z',
    correlationId: `task10-${category}`,
    source: { system: 'task10-test' },
    payload: {
      artifact: { id: `task10-${category}`, category, title: `Task 10 ${category}`, evidence },
      producerDeskId,
      assigneeDeskId,
    },
  };
}

describe('Task 10 evidence validation', () => {
  it.each([
    ['prd', prdEvidence],
    ['feature', featureEvidence],
    ['report', reportEvidence],
  ] as const)('accepts valid %s evidence and projects it intact', (category, evidence) => {
    const result = createOfficeApiStore().handle('POST', '/api/business-events', submitted(category, evidence));

    expect(result).toMatchObject({
      status: 202,
      body: { snapshot: { scenario: { artifacts: expect.arrayContaining([expect.objectContaining({ id: `task10-${category}`, evidence })]) } } },
    });
  });

  it('rejects missing evidence and category/kind mismatches at the API boundary', () => {
    const missing = submitted('prd') as { payload: { artifact: Record<string, unknown> } };
    delete missing.payload.artifact.evidence;

    expect(createOfficeApiStore().handle('POST', '/api/business-events', missing)).toMatchObject({ status: 400 });
    expect(createOfficeApiStore().handle('POST', '/api/business-events', submitted('prd', featureEvidence))).toEqual({
      status: 400,
      body: { error: 'Evidence kind feature does not match category prd' },
    });
  });

  it.each([
    ['prd', { ...prdEvidence, scope: [] }],
    ['feature', { ...featureEvidence, commits: [] }],
    ['feature', { ...featureEvidence, previewUrl: 'javascript:alert(1)' }],
    ['report', { ...reportEvidence, coverage: 101 }],
    ['report', { ...reportEvidence, result: 'passed', testCases: { total: 8, passed: 7, failed: 1 } }],
  ] as const)('rejects invalid %s evidence constraints', (category, evidence) => {
    expect(createOfficeApiStore().handle('POST', '/api/business-events', submitted(category, evidence))).toMatchObject({ status: 400 });
  });

  it('revalidates evidence in the domain and preserves state on failure', () => {
    const state = createOfficeState();
    const before = structuredClone(state);

    expect(() => applyBusinessEvent(state, submitted('prd', { ...prdEvidence, acceptanceCriteria: [] }) as never))
      .toThrowError(new OfficeDomainError(400, 'PRD evidence requires at least one acceptance criterion'));
    expect(state).toEqual(before);
  });

  it('gives every initial fixture legal category-matched evidence', () => {
    for (const artifact of demoScenario.artifacts as Array<(typeof demoScenario.artifacts)[number] & { evidence?: { kind?: string } }>) {
      expect(artifact.evidence, artifact.id).toBeDefined();
      expect(artifact.evidence?.kind, artifact.id).toBe(artifact.category);
    }
  });
});
