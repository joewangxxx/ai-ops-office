import { useEffect, useState } from 'react';
import { InspectorShell } from '../components/inspector/InspectorShell';
import { OfficeScene } from '../components/office/OfficeScene';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import {
  advanceStoryState,
  advanceStoryWaypoint,
  createStoryRuntime,
  getStoryFrame,
  isMotionComplete,
  manualNextStory,
  pauseStory,
  playStory,
  previousStory,
  replayStory,
  storyScenarioForState,
} from '../story/prdHandoffStory';
import { officeSelection, type Selection } from '../types/selection';

export function App() {
  const [selection, setSelection] = useState<Selection>(officeSelection);
  const [runtime, setRuntime] = useState(createStoryRuntime);
  const prefersReducedMotion = usePrefersReducedMotion();
  const story = getStoryFrame(runtime);
  const scenario = storyScenarioForState(runtime);
  const motionDurationMs = story.motion?.transitionDurationMs;

  useEffect(() => {
    if (runtime.playbackStatus !== 'playing') return undefined;

    if (story.motion && !isMotionComplete(runtime)) {
      const timeout = window.setTimeout(
        () => setRuntime((current) => advanceStoryWaypoint(current, { reducedMotion: prefersReducedMotion })),
        prefersReducedMotion ? 0 : story.motion.transitionDurationMs,
      );
      return () => window.clearTimeout(timeout);
    }

    if (!runtime.autoAdvance) {
      const timeout = window.setTimeout(() => setRuntime((current) => pauseStory(current)), 0);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(
      () => setRuntime((current) => advanceStoryState(current)),
      prefersReducedMotion ? 700 : story.autoAdvanceDelayMs,
    );
    return () => window.clearTimeout(timeout);
  }, [motionDurationMs, prefersReducedMotion, runtime, story.autoAdvanceDelayMs]);

  return (
    <main className="app-shell">
      <section aria-label="Office scene stage" className="office-stage">
        <OfficeScene onSelectionChange={setSelection} prefersReducedMotion={prefersReducedMotion} story={story} />
      </section>
      <InspectorShell
        hubCounts={story.hub.counts}
        mobileOpen={selection.kind !== 'office'}
        onClose={() => setSelection(officeSelection)}
        onSelectionChange={setSelection}
        onStoryNext={() => setRuntime((current) => manualNextStory(current))}
        onStoryPlayPause={() => setRuntime((current) => current.playbackStatus === 'playing' ? pauseStory(current) : playStory(current))}
        onStoryPrevious={() => setRuntime((current) => previousStory(current))}
        onStoryReplay={() => setRuntime(replayStory())}
        playbackStatus={runtime.playbackStatus}
        scenario={scenario}
        selection={selection}
        storyState={runtime.state}
      />
    </main>
  );
}
