import { getChip } from '../game/chips';
import type { ChipTypeValue } from '../game/chips';

interface ChipStackProps {
  chips: ChipTypeValue[];
  blackChipUsed: boolean;
}

export function ChipStack({ chips, blackChipUsed }: ChipStackProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-amber-600 uppercase tracking-widest">Chip Stack</div>
      <div className="flex gap-2 flex-wrap">
        {chips.map((type, i) => {
          const chip = getChip(type);
          const dimmed = type === 'BLACK' && blackChipUsed;
          return (
            <div
              key={i}
              title={chip.description}
              className={[
                'w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs font-black shadow-lg transition-opacity',
                chip.color,
                dimmed ? 'opacity-30' : 'opacity-100',
              ].join(' ')}
            >
              {type[0]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
