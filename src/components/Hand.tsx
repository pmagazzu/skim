import { useMemo } from 'react';
import { Card } from './Card';
import type { Card as CardType } from '../game/deck';
import type { HandResult, HandRankValue } from '../game/hands';
import { TurnPips } from './TurnPips';

type SortMode = 'dealt' | 'high' | 'low' | 'suit';

const SUIT_ORDER: Record<string, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };

function sortCards(cards: CardType[], mode: SortMode): CardType[] {
  const c = [...cards];
  if (mode === 'high') return c.sort((a, b) => b.rank - a.rank);
  if (mode === 'low')  return c.sort((a, b) => a.rank - b.rank);
  if (mode === 'suit') return c.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || b.rank - a.rank);
  return c; // 'dealt' = original order
}

interface HandProps {
  hand: CardType[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onPlay: () => void;
  onDiscard: () => void;
  handResult: HandResult | null;
  chipPreview: number;
  disabled?: boolean;
  scratchMultiplier: number;
  handsLeft: number;
  handsPlayed: number;
  maxHands: number;
  vault: number;
  vaultTarget: number;
  turnTimeRemaining?: number | null;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  discardsUsed: number;
  maxFreeDiscards: number;
  extraDiscardCost: number;
  personalChips: number;
  handLevels: Record<HandRankValue, number>;
}

export function Hand({ hand, selectedIds, onSelect, onPlay, onDiscard, handResult, chipPreview, disabled, scratchMultiplier, handsLeft, handsPlayed, maxHands, vault, vaultTarget, turnTimeRemaining, sortMode, onSortChange, discardsUsed, maxFreeDiscards, extraDiscardCost, personalChips, handLevels }: HandProps) {
  const canPlay = selectedIds.length >= 1 && selectedIds.length <= 5 && !disabled;
  const freeDiscardsLeft = Math.max(0, maxFreeDiscards - discardsUsed);
  const isPaidDiscard = freeDiscardsLeft === 0;
  const canAffordPaidDiscard = personalChips >= extraDiscardCost;
  const canDiscard = !disabled && handsLeft > 1 && (!isPaidDiscard || canAffordPaidDiscard);

  const sortedHand = useMemo(() => sortCards(hand, sortMode), [hand, sortMode]);

  const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
    { mode: 'dealt', label: 'Dealt' },
    { mode: 'high',  label: 'High→Low' },
    { mode: 'low',   label: 'Low→High' },
    { mode: 'suit',  label: 'Suit' },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Sort controls */}
      <div className="flex items-center gap-1">
        <span className="section-label mr-2">Sort:</span>
        {SORT_OPTIONS.map(o => (
          <button
            key={o.mode}
            onClick={() => onSortChange(o.mode)}
            className={[
              'text-xs px-2 py-1 rounded transition-all',
              sortMode === o.mode
                ? 'bg-amber-800/60 text-amber-300 border border-amber-700'
                : 'text-gray-600 hover:text-gray-400 border border-transparent',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {sortedHand.map((card, i) => (
          <Card
            key={card.id}
            card={card}
            selected={selectedIds.includes(card.id)}
            onClick={() => onSelect(card.id)}
            disabled={disabled}
            animDelay={i * 40}
          />
        ))}
      </div>

      {/* Preview */}
      {/* Scratch ticket active banner */}
      {scratchMultiplier > 1 && (
        <div className="scratch-banner">
          <span className="scratch-banner-ticket">🎫</span>
          <span>SCRATCH ACTIVE</span>
          <span className="scratch-banner-mult">×{scratchMultiplier}</span>
          <span className="text-orange-300 opacity-60 text-xs">next hand scores {scratchMultiplier}× chips</span>
        </div>
      )}

      <div className="h-8 flex items-center gap-3">
        {handResult && selectedIds.length > 0 ? (
          <>
            <span className="text-amber-300 font-semibold text-sm">{handResult.name}</span>
            {handLevels[handResult.rank] > 1 && (
              <span style={{ fontFamily: "'VT323',monospace", fontSize: 12, color: '#a78bfa', letterSpacing: '0.05em' }}>
                Lv.{handLevels[handResult.rank]}
              </span>
            )}
            <span className={`font-bold ${scratchMultiplier > 1 ? 'text-orange-300' : 'gold-glow'}`}>
              +{chipPreview.toLocaleString()} chips
            </span>
            <span className="text-gray-600 text-xs">({selectedIds.length} card{selectedIds.length !== 1 ? 's' : ''})</span>
          </>
        ) : (
          <span className="text-gray-600 text-sm">Select 1–5 cards to play</span>
        )}
      </div>

      <TurnPips
        handsPlayed={handsPlayed}
        maxHands={maxHands}
        vault={vault}
        vaultTarget={vaultTarget}
        turnTimeRemaining={turnTimeRemaining ?? null}
      />

      <div className="flex gap-3 items-center">
        <button
          onClick={canPlay ? onPlay : undefined}
          disabled={!canPlay}
          className="btn-primary text-base px-10"
        >
          PLAY HAND
        </button>
        <button
          onClick={canDiscard ? onDiscard : undefined}
          disabled={!canDiscard}
          title={isPaidDiscard ? `Costs ${extraDiscardCost}c — free discards used up` : `${freeDiscardsLeft} free discard${freeDiscardsLeft !== 1 ? 's' : ''} remaining`}
          className={[
            'btn-secondary text-sm px-4 py-2',
            !canDiscard ? 'opacity-30 cursor-default' : '',
            isPaidDiscard && canAffordPaidDiscard ? 'border-amber-600 text-amber-400' : '',
          ].join(' ')}
        >
          {isPaidDiscard
            ? <span>DISCARD <span style={{ fontSize: 11, color: '#fbbf24' }}>−{extraDiscardCost}c</span></span>
            : <span>DISCARD <span style={{ fontSize: 11, opacity: 0.6 }}>{freeDiscardsLeft}↺</span></span>
          }
        </button>
      </div>

      {!canDiscard && handsLeft <= 1 && (
        <div className="text-xs text-red-600">Last hand — can't discard</div>
      )}
      {!canDiscard && isPaidDiscard && !canAffordPaidDiscard && (
        <div className="text-xs text-red-600">Can't afford discard ({extraDiscardCost}c)</div>
      )}
    </div>
  );
}
