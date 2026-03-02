import { useState } from 'react';
import { ConsumableType, getConsumable } from '../game/consumables';
import type { ConsumableTypeValue } from '../game/consumables';

interface ConsumablesProps {
  held: ConsumableTypeValue[];
  onUse: (type: ConsumableTypeValue) => void;
  onRouletteBet: (amount: number) => void
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
      <div className="text-xs text-gray-400 uppercase tracking-widest">Consumables</div>
      <div className="flex gap-2">
        {slots.map((type, i) => {
          if (!type) {
            return (
              <div key={i} className="w-16 h-20 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-700 text-xs">
                empty
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
                'w-16 h-20 rounded-lg flex flex-col items-center justify-center gap-1 border transition-all text-xs font-semibold',
                active
                  ? 'border-orange-400 bg-orange-900/40 text-orange-300'
                  : 'border-yellow-600 bg-yellow-950/40 hover:bg-yellow-900/40 text-yellow-300',
                disabled ? 'opacity-50 cursor-default' : 'cursor-pointer',
              ].join(' ')}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-center leading-tight px-1">{c.name}</span>
              {active && <span className="text-orange-400 text-xs">×{scratchMultiplier}</span>}
            </button>
          );
        })}
      </div>

      {/* Roulette modal */}
      {rouletteOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-600 rounded-xl p-6 w-72 flex flex-col gap-4">
            <h3 className="text-yellow-400 text-lg font-bold text-center">🎰 Roulette</h3>
            <p className="text-gray-300 text-sm text-center">50/50 — double or lose your bet</p>
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs">Bet amount (max 50)</label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={betAmount}
                onChange={e => setBetAmount(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-yellow-400 font-bold text-xl">{betAmount} chips</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRouletteOpen(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRoulette}
                className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded"
              >
                SPIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
