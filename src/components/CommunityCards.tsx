import { useEffect } from 'react';
import { Card } from './Card';
import type { Card as CardType } from '../game/deck';

interface CommunityCardsProps {
  cards: CardType[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  deckCount: number;
  newCardIds: string[];
  onClearNew: () => void;
}

function DeckPile({ count }: { count: number }) {
  const piles = Math.min(4, Math.ceil(count / 10));
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="relative w-10 h-14" title={`${count} cards remaining`}>
        {Array.from({ length: piles }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 rounded-md"
            style={{ transform: `translate(${(piles - 1 - i) * -1.5}px, ${(piles - 1 - i) * -1.5}px)` }}
          />
        ))}
        {count === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">∅</div>
        )}
      </div>
      <div className={[
        'text-xs font-bold chip-counter tabular-nums',
        count <= 5 ? 'text-red-500' : count <= 15 ? 'text-amber-500' : 'text-gray-500',
      ].join(' ')}>
        {count}
      </div>
    </div>
  );
}

export function CommunityCards({ cards, selectedIds, onSelect, disabled, deckCount, newCardIds, onClearNew }: CommunityCardsProps) {
  useEffect(() => {
    if (newCardIds.length === 0) return;
    const t = setTimeout(onClearNew, 3000);
    return () => clearTimeout(t);
  }, [newCardIds, onClearNew]);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="section-label">Community Cards</div>
        <div className="text-xs text-gray-700">— used cards are replaced from the deck</div>
      </div>
      <div className="flex items-center gap-3">
        {/* Cards */}
        <div className="flex gap-2 p-3 rounded-xl border border-amber-900/30 bg-black/20 relative">
          {cards.map(card => {
            const isNew = newCardIds.includes(card.id);
            return (
              <div key={card.id} className="relative">
                {isNew && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-xs font-black text-emerald-400 animate-bounce pointer-events-none">
                    NEW
                  </div>
                )}
                <div className={isNew ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-black rounded-lg' : ''}>
                  <Card
                    card={card}
                    selected={selectedIds.includes(card.id)}
                    onClick={() => onSelect(card.id)}
                    disabled={disabled}
                  />
                </div>
              </div>
            );
          })}
          {/* Empty slots if deck ran out */}
          {Array.from({ length: Math.max(0, 3 - cards.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-16 h-24 border border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-700 text-xs">
              —
            </div>
          ))}
        </div>

        {/* Arrow + deck pile */}
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-lg">←</span>
          <DeckPile count={deckCount} />
        </div>
      </div>
    </div>
  );
}
