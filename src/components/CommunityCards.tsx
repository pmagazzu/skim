import { useEffect, useMemo } from 'react';
import { Card } from './Card';
import type { Card as CardType } from '../game/deck';

type SortMode = 'dealt' | 'high' | 'low' | 'suit';
const SUIT_ORDER: Record<string, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
function sortCards(cards: CardType[], mode: SortMode): CardType[] {
  const c = [...cards];
  if (mode === 'high') return c.sort((a, b) => b.rank - a.rank);
  if (mode === 'low')  return c.sort((a, b) => a.rank - b.rank);
  if (mode === 'suit') return c.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || b.rank - a.rank);
  return c;
}

interface CommunityCardsProps {
  cards: CardType[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  deckCount: number;
  newCardIds: string[];
  onClearNew: () => void;
  onDeckClick?: () => void;
  sortMode?: SortMode;
}

function DeckPile({ count, onClick }: { count: number; onClick?: () => void }) {
  const piles = Math.min(4, Math.ceil(count / 10));
  return (
    <div
      className="flex flex-col items-center gap-1 select-none"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={onClick ? `${count} cards remaining — click to view deck` : `${count} cards remaining`}
    >
      <div className="relative w-10 h-14" style={{ filter: onClick ? 'drop-shadow(0 0 4px rgba(202,138,4,0.4))' : 'none' }}>
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

export function CommunityCards({ cards, selectedIds, onSelect, disabled, deckCount, newCardIds, onClearNew, onDeckClick, sortMode }: CommunityCardsProps) {
  useEffect(() => {
    if (newCardIds.length === 0) return;
    const t = setTimeout(onClearNew, 3000);
    return () => clearTimeout(t);
  }, [newCardIds, onClearNew]);

  const sortedCards = useMemo(() => sortCards(cards, sortMode ?? 'dealt'), [cards, sortMode]);
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#4b5563', letterSpacing: '0.1em' }}>
        COMMUNITY — used cards auto-replace
      </div>
      <div className="flex items-center justify-center gap-2 w-full">
        {/* Cards */}
        <div className="flex gap-1.5 p-3 rounded-xl border border-amber-900/30 bg-black/20">
          {sortedCards.map(card => {
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
          {Array.from({ length: Math.max(0, 3 - cards.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ width: 68, height: 96, border: '1px dashed #374151', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 18 }}>
              —
            </div>
          ))}
        </div>

        {/* Deck pile */}
        <div className="flex flex-col items-center gap-1">
          <DeckPile count={deckCount} onClick={onDeckClick} />
        </div>
      </div>
    </div>
  );
}
