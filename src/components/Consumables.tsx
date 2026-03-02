import { useState } from 'react';
import { ConsumableType, getConsumable } from '../game/consumables';
import type { ConsumableTypeValue } from '../game/consumables';

interface ConsumablesProps {
  held: ConsumableTypeValue[];
  onUse: (type: ConsumableTypeValue) => void;
  onRouletteBet: (amount: number) => void;
  disabled?: boolean;
  scratchMultiplier: number;
}

export function Consumables({ held, onUse, onRouletteBet, disabled, scratchMultiplier }: ConsumablesProps) {
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [betAmount, setBetAmount] = useState(20);

  function handleUse(type: ConsumableTypeValue) {
    if (type === ConsumableType.ROULETTE) {
      setRouletteOpen(true);
      return;
    }
    onUse(type);
  }

  function handleRoulette() {
    onUse(ConsumableType.ROULETTE);
    onRouletteBet(betAmount);
    setRouletteOpen(false);
  }

  const slots = Array.from({ length: 4 }, (_, i) => held[i] ?? null);

  return (
    <div className="flex flex-col gap-2">
      <div className="section-label">Consumables</div>
      <div className="flex gap-2">
        {slots.map((type, i) => {
          if (!type) {
            return (
              <div key={i} className="w-16 h-20 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-700 text-xs">
                —
              </div>
            );
          }
          const c = getConsumable(type);
          const active = type === ConsumableType.SCRATCH_TICKET && scratchMultiplier > 1;
          return (
            <button
              key={i}
              onClick={() => !disabled && handleUse(type)}
              disabled={disabled}
              title={c.description}
              className={[
                'w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all text-xs font-semibold',
                active
                  ? 'border-orange-500 bg-orange-900/30 text-orange-300'
                  : 'border-amber-800/40 bg-amber-950/20 hover:border-amber-600 text-amber-400',
                disabled ? 'opacity-50 cursor-default' : 'cursor-pointer',
              ].join(' ')}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-center leading-tight px-0.5 text-xs">{c.name.split(' ')[0]}</span>
              {active && <span className="text-orange-400 text-xs font-bold">×{scratchMultiplier}</span>}
            </button>
          );
        })}
      </div>

      {rouletteOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#120f0c] border border-amber-800/40 rounded-2xl p-6 w-72 flex flex-col gap-4 shadow-2xl">
            <h3 className="title-font text-amber-400 text-xl text-center tracking-widest">🎰 Roulette</h3>
            <p className="text-gray-400 text-sm text-center">50/50 — double or lose your bet</p>
            <div className="flex flex-col gap-2">
              <label className="section-label">Bet amount (max 50)</label>
              <input
                type="range" min={5} max={50} step={5} value={betAmount}
                onChange={e => setBetAmount(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="text-center gold-glow font-bold text-2xl chip-counter">{betAmount} chips</div>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setRouletteOpen(false)} className="btn-secondary flex-1 py-2">Cancel</button>
              <button onClick={handleRoulette} className="btn-primary flex-1 py-2 text-sm">SPIN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
