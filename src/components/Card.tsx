import type { Card as CardType } from '../game/deck';
import { rankName, suitSymbol, isRed, MODIFIER_LABEL } from '../game/deck';

const MODIFIER_COLOR: Record<string, string> = {
  POLISHED: '#a5f3fc', SCARRED: '#fca5a5', CHARGED: '#fde68a',
  HOT: '#fb923c', WILD: '#c4b5fd', VOLATILE: '#f87171',
  GHOST: '#d1d5db', CURSED: '#a78bfa', MIMIC: '#6ee7b7',
};

interface CardProps {
  card: CardType;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  animDelay?: number;
  small?: boolean; // for community cards
}

export function Card({ card, selected, onClick, disabled, animDelay, small }: CardProps) {
  const red = isRed(card.suit);
  const rank = rankName(card.rank);
  const suit = suitSymbol(card.suit);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={[
        'relative card-face rounded-lg flex flex-col cursor-pointer select-none transition-all duration-150 deal-in',
        small ? 'w-14 h-20' : 'w-[72px] h-[100px] sm:w-20 sm:h-28',
        selected ? 'card-selected' : 'hover:-translate-y-1',
        disabled ? 'opacity-60 cursor-default' : '',
        red ? 'card-red' : 'card-black',
      ].join(' ')}
      style={animDelay !== undefined ? { animationDelay: `${animDelay}ms` } : undefined}
    >
      {/* Top-left corner */}
      <div className={[
        'absolute top-1 left-1.5 font-black leading-tight',
        small ? 'text-sm' : 'text-base sm:text-lg',
      ].join(' ')}
        style={{ fontFamily: "'Orbitron', monospace", lineHeight: 1.1 }}
      >
        <div>{rank}</div>
        <div style={{ fontSize: small ? '0.75em' : '0.8em', marginTop: -1 }}>{suit}</div>
      </div>

      {/* Center suit — big */}
      <div className={[
        'flex items-center justify-center flex-1',
        small ? 'text-3xl' : 'text-4xl sm:text-5xl',
      ].join(' ')}
        style={{ marginTop: 4 }}
      >
        {suit}
      </div>

      {/* Bottom-right corner — rotated */}
      <div className={[
        'absolute bottom-1 right-1.5 font-black leading-tight rotate-180',
        small ? 'text-sm' : 'text-base sm:text-lg',
      ].join(' ')}
        style={{ fontFamily: "'Orbitron', monospace", lineHeight: 1.1 }}
      >
        <div>{rank}</div>
        <div style={{ fontSize: small ? '0.75em' : '0.8em', marginTop: -1 }}>{suit}</div>
      </div>

      {/* Modifier badge */}
      {card.modifier && (
        <div title={MODIFIER_LABEL[card.modifier]} style={{
          position: 'absolute', top: -6, right: -6,
          background: MODIFIER_COLOR[card.modifier] ?? '#fff',
          borderRadius: '50%', width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, boxShadow: `0 0 6px ${MODIFIER_COLOR[card.modifier] ?? '#fff'}88`,
          border: '1px solid rgba(0,0,0,0.3)',
          zIndex: 10,
        }}>
          {MODIFIER_LABEL[card.modifier].split(' ')[0]}
        </div>
      )}
    </div>
  );
}
