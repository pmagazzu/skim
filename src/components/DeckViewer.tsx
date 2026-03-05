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

function MiniCard({ card, dim }: { card: Card; dim?: boolean }) {
  const red = isRed(card.suit);
  return (
    <div style={{
      width: 38, height: 54, borderRadius: 5,
      background: dim ? '#111' : 'linear-gradient(145deg,#fdfaf3,#f0ead8)',
      border: `1.5px solid ${dim ? '#2a2a2a' : red ? '#b91c1c' : '#374151'}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
      opacity: dim ? 0.2 : 1,
      transition: 'opacity 0.2s',
      position: 'relative',
    }}>
      <div style={{ fontSize: 11, fontWeight: 900, lineHeight: 1, color: dim ? '#333' : red ? '#b91c1c' : '#111', fontFamily: "'Orbitron',monospace" }}>
        {rankName(card.rank)}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1, color: dim ? '#333' : red ? '#b91c1c' : '#111' }}>
        {suitSymbol(card.suit)}
      </div>
      {card.modifier && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 12, height: 12, borderRadius: '50%',
          background: '#a78bfa', border: '1px solid #000',
          fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✦</div>
      )}
    </div>
  );
}

function Section({ title, color, cards, playedIds }: { title: string; color: string; cards: Card[]; playedIds?: Set<string> }) {
  if (cards.length === 0) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color, letterSpacing: '0.1em', marginBottom: 8 }}>
        {title} <span style={{ color: '#4b5563', fontSize: 14 }}>({cards.length})</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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

  const allCards = createDeck();
  const playedCards = allCards.filter(c => playedSet.has(c.id));
  const sort = (cards: Card[]) => [...cards].sort((a, b) => b.rank - a.rank || a.suit.localeCompare(b.suit));
  const modCount = [...deck, ...hand, ...community].filter(c => c.modifier).length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0d0a07',
          border: '1px solid #3a2e1e',
          borderRadius: '16px 16px 0 0',
          padding: '16px 16px 32px',
          width: '100%',
          maxWidth: 430,
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#3a2e1e', margin: '0 auto 14px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 26, color: '#ca8a04', letterSpacing: '0.1em' }}>
            DECK VIEWER
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid #3a2e1e', borderRadius: 6,
            color: '#6b5a3e', cursor: 'pointer', padding: '4px 12px',
            fontFamily: "'VT323',monospace", fontSize: 17,
          }}>✕</button>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, fontFamily: "'VT323',monospace", fontSize: 16, color: '#6b5a3e', flexWrap: 'wrap' }}>
          <span>🃏 <span style={{ color: '#ca8a04' }}>{deck.length}</span> draw</span>
          <span>✋ <span style={{ color: '#fbbf24' }}>{hand.length}</span> hand</span>
          <span>🟢 <span style={{ color: '#4ade80' }}>{community.length}</span> comm</span>
          <span>💨 <span style={{ color: '#6b7280' }}>{playedCards.length}</span> played</span>
          {modCount > 0 && <span>✨ <span style={{ color: '#a78bfa' }}>{modCount}</span> modified</span>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['cards', 'hands'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: "'VT323',monospace", fontSize: 17,
              padding: '6px 18px', borderRadius: 6, cursor: 'pointer', flex: 1,
              background: tab === t ? '#92400e' : 'transparent',
              border: `1px solid ${tab === t ? '#ca8a04' : '#3a2e1e'}`,
              color: tab === t ? '#fde68a' : '#6b5a3e',
            }}>{t === 'cards' ? 'CARDS' : 'HANDS'}</button>
          ))}
        </div>

        {tab === 'cards' && (
          <>
            <Section title="YOUR HAND" color="#fbbf24" cards={sort(hand)} />
            <Section title="COMMUNITY" color="#4ade80" cards={sort(community)} />
            <Section title="DRAW PILE" color="#ca8a04" cards={sort(deck)} />
            {playedCards.length > 0 && (
              <Section title="PLAYED / GONE" color="#374151" cards={sort(playedCards)} playedIds={playedSet} />
            )}
          </>
        )}

        {tab === 'hands' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#4b5563', marginBottom: 6 }}>
              Upgrade hands in the shop HANDS tab
            </div>
            {([10,9,8,7,6,5,4,3,2,1] as HandRankValue[]).map(rank => {
              const level = handLevels?.[rank] ?? 1;
              const baseChips = handBaseAtLevel(rank, level);
              const baseEntry = SCORE_TABLE[rank];
              return (
                <div key={rank} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8,
                  background: level > 1 ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${level > 1 ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.04)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#d1d5db' }}>
                      {HAND_NAMES[rank]}
                    </span>
                    {level > 1 && (
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#a78bfa' }}>Lv.{level}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#fbbf24' }}>
                    {baseChips}c ×{baseEntry?.mult ?? 1}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
