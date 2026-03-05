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
  const [pendingSwap, setPendingSwap] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<number | null>(null);
  const [fireCount, setFireCount] = useState(0);
  const prevFired = useRef<string[]>([]);
  const lastTapRef = useRef<{ index: number; time: number } | null>(null);

  useEffect(() => {
    if (lastFiredChips.length > 0 && lastFiredChips !== prevFired.current) {
      prevFired.current = lastFiredChips;
      setFireCount(c => c + 1);
    }
  }, [lastFiredChips]);

  const closeTooltip = useCallback(() => setTooltip(null), []);

  function handleChipTap(i: number) {
    const now = Date.now();
    const last = lastTapRef.current;

    // Double-tap same chip → show tooltip (and cancel any pending swap)
    if (last && last.index === i && now - last.time < 400) {
      lastTapRef.current = null;
      setPendingSwap(null);
      setTooltip(i);
      return;
    }

    lastTapRef.current = { index: i, time: now };

    // If a swap is pending
    if (pendingSwap !== null) {
      if (pendingSwap === i) {
        // Tap same chip → cancel swap
        setPendingSwap(null);
      } else {
        // Tap different chip → perform swap
        onReorder(pendingSwap, i);
        setPendingSwap(null);
      }
      return;
    }

    // First tap → enter swap mode (pick up chip)
    setPendingSwap(i);
  }

  const tooltipChip = tooltip !== null ? chips[tooltip] : null;
  const tooltipChipData = tooltipChip ? getChip(tooltipChip) : null;

  return (
    <>
      {/* Swap mode hint banner */}
      {pendingSwap !== null && (
        <div style={{
          width: '100%', textAlign: 'center',
          fontFamily: "'VT323',monospace", fontSize: 17, color: '#fbbf24',
          paddingBottom: 2,
        }}>
          ↔ tap another chip to swap · tap same to cancel
        </div>
      )}

      <div className="flex flex-row flex-wrap gap-2 items-center justify-center">
        {chips.map((type, i) => {
          const chip = getChip(type);
          const dimmed = type === 'BLACK' && blackChipUsed;
          const fired = lastFiredChips.includes(type);
          const isPendingSwap = pendingSwap === i;

          return (
            <div
              key={`${type}-${i}`}
              className="relative flex flex-col items-center"
              onClick={() => handleChipTap(i)}
              style={{ cursor: 'pointer' }}
            >
              <div className={[
                'select-none transition-transform',
                isPendingSwap ? 'scale-125' : 'active:scale-90',
              ].join(' ')}
                style={{
                  filter: isPendingSwap ? 'drop-shadow(0 0 10px #fbbf24)' : 'none',
                  transition: 'transform 0.15s, filter 0.15s',
                }}
              >
                <ChipArt
                  type={type}
                  size={48}
                  dimmed={dimmed && !isPendingSwap}
                  fired={fired}
                  fireKey={fired ? `fired-${i}-${fireCount}` : `${type}-${i}`}
                />
              </div>

              {/* Swap target ring */}
              {pendingSwap !== null && pendingSwap !== i && (
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: '2px dashed #fbbf2466',
                  pointerEvents: 'none',
                  animation: 'spin 2s linear infinite',
                }} />
              )}

              {/* Small info label below each chip */}
              <div style={{
                fontFamily: "'VT323',monospace", fontSize: 13, color: '#4b5563',
                marginTop: 2, textAlign: 'center', lineHeight: 1,
              }}>
                {chip.name.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Double-tap hint when not in swap mode */}
      {pendingSwap === null && chips.length > 0 && (
        <div style={{
          fontFamily: "'VT323',monospace", fontSize: 15, color: '#374151',
          textAlign: 'center', marginTop: 2,
        }}>
          tap to swap · double-tap for info
        </div>
      )}

      {/* Tooltip bottom-sheet — shown on double-tap */}
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
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#374151', marginTop: 8, textAlign: 'center' }}>
              tap outside to close
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
