import { describe, expect, it } from 'vitest';
import * as storyModule from '../src/story/prdHandoffStory';

type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'complete';

type StoryRuntime = {
  state: string;
  playbackStatus: PlaybackStatus;
  waypointIndex: number;
};

type ProjectedArtifact = {
  id: string;
  category: 'prd' | 'feature';
  location: 'desk' | 'carrier' | 'hub';
  deskId?: string;
  carrierId?: string;
};

type ProjectedFrame = {
  state: string;
  actors: Array<{ id: string; pose: string; coordinate: { x: number; y: number } }>;
  artifacts: ProjectedArtifact[];
  signals: Array<{ kind: 'receiptBubble' | 'statusLabel'; text: string }>;
  orbs: Record<'alice' | 'jack' | 'quinn', 'blue' | 'gray' | 'yellow'>;
  hub: { counts: Array<{ category: string; count: number }> };
  latestHandoffs: Array<{ summary: string }>;
};

type StoryEngineContract = typeof storyModule & {
  createStoryRuntime: () => StoryRuntime;
  playStory: (runtime: StoryRuntime) => StoryRuntime;
  pauseStory: (runtime: StoryRuntime) => StoryRuntime;
  resumeStory: (runtime: StoryRuntime) => StoryRuntime;
  advanceStoryWaypoint: (runtime: StoryRuntime, options?: { reducedMotion?: boolean }) => StoryRuntime;
  advanceStoryState: (runtime: StoryRuntime) => StoryRuntime;
  replayStory: () => StoryRuntime;
  getStoryFrame: (runtime: StoryRuntime | string) => ProjectedFrame;
};

const story = storyModule as StoryEngineContract;

function count(frame: ProjectedFrame, category: string) {
  return frame.hub.counts.find((item) => item.category === category)?.count;
}

function moveTo(state: string) {
  let runtime = story.createStoryRuntime();
  while (runtime.state !== state) runtime = story.advanceStoryState(runtime);
  return runtime;
}

describe('Task 6 generic office story engine', () => {
  it('pauses waypoint movement and resumes from the same actor coordinate', () => {
    let runtime = story.playStory(story.createStoryRuntime());
    runtime = story.advanceStoryState(runtime);
    runtime = story.advanceStoryWaypoint(runtime);
    const beforePause = story.getStoryFrame(runtime);
    const paused = story.pauseStory(runtime);
    const afterPausedTick = story.advanceStoryWaypoint(paused);

    expect(paused.playbackStatus).toBe('paused');
    expect(afterPausedTick).toEqual(paused);
    expect(story.getStoryFrame(afterPausedTick).actors.find((actor) => actor.id === 'alice')?.coordinate).toEqual(
      beforePause.actors.find((actor) => actor.id === 'alice')?.coordinate,
    );

    const resumed = story.resumeStory(paused);
    expect(resumed.playbackStatus).toBe('playing');
    expect(resumed.waypointIndex).toBe(paused.waypointIndex);
    expect(story.advanceStoryWaypoint(resumed).waypointIndex).toBeGreaterThan(resumed.waypointIndex);
  });

  it('reaches complete only at QA Testing and replay restores all initial story evidence', () => {
    let runtime = story.playStory(story.createStoryRuntime());
    while (runtime.state !== 'qa-testing') runtime = story.advanceStoryState(runtime);

    expect(runtime.playbackStatus).toBe('complete');

    const replayed = story.replayStory();
    const frame = story.getStoryFrame(replayed);
    expect(replayed).toMatchObject({ state: 'ready', playbackStatus: 'idle' });
    expect(count(frame, 'prd')).toBe(1);
    expect(count(frame, 'feature')).toBe(2);
    expect(frame.latestHandoffs.some((handoff) => handoff.summary.includes('Alice submitted Login Requirement PRD'))).toBe(false);
    expect(frame.latestHandoffs.some((handoff) => handoff.summary.includes('Jack accepted Login Requirement PRD'))).toBe(false);
  });

  it('uses the specified Task 5 Orb semantics before Feature work begins', () => {
    const checks: Array<[string, 'blue' | 'gray' | 'yellow', 'blue' | 'gray' | 'yellow']> = [
      ['ready', 'yellow', 'gray'],
      ['pm-delivering', 'gray', 'gray'],
      ['pm-returning', 'gray', 'gray'],
      ['dev-notified', 'gray', 'yellow'],
      ['dev-collecting', 'gray', 'gray'],
      ['dev-returning', 'gray', 'gray'],
      ['dev-coding', 'gray', 'blue'],
    ];

    for (const [state, alice, jack] of checks) {
      const frame = story.getStoryFrame(moveTo(state));
      expect(frame.orbs.alice).toBe(alice);
      expect(frame.orbs.jack).toBe(jack);
    }
  });

  it('projects Login Feature through Jack, Hub, Quinn, and Quinn desk with a single actor instance', () => {
    const expected: Array<[string, ProjectedArtifact['location'], string | undefined]> = [
      ['feature-ready', 'desk', 'dev-jack'],
      ['dev-delivering-feature', 'carrier', 'jack'],
      ['feature-stored', 'hub', undefined],
      ['qa-collecting', 'hub', undefined],
      ['qa-returning', 'carrier', 'quinn'],
      ['qa-received', 'desk', 'qa-quinn'],
    ];

    for (const [state, location, owner] of expected) {
      const frame = story.getStoryFrame(moveTo(state));
      const feature = frame.artifacts.find((artifact) => artifact.id === 'login-feature-v1');
      expect(feature).toMatchObject({ category: 'feature', location });
      if (location === 'carrier') expect(feature?.carrierId).toBe(owner);
      if (location === 'desk') expect(feature?.deskId).toBe(owner);
      expect(frame.actors.filter((actor) => actor.id === 'jack')).toHaveLength(1);
      expect(frame.actors.filter((actor) => actor.id === 'quinn')).toHaveLength(1);
    }
  });

  it('changes the Hub Feature count only when the Feature is stored and limits receipt/status signals to their states', () => {
    const ready = story.getStoryFrame(moveTo('ready'));
    const delivering = story.getStoryFrame(moveTo('dev-delivering-feature'));
    const stored = story.getStoryFrame(moveTo('feature-stored'));
    const notified = story.getStoryFrame(moveTo('qa-notified'));
    const testing = story.getStoryFrame(moveTo('qa-testing'));

    expect(count(ready, 'feature')).toBe(2);
    expect(count(delivering, 'feature')).toBe(2);
    expect(count(stored, 'feature')).toBe(3);
    expect(notified.signals.some((signal) => signal.kind === 'receiptBubble' && signal.text === '收到 Feature')).toBe(true);
    expect(stored.signals.some((signal) => signal.kind === 'receiptBubble')).toBe(false);
    expect(testing.signals.some((signal) => signal.kind === 'statusLabel' && signal.text === 'Testing...')).toBe(true);
    expect(notified.signals.some((signal) => signal.text === 'Testing...')).toBe(false);
  });

  it('projects Feature evidence and statuses for submission, receipt, and testing', () => {
    expect(story.getStoryFrame(moveTo('feature-stored')).latestHandoffs[0]?.summary).toBe('Jack submitted Login Feature to Artifact Hub');
    expect(story.getStoryFrame(moveTo('qa-received')).latestHandoffs[0]?.summary).toBe('Quinn accepted Login Feature from Artifact Hub');
    expect(story.storyScenarioForState('dev-coding' as never).artifacts.find((artifact) => artifact.id === 'login-feature-v1')?.status).toBe('In Progress');
    expect(story.storyScenarioForState('feature-ready' as never).artifacts.find((artifact) => artifact.id === 'login-feature-v1')?.status).toBe('Ready for Submission');
    expect(story.storyScenarioForState('feature-stored' as never).artifacts.find((artifact) => artifact.id === 'login-feature-v1')?.acceptedBy).toBe('Pending');
    expect(story.storyScenarioForState('qa-received' as never).artifacts.find((artifact) => artifact.id === 'login-feature-v1')?.acceptedBy).toBe('Quinn');
    expect(story.storyScenarioForState('qa-testing' as never).artifacts.find((artifact) => artifact.id === 'login-feature-v1')?.status).toBe('Testing');
  });

  it('keeps the Dev in-progress metric aligned with its expandable artifact list', () => {
    const scenarioAt = (state: string) => story.storyScenarioForState(state as never);
    const inProgressIds = (state: string) => scenarioAt(state)
      .workspaces.find((workspace) => workspace.workspaceId === 'dev-office')!
      .todayOutput.find((metric) => metric.label === 'Features In Progress')!
      .artifactIds;
    const statusesFor = (state: string) => {
      const scenario = scenarioAt(state);
      return inProgressIds(state).map((id) => scenario.artifacts.find((artifact) => artifact.id === id)?.status);
    };

    expect(inProgressIds('dev-coding')).toContain('login-feature-v1');
    expect(statusesFor('dev-coding')).toEqual(['In Progress', 'In Progress', 'In Progress']);
    expect(inProgressIds('feature-ready')).not.toContain('login-feature-v1');
    expect(statusesFor('feature-ready')).toEqual(['In Progress', 'In Progress', 'In Progress']);
  });
});
