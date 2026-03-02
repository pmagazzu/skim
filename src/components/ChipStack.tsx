import { useState } from 'react';
import { getChip } from '../game/chips';
import type { ChipTypeValue } from '../game/chips';

interface ChipStackProps {
  chips: ChipTypeValue[];
  blackChipUsed: boolean;
}

export function ChipStack({ chips, blackChipUsed }: ChipStackProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="section-label">Chip Stack</div>
      <div className="flex gap-2 flex-wrap">
        {chips.map((type, i) => {
          const chip = getChip(type);
          const dimmed = type === 'BLACK' && blackChipUsed;
          return (
            <div key={i} className="relative">
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={[
                  'chip-token transition-opacity cursor-default',
                  chip.color,
                  dimmed ? 'opacity-30' : 'opacity-100',
                ].join(' ')}
              >
                {type[0]}
              </div>
              {hovered === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 w-44 bg-[#1a1410] border border-amber-800/40 rounded-xl p-2 shadow-xl pointer-events-none">
                  <div className={['text-xs font-bold mb-0.5', chip.textColor].join(' ')}>{chip.name}</div>
                  <div className="text-gray-400 text-xs leading-snug">{chip.description}</div>
                  {dimmed && <div className="text-gray-600 text-xs mt-1 italic">Used this round</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
