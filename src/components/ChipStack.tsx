import { useRef, useState, useEffect, useCallback } from 'react';
import { getChip, RARITY_COLORS, RARITY_LABELS } from '../game/chips';
import type { ChipTypeValue } from '../game/chips';
import { ChipArt } from './ChipArt';
import { TIP_BONUS_MAP } from '../game/gameState';

interface ChipStackProps {
  chips: ChipTypeValue[];
  blackChipUsed: boolean;
  lastFiredChips?: string[];
  canTip?: boolean;
  onReorder: (from: number, to: number) => void;
  onTipChip?: (index: number) => void;
}

export function ChipStack({ chips, blackChipUsed, lastFiredChips = [], canTip = false, onReorder, onTipChip }: ChipStackProps) {
  const [tooltip, setTooltip] = useState<number | null>(null);
  const [pendingSwap, setPendingSwap] = useState<number | null>(null); // tap-to-swap state
  const [fireCount, setFireCount] = useState(0);
  const prevFired = useRef<string[]>([]);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close tooltip on outside tap
  const closeTooltip = useCallback(() => { setTooltip(null); setPendingSwap(null); }, []);

  useEffect(() => {
    if (lastFiredChips.length > 0 && lastFiredChips !== prevFired.current) {
      prevFired.current = lastFiredChips;
      setFireCount(c => c + 1);
    }
  }, [lastFiredChips]);

  if (chips.length === 0) return null;

  function handleChipTap(i: number) {
    // Tap-to-swap: first tap picks up, second tap on different chip swaps
    if (pendingSwap === null) {
      setPendingSwap(i);
      setTooltip(i);
    } else if (pendingSwap === i) {
      // Tap same chip — cancel swap, show/hide tooltip
      setPendingSwap(null);
      setTooltip(tooltip === i ? null : i);
    } else {
      // Tap different chip — perform swap
      onReorder(pendingSwap, i);
      setPendingSwap(null);
      setTooltip(null);
    }
  }

  const cancelHide = () => { if (hideTimer.current) clearTimeout(hideTimer.current); };

  // Which chip is showing tooltip (for fixed overlay)
  const tooltipChip = tooltip !== null ? chips[tooltip] : null;
  const tooltipChipData = tooltipChip ? getChip(tooltipChip) : null;

  return (
    <>
      <div className="flex flex-row flex-wrap gap-2 items-center justify-center">
        {chips.map((type, i) => {
          const chip = getChip(type);
          const dimmed = type === 'BLACK' && blackChipUsed;
          const fired = lastFiredChips.includes(type);
          const isPendingSwap = pendingSwap === i;

          return (
            <div
              key={`${type}-${i}`}
              className="relative"
              onClick={() => handleChipTap(i)}
            >
              <div className={[
                'cursor-pointer select-none transition-transform',
                isPendingSwap ? 'scale-125 ring-2 ring-amber-400 rounded-full' : dimmed ? '' : 'active:scale-90',
              ].join(' ')}>
                <ChipArt
                  type={type}
                  size={48}
                  dimmed={dimmed}
                  fired={fired}
                  fireKey={fired ? `fired-${i}-${fireCount}` : `${type}-${i}`}
                />
              </div>
              {isPendingSwap && (
                <div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', fontFamily: "'VT323',monospace", fontSize: 12, color: '#fbbf24', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                  tap to swap
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fixed bottom-sheet tooltip — escapes all overflow clipping */}
      {tooltip !== null && tooltipChipData && tooltipChip && (
        <div
          onClick={closeTooltip}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 90, background: 'rgba(0,0,0,0.45)',
          }}
        >
          <div
            style={{
              background: '#1a1410', border: '1px solid rgba(180,120,30,0.5)',
              borderRadius: 14, padding: '16px 20px', width: 280,
              boxShadow: '0 0 32px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}

          >
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: '#fbbf24', marginBottom: 4 }}>{tooltipChipData.name}</div>
            {tooltipChipData.rarity && (
              <div className={`text-xs font-semibold mb-2 ${RARITY_COLORS[tooltipChipData.rarity as keyof typeof RARITY_COLORS] ?? 'text-gray-400'}`}>
                {RARITY_LABELS[tooltipChipData.rarity as keyof typeof RARITY_LABELS] ?? tooltipChipData.rarity}
              </div>
            )}
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#9ca3af', lineHeight: 1.4 }}>{tooltipChipData.description}</div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#4b5563', marginTop: 8 }}>
              Slot {tooltip + 1}/{chips.length} · fires left→right
            </div>
            {tooltipChip === 'BLACK' && blackChipUsed && (
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#92400e', marginTop: 4 }}>Used this round</div>
            )}
            {canTip && onTipChip && (
              <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#fb923c', marginBottom: 6 }}>
                  🎯 {TIP_BONUS_MAP[tooltipChip]?.label ?? '+30 chips next hand'}
                </div>
                <button
                  onClick={() => { closeTooltip(); onTipChip(tooltip); }}
                  style={{ width: '100%', fontSize: 15, padding: '8px 0', fontFamily: "'VT323',monospace" }}
                  className="rounded border border-orange-700 bg-orange-950/40 text-orange-300"
                >
                  SACRIFICE CHIP
                </button>
              </div>
            )}
            {chips.length > 1 && (
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#4b5563', marginTop: 8, textAlign: 'center' }}>
                {pendingSwap !== null ? 'tap another chip to swap position' : 'tap chip to pick up & reorder'}
              </div>
            )}
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#374151', marginTop: 6, textAlign: 'center' }}>
              tap outside to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
