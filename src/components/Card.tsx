import { useState } from 'react';
import type { Card as CardType } from '../game/deck';
import { rankName, suitSymbol, isRed, MODIFIER_LABEL, MODIFIER_DESC } from '../game/deck';

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
  const [showModTooltip, setShowModTooltip] = useState(false);
  const red = isRed(card.suit);
  const rank = rankName(card.rank);
  const suit = suitSymbol(card.suit);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={[
        'relative card-face rounded-lg flex flex-col cursor-pointer select-none transition-all duration-150 deal-in',
        small ? 'w-12 h-[72px]' : 'w-[64px] h-[92px]',
        selected ? 'card-selected' : 'hover:-translate-y-1',
        disabled ? 'opacity-60 cursor-default' : '',
        red ? 'card-red' : 'card-black',
      ].join(' ')}
      style={animDelay !== undefined ? { animationDelay: `${animDelay}ms` } : undefined}
    >
      {/* Top-left corner */}
      <div className={[
        'absolute top-1 left-1.5 font-black leading-tight',
        small ? 'text-xs' : 'text-base',
      ].join(' ')}
        style={{ fontFamily: "'Orbitron', monospace", lineHeight: 1.1 }}
      >
        <div>{rank}</div>
        <div style={{ fontSize: '0.8em', marginTop: -1 }}>{suit}</div>
      </div>

      {/* Center suit — big */}
      <div className={[
        'flex items-center justify-center flex-1',
        small ? 'text-2xl' : 'text-3xl',
      ].join(' ')}
        style={{ marginTop: 4 }}
      >
        {suit}
      </div>

      {/* Bottom-right corner — rotated */}
      <div className={[
        'absolute bottom-1 right-1.5 font-black leading-tight rotate-180',
        small ? 'text-xs' : 'text-base',
      ].join(' ')}
        style={{ fontFamily: "'Orbitron', monospace", lineHeight: 1.1 }}
      >
        <div>{rank}</div>
        <div style={{ fontSize: '0.8em', marginTop: -1 }}>{suit}</div>
      </div>

      {/* Modifier badge — tap to see details */}
      {card.modifier && (
        <div
          onClick={e => { e.stopPropagation(); setShowModTooltip(v => !v); }}
          style={{
            position: 'absolute', top: -6, right: -6,
            background: MODIFIER_COLOR[card.modifier] ?? '#fff',
            borderRadius: '50%', width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, boxShadow: `0 0 8px ${MODIFIER_COLOR[card.modifier] ?? '#fff'}aa`,
            border: '1px solid rgba(0,0,0,0.3)',
            zIndex: 10, cursor: 'pointer',
          }}>
          {MODIFIER_LABEL[card.modifier].split(' ')[0]}
        </div>
      )}
      {/* Modifier tooltip */}
      {card.modifier && showModTooltip && (
        <div
          onClick={e => { e.stopPropagation(); setShowModTooltip(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 80, background: 'rgba(0,0,0,0.5)',
          }}>
          <div style={{
            background: '#1a1410', border: `1px solid ${MODIFIER_COLOR[card.modifier]}66`,
            borderRadius: 12, padding: '14px 18px', width: 260,
            boxShadow: `0 0 24px ${MODIFIER_COLOR[card.modifier]}44`,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: MODIFIER_COLOR[card.modifier], marginBottom: 4 }}>
              {MODIFIER_LABEL[card.modifier]}
            </div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#9ca3af', lineHeight: 1.5 }}>
              {MODIFIER_DESC[card.modifier]}
            </div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#4b5563', marginTop: 8, textAlign: 'center' }}>
              tap to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
