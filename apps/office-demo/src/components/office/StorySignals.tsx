import { officeLayout } from '../../data/officeLayout';
import type { StorySignal } from '../../story/prdHandoffStory';
import { scenePointToRelativeStyle } from '../../utils/scenePlacement';

type StorySignalsProps = {
  signals: readonly StorySignal[];
};

export function StorySignals({ signals }: StorySignalsProps) {
  return (
    <>
      {signals.map((signal) => (
        <span
          aria-live={signal.kind === 'receiptBubble' ? 'polite' : undefined}
          className={signal.kind === 'receiptBubble' ? 'story-receipt-bubble' : 'story-status-label'}
          data-testid={signal.kind === 'receiptBubble' ? 'receipt-bubble' : 'story-status-label'}
          key={`${signal.kind}-${signal.text}`}
          style={scenePointToRelativeStyle(signal.anchor, officeLayout.scene)}
        >
          {signal.text}
        </span>
      ))}
    </>
  );
}
