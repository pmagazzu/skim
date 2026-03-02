import { Card } from './Card';
import type { Card as CardType } from '../game/deck';
import type { HandResult } from '../game/hands';

interface HandProps {
  hand: CardType[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onPlay: () => void;
  handResult: HandResult | null;
  chipPreview: number;
  disabled?: boolean;
  scratchMultiplier: number;
}

export function Hand({ hand, selectedIds, onSelect, onPlay, handResult, chipPreview, disabled, scratchMultiplier }: HandProps) {
  const canPlay = selectedIds.length >= 1 && selectedIds.length <= 5 && !disabled;

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
            <span className="gold-glow font-bold">
              +{chipPreview.toLocaleString()} chips
            </span>
            {scratchMultiplier > 1 && (
              <span className="text-orange-400 text-sm font-bold">×{scratchMultiplier} SCRATCH!</span>
            )}
          </>
        ) : (
          <span className="text-gray-600 text-sm">Select 1–5 cards to play</span>
        )}
      </div>

      <button
        onClick={canPlay ? onPlay : undefined}
        disabled={!canPlay}
        className="btn-primary text-base px-12"
      >
        PLAY HAND
      </button>
    </div>
  );
}
