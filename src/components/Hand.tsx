import { Card } from './Card';
import type { Card as CardType } from '../game/deck';
import type { HandResult } from '../game/hands';

interface HandProps {
  hand: CardType[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onPlay: () => void;
  onDiscard: () => void;
  handResult: HandResult | null;
  chipPreview: number;
  disabled?: boolean;
  scratchMultiplier: number;
  handsLeft: number;
}

export function Hand({ hand, selectedIds, onSelect, onPlay, onDiscard, handResult, chipPreview, disabled, scratchMultiplier, handsLeft }: HandProps) {
  const canPlay = selectedIds.length >= 1 && selectedIds.length <= 5 && !disabled;
  const canDiscard = !disabled && handsLeft > 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="section-label">Your Hand</div>
      <div className="flex gap-2 flex-wrap justify-center">
        {hand.map((card, i) => (
          <Card
            key={card.id}
            card={card}
            selected={selectedIds.includes(card.id)}
            onClick={() => onSelect(card.id)}
            disabled={disabled}
            animDelay={i * 40}
          />
        ))}
      </div>

      {/* Preview */}
      <div className="h-8 flex items-center gap-3">
        {handResult && selectedIds.length > 0 ? (
          <>
            <span className="text-amber-300 font-semibold text-sm">{handResult.name}</span>
            <span className="gold-glow font-bold">+{chipPreview.toLocaleString()} chips</span>
            {scratchMultiplier > 1 && (
              <span className="text-orange-400 text-sm font-bold">×{scratchMultiplier}!</span>
            )}
          </>
        ) : (
          <span className="text-gray-600 text-sm">Select 1–5 cards to play</span>
        )}
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={canPlay ? onPlay : undefined}
          disabled={!canPlay}
          className="btn-primary text-base px-10"
        >
          PLAY HAND
        </button>
        <button
          onClick={canDiscard ? onDiscard : undefined}
          disabled={!canDiscard}
          title="Discard entire hand and redraw — costs 1 hand"
          className={[
            'btn-secondary text-sm px-4 py-2',
            !canDiscard ? 'opacity-30 cursor-default' : '',
          ].join(' ')}
        >
          DISCARD ↺
        </button>
      </div>

      {!canDiscard && handsLeft <= 1 && (
        <div className="text-xs text-red-600">Last hand — can't discard</div>
      )}
    </div>
  );
}
