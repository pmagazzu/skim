import type { Card as CardType } from '../game/deck';
import { rankName, suitSymbol, isRed } from '../game/deck';

interface CardProps {
  card: CardType;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  animDelay?: number;
}

export function Card({ card, selected, onClick, disabled, animDelay }: CardProps) {
  const red = isRed(card.suit);
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={[
        'relative card-face rounded-lg w-16 h-24 flex flex-col cursor-pointer select-none transition-all duration-150 deal-in',
        selected ? 'card-selected' : 'hover:-translate-y-1',
        disabled ? 'opacity-60 cursor-default' : '',
        red ? 'card-red' : 'card-black',
      ].join(' ')}
      style={animDelay !== undefined ? { animationDelay: `${animDelay}ms` } : undefined}
    >
      <div className="absolute top-1 left-1.5 text-xs font-bold leading-none">
        <div>{rankName(card.rank)}</div>
        <div>{suitSymbol(card.suit)}</div>
      </div>
      <div className="flex items-center justify-center flex-1 text-3xl">
        {suitSymbol(card.suit)}
      </div>
      <div className="absolute bottom-1 right-1.5 text-xs font-bold leading-none rotate-180">
        <div>{rankName(card.rank)}</div>
        <div>{suitSymbol(card.suit)}</div>
      </div>
    </div>
  );
}
