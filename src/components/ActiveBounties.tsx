import { useState } from 'react';
import type { Bounty } from '../game/bounties';

interface Props {
  bounties: Bounty[];
}

export default function ActiveBounties({ bounties }: Props) {
  const [tooltip, setTooltip] = useState<number | null>(null);

  if (bounties.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 items-center">
      {bounties.map((b, i) => (
        <div
          key={b.id}
          className="relative"
          onMouseEnter={() => setTooltip(i)}
          onMouseLeave={() => setTooltip(null)}
          onClick={() => setTooltip(tooltip === i ? null : i)}
        >
          {/* Badge circle */}
          <div className={[
            'w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 transition-all select-none cursor-default',
            b.completed
              ? 'border-green-500 bg-green-900/50 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
              : 'border-yellow-700 bg-yellow-900/30',
          ].join(' ')}>
            {b.completed ? '✅' : '⏳'}
          </div>

          {/* Tooltip — anchored to the LEFT */}
          {tooltip === i && (
            <div className="absolute right-12 top-0 z-30 w-52 bg-[#1a1410] border border-amber-800/60 rounded-lg p-2.5 shadow-2xl pointer-events-none">
              <div className="text-amber-300 text-xs font-bold mb-0.5">{b.title}</div>
              <div className="text-gray-400 text-xs leading-relaxed mb-1.5">{b.description}</div>
              <div className="text-emerald-400 text-xs font-semibold">🎁 {b.rewardLabel}</div>
              {b.completed && <div className="text-green-400 text-xs mt-1 font-bold">✓ Complete!</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
