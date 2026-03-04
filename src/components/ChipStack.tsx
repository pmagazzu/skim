import { useRef, useState, useEffect } from 'react';
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
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const showTip = (i: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTooltip(i);
  };
  const hideTip = () => {
    hideTimer.current = setTimeout(() => setTooltip(null), 120);
  };
  const cancelHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [fireCount, setFireCount] = useState(0);
  const dragNode = useRef<number | null>(null);
  const prevFired = useRef<string[]>([]);

  // Only increment fireCount when lastFiredChips actually changes (new hand scored)
  useEffect(() => {
    if (lastFiredChips.length > 0 && lastFiredChips !== prevFired.current) {
      prevFired.current = lastFiredChips;
      setFireCount(c => c + 1);
    }
  }, [lastFiredChips]);

  if (chips.length === 0) return null;

  function handleDragStart(i: number) {
    setDragIdx(i);
    dragNode.current = i;
  }
  function handleDragEnter(i: number) {
    if (dragNode.current === null || dragNode.current === i) return;
    setDragOver(i);
  }
  function handleDrop(i: number) {
    if (dragNode.current !== null && dragNode.current !== i) {
      onReorder(dragNode.current, i);
    }
    setDragIdx(null);
    setDragOver(null);
    dragNode.current = null;
  }
  function handleDragEnd() {
    setDragIdx(null);
    setDragOver(null);
    dragNode.current = null;
  }

  return (
    <div className="flex flex-row flex-wrap gap-2 items-center">
      {chips.map((type, i) => {
        const chip = getChip(type);
        const dimmed = type === 'BLACK' && blackChipUsed;
        const isDragging = dragIdx === i;
        const isTarget = dragOver === i;
        const fired = lastFiredChips.includes(type);
        const rarityColor = chip.rarity ? (RARITY_COLORS[chip.rarity as keyof typeof RARITY_COLORS] ?? 'text-gray-400') : null;
        const rarityLabel = chip.rarity ? (RARITY_LABELS[chip.rarity as keyof typeof RARITY_LABELS] ?? chip.rarity) : null;
        const showTooltip = tooltip === i && !isDragging;

        return (
          <div
            key={`${type}-${i}`}
            className="relative"
            onMouseEnter={() => showTip(i)}
            onMouseLeave={hideTip}
            onClick={() => setTooltip(tooltip === i ? null : i)}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragOver={e => { e.preventDefault(); handleDragEnter(i); }}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
          >
            <div className={[
              'cursor-grab active:cursor-grabbing select-none transition-transform',
              dimmed ? '' : 'hover:scale-110',
              isDragging ? 'scale-110 opacity-60' : '',
              isTarget ? 'ring-2 ring-amber-400 rounded-full' : '',
            ].join(' ')}>
              <ChipArt
                type={type}
                size={40}
                dimmed={dimmed}
                fired={fired}
                fireKey={fired ? `fired-${i}-${fireCount}` : `${type}-${i}`}
              />
            </div>

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute left-12 top-0 z-30 w-48 bg-[#1a1410] border border-amber-800/60 rounded-lg p-2.5 shadow-2xl" style={{ pointerEvents: 'auto' }} onMouseEnter={cancelHide} onMouseLeave={hideTip}>
                <div className="text-amber-300 text-xs font-bold mb-0.5">{chip.name}</div>
                {rarityLabel && rarityColor && (
                  <div className={`text-xs font-semibold mb-1 ${rarityColor}`}>{rarityLabel}</div>
                )}
                <div className="text-gray-400 text-xs leading-relaxed">{chip.description}</div>
                <div className="text-gray-600 text-xs mt-1.5">Slot {i + 1} of {chips.length} · fires left→right</div>
                {dimmed && <div className="text-yellow-700 text-xs italic mt-1">Used this round</div>}
                {canTip && onTipChip && (
                  <div className="mt-2 border-t border-white/5 pt-2">
                    <div className="text-orange-400 text-xs mb-1">
                      🎯 Tip: {TIP_BONUS_MAP[type]?.label ?? '+30 chips next hand'}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setTooltip(null); onTipChip(i); }}
                      className="w-full text-xs py-1 px-2 rounded border border-orange-700 bg-orange-950/40 text-orange-300 hover:bg-orange-900/50 transition-colors"
                    >
                      SACRIFICE CHIP
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
