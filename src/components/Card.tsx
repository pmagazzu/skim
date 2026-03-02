import type { Card as CardType } from '../game/deck';
import { rankName, suitSymbol, isRed } from '../game/deck';

interface CardProps {
  card: CardType;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function Card({ card, selected, onClick, disabled }: CardProps) {
  const red = isRed(card.suit);
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={[
        'relative bg-white rounded-lg border-2 w-16 h-24 flex flex-col cursor-pointer select-none transition-all duration-150',
        selected ? 'card-selected border-yellow-400' : 'border-gray-300 hover:border-gray-400',
        disabled ? 'opacity-60 cursor-default' : '',
        red ? 'card-red' : 'card-black',
      ].join(' ')}
      style={selected ? { transform: 'translateY(-8px) scale(1.05)' } : undefined}
    >
      <div className="absolute top-1 left-1.5 text-xs font-bold leading-none">
        <div>{rankName(card.rank)}</div>
        <div>{suitSymbol(card.suit)}</div>
      </div>
      <div className="flex items-center justify-center flex-1 text-2xl">
        {suitSymbol(card.suit)}
      </div>
      <div className="absolute bottom-1 right-1.5 text-xs font-bold leading-none rotate-180">
        <div>{rankName(card.rank)}</div>
        <div>{suitSymbol(card.suit)}</div>
      </div>
    </div>
  );
}
