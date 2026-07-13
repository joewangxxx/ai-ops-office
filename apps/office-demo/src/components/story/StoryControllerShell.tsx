export function StoryControllerShell() {
  return (
    <section aria-label="Story controller" className="story-controller-shell">
      <span className="story-controller-shell__status">Auto Demo</span>
      <div aria-label="Unavailable playback controls" className="story-controller-shell__controls">
        <button aria-label="Previous scene" disabled type="button">‹</button>
        <button aria-label="Play demo" disabled type="button">▶</button>
        <button aria-label="Next scene" disabled type="button">›</button>
      </div>
    </section>
  );
}
