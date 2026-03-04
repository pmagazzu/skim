import { useState } from 'react';
import type { Card } from '../game/deck';
import { rankName, suitSymbol, isRed, createDeck } from '../game/deck';
import { HAND_NAMES } from '../game/hands';
import type { HandRankValue } from '../game/hands';
import { SCORE_TABLE, handBaseAtLevel } from '../game/scoring';

interface DeckViewerProps {
  deck: Card[];
  hand: Card[];
  community: Card[];
  playedCardIds: string[];
  handLevels?: Record<HandRankValue, number>;
  onClose: () => void;
}

function MiniCard({ card, dim, label }: { card: Card; dim?: boolean; label?: string }) {
  const red = isRed(card.suit);
  return (
    <div style={{
      width: 36, height: 50, borderRadius: 4,
      background: dim ? '#111' : 'linear-gradient(145deg,#fdfaf3,#f0ead8)',
      border: `1.5px solid ${dim ? '#2a2a2a' : red ? '#b91c1c' : '#374151'}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 0, position: 'relative',
      opacity: dim ? 0.25 : 1,
      flexShrink: 0,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ fontSize: 11, fontWeight: 900, lineHeight: 1, color: dim ? '#333' : red ? '#b91c1c' : '#111', fontFamily: "'Orbitron',monospace" }}>
        {rankName(card.rank)}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1, color: dim ? '#333' : red ? '#b91c1c' : '#111' }}>
        {suitSymbol(card.suit)}
      </div>
      {label && (
        <div style={{
          position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
          fontSize: 8, whiteSpace: 'nowrap', color: '#ca8a04',
          fontFamily: "'VT323',monospace",
        }}>{label}</div>
      )}
    </div>
  );
}

function Section({ title, color, cards, playedIds }: { title: string; color: string; cards: Card[]; playedIds?: Set<string> }) {
  if (cards.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 9, color, letterSpacing: '0.1em', marginBottom: 8 }}>
        {title} <span style={{ color: '#555', fontSize: 8 }}>({cards.length})</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {cards.map(c => (
          <MiniCard key={c.id} card={c} dim={playedIds?.has(c.id)} />
        ))}
      </div>
    </div>
  );
}

export function DeckViewer({ deck, hand, community, playedCardIds, handLevels, onClose }: DeckViewerProps) {
  const [tab, setTab] = useState<'cards' | 'hands'>('cards');
  const playedSet = new Set(playedCardIds);

  // Build full 52-card reference to show played cards
  const allCards = createDeck();
  const knownIds = new Set([
    ...deck.map(c => c.id),
    ...hand.map(c => c.id),
    ...community.map(c => c.id),
  ]);
  // Played = cards that existed but are no longer in any pile
  // Use playedCardIds directly for accuracy
  const playedCards = allCards.filter(c => playedSet.has(c.id));

  const sort = (cards: Card[]) => [...cards].sort((a, b) => b.rank - a.rank || a.suit.localeCompare(b.suit));

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 80,
    }} onClick={onClose}>
      <div style={{
        background: '#0d0a07',
        border: '1px solid #3a2e1e',
        borderRadius: 12,
        padding: '20px 24px',
        width: 'min(740px, 94vw)',
        maxHeight: '88vh',
        overflowY: 'auto',
        boxShadow: '0 0 40px rgba(0,0,0,0.8)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 28, color: '#ca8a04', letterSpacing: '0.1em' }}>
            DECK VIEWER
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid #3a2e1e', borderRadius: 6,
            color: '#6b5a3e', cursor: 'pointer', padding: '4px 10px',
            fontFamily: "'VT323',monospace", fontSize: 16,
          }}>✕ CLOSE</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['cards', 'hands'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: "'Press Start 2P',monospace", fontSize: 8,
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              background: tab === t ? '#92400e' : 'transparent',
              border: `1px solid ${tab === t ? '#ca8a04' : '#3a2e1e'}`,
              color: tab === t ? '#fde68a' : '#6b5a3e',
            }}>{t === 'cards' ? 'DECK' : 'HANDS'}</button>
          ))}
        </div>

        {tab === 'cards' && (
          <>
            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontFamily: "'VT323',monospace", fontSize: 15, color: '#6b5a3e', flexWrap: 'wrap' }}>
              <span>🃏 Draw: <span style={{ color: '#ca8a04' }}>{deck.length}</span></span>
              <span>✋ Hand: <span style={{ color: '#fbbf24' }}>{hand.length}</span></span>
              <span>🟢 Community: <span style={{ color: '#4ade80' }}>{community.length}</span></span>
              <span>💨 Played: <span style={{ color: '#6b7280' }}>{playedCards.length}</span></span>
              {(() => { const modCount = [...deck, ...hand, ...community].filter(c => c.modifier).length; return modCount > 0 ? <span>✨ Modified: <span style={{ color: '#a78bfa' }}>{modCount}</span></span> : null; })()}
            </div>
            <Section title="YOUR HAND" color="#fbbf24" cards={sort(hand)} />
            <Section title="COMMUNITY" color="#4ade80" cards={sort(community)} />
            <Section title="DRAW PILE" color="#ca8a04" cards={sort(deck)} />
            {playedCards.length > 0 && (
              <Section title="PLAYED / GONE" color="#4b5563" cards={sort(playedCards)} playedIds={playedSet} />
            )}
          </>
        )}

        {tab === 'hands' && (
          <div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: '#6b5a3e', marginBottom: 12 }}>
              HAND UPGRADES — tap in shop to level up
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([10,9,8,7,6,5,4,3,2,1] as HandRankValue[]).map(rank => {
                const level = handLevels?.[rank] ?? 1;
                const baseChips = handBaseAtLevel(rank, level);
                const nextChips = handBaseAtLevel(rank, level + 1);
                const baseEntry = SCORE_TABLE[rank];
                return (
                  <div key={rank} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: 6,
                    background: level > 1 ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${level > 1 ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#d1d5db', minWidth: 130 }}>
                        {HAND_NAMES[rank]}
                      </span>
                      {level > 1 && (
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#a78bfa' }}>Lv.{level}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: "'VT323',monospace", fontSize: 14 }}>
                      <span style={{ color: '#fbbf24' }}>{baseChips} chips</span>
                      <span style={{ color: '#4b5563' }}>×{baseEntry?.mult ?? 1} mult</span>
                      {level > 1 && (
                        <span style={{ color: '#6b7280', fontSize: 12 }}>next: {nextChips}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
