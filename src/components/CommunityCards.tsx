import { Card } from './Card';
import type { Card as CardType } from '../game/deck';

interface CommunityCardsProps {
  cards: CardType[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function CommunityCards({ cards, selectedIds, onSelect, disabled }: CommunityCardsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-amber-600 uppercase tracking-widest">Community Cards</div>
      <div className="flex gap-2 p-3 rounded-xl border border-amber-900/40 bg-black/20">
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            selected={selectedIds.includes(card.id)}
            onClick={() => onSelect(card.id)}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="text-xs text-amber-800">Shared — play these with your hand</div>
    </div>
  );
}
