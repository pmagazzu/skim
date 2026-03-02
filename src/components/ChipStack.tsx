import { useState, useRef } from 'react';
import { getChip } from '../game/chips';
import type { ChipTypeValue } from '../game/chips';

interface ChipStackProps {
  chips: ChipTypeValue[];
  blackChipUsed: boolean;
  onReorder: (from: number, to: number) => void;
}

const CHIP_BG: Record<string, string> = {
  RED: 'bg-red-600', BLUE: 'bg-blue-600', BLACK: 'bg-gray-800',
  GOLD: 'bg-yellow-500', LUCKY: 'bg-purple-600', SILVER: 'bg-gray-400', DIAMOND: 'bg-cyan-300',
};

export function ChipStack({ chips, blackChipUsed, onReorder }: ChipStackProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragNode = useRef<number | null>(null);

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
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="section-label">Chip Stack</div>
        <div className="text-xs text-gray-700">drag to reorder · applied top→bottom</div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {chips.map((type, i) => {
          const chip = getChip(type);
          const dimmed = type === 'BLACK' && blackChipUsed;
          const isDragging = dragIdx === i;
          const isTarget = dragOver === i;
          const bgClass = CHIP_BG[type] ?? 'bg-gray-600';

          return (
            <div
              key={`${type}-${i}`}
              className="relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragOver={e => { e.preventDefault(); handleDragEnter(i); }}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            >
              {/* Position label */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-gray-700">{i + 1}</div>
              <div
                className={[
                  'chip-token cursor-grab active:cursor-grabbing transition-all select-none',
                  bgClass,
                  dimmed ? 'opacity-30' : 'opacity-100',
                  isDragging ? 'scale-110 opacity-70 ring-2 ring-white/30' : '',
                  isTarget ? 'ring-2 ring-amber-400 scale-105' : '',
                ].join(' ')}
              >
                {type[0]}
              </div>
              {hovered === i && !isDragging && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20 w-48 bg-[#1a1410] border border-amber-800/50 rounded-lg p-2.5 shadow-xl pointer-events-none">
                  <div className="text-amber-300 text-xs font-bold mb-1">{chip.name}</div>
                  <div className="text-gray-400 text-xs leading-relaxed">{chip.description}</div>
                  <div className="text-gray-600 text-xs mt-1.5">Position {i + 1} of {chips.length}</div>
                  {dimmed && <div className="text-gray-600 text-xs italic">Used this round</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
