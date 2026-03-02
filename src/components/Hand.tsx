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
    <div className="flex flex-col items-center gap-3">
      {/* Cards row */}
      <div className="flex gap-2 flex-wrap justify-center">
        {hand.map(card => (
          <Card
            key={card.id}
            card={card}
            selected={selectedIds.includes(card.id)}
            onClick={() => onSelect(card.id)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Hand preview */}
      <div className="h-8 flex items-center gap-3">
        {handResult && selectedIds.length > 0 ? (
          <>
            <span className="text-yellow-300 font-semibold">{handResult.name}</span>
            <span className="text-green-400 font-bold chip-glow">
              +{chipPreview} chips
              {scratchMultiplier > 1 && (
                <span className="text-orange-400 ml-1">×{scratchMultiplier} SCRATCH!</span>
              )}
            </span>
          </>
        ) : (
          <span className="text-gray-500 text-sm">Select cards to play a hand (1–5)</span>
        )}
      </div>

      {/* Play button */}
      <button
        onClick={canPlay ? onPlay : undefined}
        disabled={!canPlay}
        className={[
          'px-8 py-2 rounded font-bold text-lg tracking-wider transition-all',
          canPlay
            ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg hover:shadow-yellow-500/50 cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-default',
        ].join(' ')}
      >
        PLAY HAND
      </button>
    </div>
  );
}
