import { useEffect } from 'react';
import type { Selection } from '../../types/selection';
import { StoryControllerShell } from '../story/StoryControllerShell';
import { getInspectorTitle, InspectorContent } from './InspectorContent';

type InspectorShellProps = {
  selection: Selection;
  mobileOpen: boolean;
  onClose: () => void;
  onSelectionChange: (selection: Selection) => void;
};

export function InspectorShell({ mobileOpen, onClose, onSelectionChange, selection }: InspectorShellProps) {
  const title = getInspectorTitle(selection);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileOpen) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen, onClose]);

  return (
    <aside
      aria-label={title}
      className="inspector-shell"
      data-mobile-open={mobileOpen}
      role="complementary"
    >
      <div className="inspector-shell__header">
        <p className="inspector-shell__eyebrow">Demo Mode</p>
        <button aria-label="Close Inspector" className="inspector-shell__close" onClick={onClose} type="button">×</button>
      </div>
      <div className="inspector-shell__content">
        <InspectorContent onSelectionChange={onSelectionChange} selection={selection} />
      </div>
      <footer className="inspector-shell__footer"><StoryControllerShell /></footer>
    </aside>
  );
}
