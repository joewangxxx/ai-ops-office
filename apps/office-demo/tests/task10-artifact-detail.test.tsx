import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InspectorContent } from '../src/components/inspector/InspectorContent';
import { createOfficeState } from '../src/backend/officeDomain';
import { getHubArtifactCounts, type DemoScenario } from '../src/data/demoScenario';

function renderArtifact(artifact: Record<string, unknown>) {
  const scenario = structuredClone(createOfficeState().scenario) as DemoScenario;
  scenario.artifacts = [artifact as never];
  render(<InspectorContent
    hubCounts={getHubArtifactCounts()}
    onSelectionChange={vi.fn()}
    scenario={scenario}
    selection={{ kind: 'artifact', artifactId: String(artifact.id) }}
  />);
}

const base = {
  status: 'Submitted', submittedBy: 'Alice', confirmedBy: 'Bob', acceptedBy: 'Pending',
};

describe('Task 10 differentiated Artifact Detail', () => {
  it('renders PRD evidence in role order without generic metadata', () => {
    renderArtifact({
      ...base, id: 'prd-xss', category: 'prd', title: 'Secure Sign-in PRD v2.0',
      evidence: {
        kind: 'prd', summary: '<script>alert("xss")</script>', priority: 'P1', scope: ['Authentication'],
        userStories: [{ id: 'US-1', statement: 'A user can sign in.' }], acceptanceCriteria: ['Valid credentials succeed.'],
      },
    });

    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.queryByText(/^Type$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Source$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Target$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Version$/)).not.toBeInTheDocument();
  });

  it('renders Feature evidence with safe links and hides empty optionals', () => {
    renderArtifact({
      ...base, id: 'feature-1', category: 'feature', title: 'Secure Sign-in Feature v1.0',
      evidence: {
        kind: 'feature', summary: 'Implements sign-in.', commits: [{ sha: 'abc1234', message: 'feat: sign in' }],
        changedFiles: 4, build: { status: 'passed', reference: 'build-42' }, previewUrl: 'https://preview.example.test', apiContracts: [],
      },
    });

    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(screen.getByText('abc1234')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open preview' })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.queryByText('API Contracts')).not.toBeInTheDocument();
  });

  it('renders Test Report evidence and key result counts', () => {
    renderArtifact({
      ...base, id: 'report-1', category: 'report', title: 'Secure Sign-in Test Report v1.0',
      evidence: {
        kind: 'report', summary: 'Regression passed.', result: 'passed', testCases: { total: 8, passed: 8, failed: 0 },
        coverage: 92, regression: 'passed', bugs: [],
      },
    });

    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText('8 / 8 passed')).toBeInTheDocument();
    expect(screen.getByText('Coverage')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });
});
