import { useEffect, useState } from 'react';
import type { Card } from '../game/deck';
import { playForgeHit, playForgeReveal } from '../audio/sounds';
import { rankName, suitSymbol, isRed, MODIFIER_LABEL, MODIFIER_DESC } from '../game/deck';
import type { CardModifierValue } from '../game/deck';

const MODIFIER_COLOR: Record<string, string> = {
  POLISHED: '#a5f3fc', SCARRED: '#fca5a5', CHARGED: '#fde68a',
  HOT: '#fb923c', WILD: '#c4b5fd', VOLATILE: '#f87171',
  GHOST: '#d1d5db', CURSED: '#a78bfa', MIMIC: '#6ee7b7',
};

interface ForgeResultModalProps {
  card: Card;
  modifier: CardModifierValue;
  onDismiss: () => void;
}

export function ForgeResultModal({ card, modifier, onDismiss }: ForgeResultModalProps) {
  const [phase, setPhase] = useState<'show-card' | 'forge-flash' | 'reveal'>('show-card');
  const red = isRed(card.suit);
  const color = MODIFIER_COLOR[modifier] ?? '#fff';

  useEffect(() => {
    // Sequence: show card → flash forge → reveal with glow
    const t1 = setTimeout(() => {
      playForgeHit();
      setPhase('forge-flash');
    }, 700);
    const t2 = setTimeout(() => {
      playForgeReveal();
      setPhase('reveal');
    }, 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      onClick={phase === 'reveal' ? onDismiss : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        gap: 24,
      }}
    >
      {/* Title */}
      <div style={{
        fontFamily: "'VT323',monospace", fontSize: 32, color: '#ca8a04',
        letterSpacing: '0.14em',
        opacity: phase === 'show-card' ? 0 : 1,
        transition: 'opacity 0.4s',
      }}>
        🔨 FORGED!
      </div>

      {/* Card with forge effect */}
      <div style={{ position: 'relative' }}>
        {/* Forge glow ring — appears on flash */}
        <div style={{
          position: 'absolute', inset: -12,
          borderRadius: 20,
          background: `radial-gradient(ellipse, ${color}44 0%, transparent 70%)`,
          boxShadow: phase !== 'show-card' ? `0 0 40px ${color}88, 0 0 80px ${color}44` : 'none',
          opacity: phase === 'forge-flash' ? 1 : phase === 'reveal' ? 0.6 : 0,
          transition: 'opacity 0.3s, box-shadow 0.3s',
          pointerEvents: 'none',
        }} />

        {/* Animated forge sparks on flash */}
        {phase === 'forge-flash' && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
            {['✦','✦','✦','✦','✦','✦'].map((s, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 60}%`,
                left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 60}%`,
                color,
                fontSize: 18,
                animation: 'forge-spark 0.6s ease-out forwards',
                animationDelay: `${i * 60}ms`,
                opacity: 0,
              }}>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* The card */}
        <div style={{
          width: 90, height: 130,
          borderRadius: 10,
          background: 'linear-gradient(145deg, #fdfaf3, #f0ead8)',
          border: phase === 'reveal'
            ? `2px solid ${color}`
            : `1.5px solid ${red ? '#b91c1c' : '#374151'}`,
          boxShadow: phase === 'reveal'
            ? `0 0 0 1px ${color}88, 0 8px 24px rgba(0,0,0,0.6), 0 0 32px ${color}55`
            : '0 4px 16px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          transform: phase === 'forge-flash' ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.2s, box-shadow 0.4s, border-color 0.4s',
        }}>
          {/* Top-left */}
          <div style={{
            position: 'absolute', top: 6, left: 8,
            fontFamily: "'Orbitron',monospace", fontWeight: 900,
            fontSize: 14, color: red ? '#b91c1c' : '#111', lineHeight: 1.1,
          }}>
            <div>{rankName(card.rank)}</div>
            <div style={{ fontSize: 11 }}>{suitSymbol(card.suit)}</div>
          </div>

          {/* Center suit */}
          <div style={{ fontSize: 44, lineHeight: 1, color: red ? '#b91c1c' : '#111', marginTop: 4 }}>
            {suitSymbol(card.suit)}
          </div>

          {/* Bottom-right rotated */}
          <div style={{
            position: 'absolute', bottom: 6, right: 8,
            fontFamily: "'Orbitron',monospace", fontWeight: 900,
            fontSize: 14, color: red ? '#b91c1c' : '#111', lineHeight: 1.1,
            transform: 'rotate(180deg)',
          }}>
            <div>{rankName(card.rank)}</div>
            <div style={{ fontSize: 11 }}>{suitSymbol(card.suit)}</div>
          </div>

          {/* Modifier badge — appears on reveal */}
          {phase === 'reveal' && (
            <div style={{
              position: 'absolute', top: -10, right: -10,
              width: 28, height: 28, borderRadius: '50%',
              background: color,
              border: '2px solid #000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
              boxShadow: `0 0 16px ${color}cc`,
              animation: 'modifier-pop 0.4s cubic-bezier(0.34,1.8,0.64,1) both',
            }}>
              ✦
            </div>
          )}
        </div>
      </div>

      {/* Modifier name + description — appears on reveal */}
      {phase === 'reveal' && (
        <div style={{
          background: '#0d0a07',
          border: `1px solid ${color}55`,
          borderRadius: 14, padding: '16px 20px',
          width: 'min(300px, 88vw)',
          boxShadow: `0 0 24px ${color}22`,
          animation: 'forge-reveal-in 0.35s ease-out both',
        }}>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 26, color, marginBottom: 4 }}>
            {MODIFIER_LABEL[modifier]}
          </div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#9ca3af', lineHeight: 1.4 }}>
            {MODIFIER_DESC[modifier]}
          </div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: '#4b5563', marginTop: 10 }}>
            Applied to: <span style={{ color: '#d1d5db' }}>
              {rankName(card.rank)} of {card.suit}
            </span>
          </div>
        </div>
      )}

      {phase === 'reveal' && (
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#4b5563' }}>
          tap anywhere to close
        </div>
      )}

      <style>{`
        @keyframes forge-spark {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
        @keyframes modifier-pop {
          0%   { transform: scale(0) rotate(-180deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes forge-reveal-in {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
