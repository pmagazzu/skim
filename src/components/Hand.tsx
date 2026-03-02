import { useMemo } from 'react';
import { Card } from './Card';
import type { Card as CardType } from '../game/deck';
import type { HandResult } from '../game/hands';

type SortMode = 'dealt' | 'high' | 'low' | 'suit';

const SUIT_ORDER: Record<string, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };

function sortCards(cards: CardType[], mode: SortMode): CardType[] {
  const c = [...cards];
  if (mode === 'high') return c.sort((a, b) => b.rank - a.rank);
  if (mode === 'low')  return c.sort((a, b) => a.rank - b.rank);
  if (mode === 'suit') return c.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || b.rank - a.rank);
  return c; // 'dealt' = original order
}

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
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
}

export function Hand({ hand, selectedIds, onSelect, onPlay, onDiscard, handResult, chipPreview, disabled, scratchMultiplier, handsLeft, sortMode, onSortChange }: HandProps) {
  const canPlay = selectedIds.length >= 1 && selectedIds.length <= 5 && !disabled;
  const canDiscard = !disabled && handsLeft > 1;

  const sortedHand = useMemo(() => sortCards(hand, sortMode), [hand, sortMode]);

  const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
    { mode: 'dealt', label: 'Dealt' },
    { mode: 'high',  label: 'High→Low' },
    { mode: 'low',   label: 'Low→High' },
    { mode: 'suit',  label: 'Suit' },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Sort controls */}
      <div className="flex items-center gap-1">
        <span className="section-label mr-2">Sort:</span>
        {SORT_OPTIONS.map(o => (
          <button
            key={o.mode}
            onClick={() => onSortChange(o.mode)}
            className={[
              'text-xs px-2 py-1 rounded transition-all',
              sortMode === o.mode
                ? 'bg-amber-800/60 text-amber-300 border border-amber-700'
                : 'text-gray-600 hover:text-gray-400 border border-transparent',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {sortedHand.map((card, i) => (
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
