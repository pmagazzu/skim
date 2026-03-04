import { useEffect, useState } from 'react';
import type { PendingPackResult } from '../game/gameState';
import { rankName, suitSymbol } from '../game/deck';
import type { Card } from '../game/deck';

interface PackOpenModalProps {
  result: PendingPackResult;
  onConfirm: () => void;
}

const PACK_LABELS: Record<string, string> = {
  JUNK_PACK:     '🗑️ Bargain Bin',
  BULK_PACK:     '📦 Bulk Deal',
  STANDARD_PACK: '📦 Standard Pack',
  SUITED_PACK:   '♠️ Suited Stack',
  FACE_UPGRADE:  '⬆ Face Upgrade',
  PREMIUM_PACK:  '✨ Premium Pack',
  FLUSH_PACK:    '🌊 Flush Finder',
  PAIR_UPGRADE:  '👯 Pair Up',
  ROYAL_UPGRADE: '👑 Royal Upgrade',
  ACE_PACK:      '🎰 High Roller',
  GODHAND_PACK:  '✨ God Hand',
};

// Rarity-based colors
const PACK_COLORS: Record<string, string> = {
  JUNK_PACK:     '#6b7280', // gray — common
  BULK_PACK:     '#6b7280', // gray — common
  STANDARD_PACK: '#2563eb', // blue — uncommon
  SUITED_PACK:   '#2563eb', // blue — uncommon
  FACE_UPGRADE:  '#2563eb', // blue — uncommon
  PREMIUM_PACK:  '#7c3aed', // purple — rare
  FLUSH_PACK:    '#7c3aed', // purple — rare
  PAIR_UPGRADE:  '#7c3aed', // purple — rare
  ROYAL_UPGRADE: '#ca8a04', // gold — legendary
  ACE_PACK:      '#ca8a04', // gold — legendary
  GODHAND_PACK:  '#f59e0b', // bright gold — legendary
};

function MiniCard({ card, revealed, delay }: { card: Card; revealed: boolean; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const rank = rankName(card.rank);
  const suit = suitSymbol(card.suit);
  const isSpecial = card.rank >= 11; // J, Q, K, A

  return (
    <div
      style={{
        width: 54,
        height: 76,
        borderRadius: 6,
        border: `2px solid ${isSpecial ? '#ca8a04' : '#ccc'}`,
        background: revealed && show ? 'linear-gradient(145deg, #fdfaf3, #f0ead8)' : '#1a1a2e',
        boxShadow: revealed && show && isSpecial ? '0 0 14px rgba(202,138,4,0.6)' : '0 2px 8px rgba(0,0,0,0.5)',
        transform: revealed && show ? 'rotateY(0deg) scale(1)' : 'rotateY(90deg) scale(0.9)',
        transition: `transform 0.35s ease ${delay}ms, background 0.1s ${delay}ms, box-shadow 0.3s ${delay}ms`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {revealed && show ? (
        <>
          <div style={{ color: isRed ? '#b91c1c' : '#1c1917', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{rank}</div>
          <div style={{ color: isRed ? '#b91c1c' : '#1c1917', fontSize: 20, lineHeight: 1 }}>{suit}</div>
          {isSpecial && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(202,138,4,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
          )}
        </>
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: 'repeating-linear-gradient(45deg, #1a1a3e 0, #1a1a3e 4px, #12122a 4px, #12122a 8px)',
          borderRadius: 4,
        }} />
      )}
    </div>
  );
}

function UpgradeCard({ from, to, delay }: { from: Card; to: Card; delay: number }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), delay + 400);
    return () => clearTimeout(t);
  }, [delay]);

  function CardFace({ card, glow }: { card: Card; glow?: boolean }) {
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    return (
      <div style={{
        width: 54, height: 76, borderRadius: 6,
        border: `2px solid ${glow ? '#ca8a04' : '#d4c9a8'}`,
        background: 'linear-gradient(145deg, #fdfaf3, #f0ead8)',
        boxShadow: glow ? '0 0 16px rgba(202,138,4,0.7)' : '0 2px 6px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: isRed ? '#b91c1c' : '#1c1917', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{rankName(card.rank)}</div>
        <div style={{ color: isRed ? '#b91c1c' : '#1c1917', fontSize: 20, lineHeight: 1 }}>{suitSymbol(card.suit)}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: 54, height: 76 }}>
        {/* FROM card fades out */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          opacity: flipped ? 0 : 1,
          transform: flipped ? 'scale(0.8) translateY(-8px)' : 'scale(1)',
          transition: `opacity 0.25s ease ${delay}ms, transform 0.25s ease ${delay}ms`,
        }}>
          <CardFace card={from} />
        </div>
        {/* TO card rises in */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          opacity: flipped ? 1 : 0,
          transform: flipped ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(8px)',
          transition: `opacity 0.3s ease ${delay + 200}ms, transform 0.3s ease ${delay + 200}ms`,
        }}>
          <CardFace card={to} glow />
        </div>
      </div>
      {/* Arrow label */}
      <div style={{
        fontSize: 9, fontFamily: "'VT323', monospace",
        color: flipped ? '#ca8a04' : '#555',
        transition: `color 0.3s ${delay + 300}ms`,
      }}>
        {rankName(from.rank)}{suitSymbol(from.suit)} → {rankName(to.rank)}{suitSymbol(to.suit)}
      </div>
    </div>
  );
}

export function PackOpenModal({ result, onConfirm }: PackOpenModalProps) {
  const [opened, setOpened] = useState(false);
  const [done, setDone] = useState(false);
  const color = PACK_COLORS[result.packType] ?? '#ca8a04';

  const cardCount = result.kind === 'add'
    ? (result.addedCards?.length ?? 0)
    : (result.upgrades?.length ?? 0);
  const revealDuration = cardCount * 220 + 600;

  useEffect(() => {
    if (result.kind === 'upgrade') {
      // Auto-open upgrades after a short pause
      const t = setTimeout(() => setOpened(true), 300);
      return () => clearTimeout(t);
    }
  }, [result.kind]);

  useEffect(() => {
    if (opened || result.kind === 'upgrade') {
      const t = setTimeout(() => setDone(true), revealDuration);
      return () => clearTimeout(t);
    }
  }, [opened, result.kind, revealDuration]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 60,
    }}>
      <div style={{
        background: '#0d0a07',
        border: `1px solid ${color}55`,
        borderRadius: 16,
        padding: '28px 32px',
        minWidth: 320,
        maxWidth: '92vw',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        boxShadow: `0 0 40px ${color}33`,
      }}>
        <div style={{
          fontFamily: "'VT323', monospace",
          fontSize: 26,
          color,
          letterSpacing: '0.12em',
          textShadow: `0 0 10px ${color}88`,
        }}>
          {PACK_LABELS[result.packType]}
        </div>

        {/* ADD pack — show pack, click to open */}
        {result.kind === 'add' && (
          <>
            {!opened ? (
              <div
                onClick={() => setOpened(true)}
                style={{
                  width: 90, height: 126, borderRadius: 10,
                  background: `linear-gradient(135deg, ${color}33, #1a1a2e)`,
                  border: `2px solid ${color}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', gap: 6,
                  boxShadow: `0 0 24px ${color}55`,
                  animation: 'pack-pulse 1.2s ease-in-out infinite',
                }}
              >
                <div style={{ fontSize: 36 }}>🃏</div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color, letterSpacing: '0.1em' }}>OPEN</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {result.addedCards?.map((card, i) => (
                  <MiniCard key={card.id} card={card} revealed delay={i * 220} />
                ))}
              </div>
            )}
            {opened && (
              <div style={{ fontSize: 11, color: '#6b5a3e', fontFamily: "'VT323', monospace", letterSpacing: '0.1em' }}>
                {result.addedCards?.length} cards added to your deck
              </div>
            )}
          </>
        )}

        {/* UPGRADE pack — show card flips */}
        {result.kind === 'upgrade' && (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {result.upgrades?.map((upg, i) => (
                <UpgradeCard key={upg.from.id} from={upg.from} to={upg.to} delay={i * 200} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#6b5a3e', fontFamily: "'VT323', monospace", letterSpacing: '0.1em' }}>
              {result.upgrades?.length} cards upgraded in your deck
            </div>
          </>
        )}

        <button
          onClick={onConfirm}
          disabled={!done}
          style={{
            fontFamily: "'VT323', monospace",
            fontSize: 18,
            letterSpacing: '0.1em',
            padding: '8px 32px',
            borderRadius: 8,
            border: `1px solid ${done ? color : '#333'}`,
            background: done ? `${color}22` : 'transparent',
            color: done ? color : '#444',
            cursor: done ? 'pointer' : 'default',
            transition: 'all 0.3s',
          }}
        >
          {done ? 'ADD TO DECK →' : '...'}
        </button>
      </div>
    </div>
  );
}
