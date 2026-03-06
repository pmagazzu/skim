import { useState, useEffect, useRef } from 'react';
import { ConsumableType, getConsumable } from '../game/consumables';
import type { ConsumableTypeValue } from '../game/consumables';
import { RouletteWheel } from './RouletteWheel';

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

interface ConsumablesProps {
  held: ConsumableTypeValue[];
  onUse: (type: ConsumableTypeValue) => void;
  onRouletteSpin: (payload: { betAmount: number; betType: 'red' | 'black' | 'number'; pickedNumbers: number[] }) => void;
  disabled?: boolean;
  scratchMultiplier: number;
  lastRouletteResult?: { win: boolean; number: number } | null;
  vertical?: boolean;
  unlockedSlots?: number; // default 2
}

export function Consumables({ held, onUse, onRouletteSpin, disabled, scratchMultiplier, vertical, unlockedSlots = 2 }: ConsumablesProps) {
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [betAmount, setBetAmount] = useState(20);
  const [betType, setBetType] = useState<'red' | 'black' | 'number' | null>(null);
  const [pickedNumbers, setPickedNumbers] = useState<Set<number>>(new Set());
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<{ win: boolean; amount: number } | null>(null);

  const splitBet = betType === 'number' && pickedNumbers.size > 0
    ? Math.floor(betAmount / pickedNumbers.size)
    : betAmount;

  function toggleNumber(n: number) {
    setPickedNumbers(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }



  function handleUse(type: ConsumableTypeValue) {
    if (type === ConsumableType.ROULETTE) {
      setRouletteOpen(true);
      return;
    }
    onUse(type);
  }

  function handleRoulette() {
    if (!betType) return;
    if (betType === 'number' && pickedNumbers.size === 0) return;
    setWinningNumber(null);
    setSpinning(true);

    setTimeout(() => {
      onUse(ConsumableType.ROULETTE);
      onRouletteSpin({ betAmount, betType, pickedNumbers: Array.from(pickedNumbers) });
      setSpinning(false);
      setRouletteResult(null);
    }, 3000);
  }

  function closeRoulette() {
    setRouletteOpen(false);
    setBetType(null);
    setPickedNumbers(new Set());
    setWinningNumber(null);
    setRouletteResult(null);
  }

  const slots = Array.from({ length: 4 }, (_, i) => held[i] ?? null);

  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTip = (i: number) => { if (hideTimer.current) clearTimeout(hideTimer.current); setHoveredSlot(i); };
  const hideTip = () => { hideTimer.current = setTimeout(() => setHoveredSlot(null), 100); };
  const cancelHide = () => { if (hideTimer.current) clearTimeout(hideTimer.current); };

  return (
    <div className="flex flex-col gap-2">
      <div className={vertical ? 'flex flex-col gap-2' : 'flex gap-2'}>
        {slots.map((type, i) => {
          const locked = i >= unlockedSlots;
          const sz = vertical ? 'w-10 h-12' : 'w-16 h-20';

          if (locked) {
            return (
              <div key={i} className={`${sz} border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-gray-800`} title="Unlock in Shop → Upgrades">
                <span style={{ fontSize: vertical ? 14 : 18, opacity: 0.4 }}>🔒</span>
              </div>
            );
          }

          if (!type) {
            return (
              <div key={i} className={`${sz} border border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-700 text-xs`}>
                —
              </div>
            );
          }

          const c = getConsumable(type);
          const active = type === ConsumableType.SCRATCH_TICKET && scratchMultiplier > 1;
          const showTooltip = hoveredSlot === i;

          return (
            <div key={i} className="relative" onMouseEnter={() => showTip(i)} onMouseLeave={hideTip}>
              <button
                onClick={() => !disabled && handleUse(type)}
                disabled={disabled}
                className={[
                  `${sz} rounded-xl flex flex-col items-center justify-center gap-1 border transition-all text-xs font-semibold`,
                  active
                    ? 'border-orange-500 bg-orange-900/30 text-orange-300'
                    : 'border-amber-800/40 bg-amber-950/20 hover:border-amber-600 text-amber-400',
                  disabled ? 'opacity-50 cursor-default' : 'cursor-pointer',
                ].join(' ')}
              >
                <span className={vertical ? 'text-lg' : 'text-2xl'}>{c.icon}</span>
                {!vertical && <span className="text-center leading-tight px-0.5 text-xs">{c.name.split(' ')[0]}</span>}
                {active && <span className="text-orange-400 text-xs font-bold">×{scratchMultiplier}</span>}
              </button>

              {/* Tooltip */}
              {showTooltip && (
                <div
                  className="absolute z-40 bg-[#1a1410] border border-amber-800/60 rounded-lg p-2.5 shadow-2xl"
                  style={{ [vertical ? 'left' : 'bottom']: vertical ? '110%' : '110%', [vertical ? 'top' : 'left']: vertical ? 0 : '50%', transform: vertical ? 'none' : 'translateX(-50%)', width: 160, pointerEvents: 'auto' }}
                  onMouseEnter={cancelHide} onMouseLeave={hideTip}
                >
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#fbbf24', marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#9ca3af', lineHeight: 1.3 }}>{c.description}</div>
                  {active && <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#fb923c', marginTop: 4 }}>×{scratchMultiplier} active</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rouletteOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#0d0a07] border border-amber-900/50 rounded-2xl p-5 w-[420px] max-w-[96vw] flex flex-col gap-4 shadow-2xl">
            <h3 className="title-font text-amber-400 text-2xl text-center tracking-widest">— ROULETTE —</h3>

            {/* Wheel */}
            <div className="flex justify-center">
              <RouletteWheel spinning={spinning} result={winningNumber} highlightNumbers={pickedNumbers} />
            </div>

            {/* Bet type */}
            <div className="flex gap-2 justify-center">
              {(['red','black','number'] as const).map(t => (
                <button key={t} onClick={() => { setBetType(t); if (t !== 'number') setPickedNumbers(new Set()); }}
                  disabled={spinning}
                  className={[
                    'px-4 py-2 rounded text-sm font-bold border transition-all',
                    betType === t
                      ? t === 'red' ? 'bg-red-700 border-red-500 text-white'
                        : t === 'black' ? 'bg-zinc-700 border-zinc-400 text-white'
                        : 'bg-amber-700 border-amber-400 text-white'
                      : t === 'red' ? 'border-red-900/50 text-red-500 hover:border-red-600'
                        : t === 'black' ? 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                        : 'border-amber-900/50 text-amber-600 hover:border-amber-600',
                    spinning ? 'opacity-40 cursor-default' : '',
                  ].join(' ')}
                >
                  {t === 'red' ? '🔴 Red' : t === 'black' ? '⚫ Black' : '🎯 Number'}
                  <span className="ml-1 text-xs opacity-60">{t === 'number' ? '35×' : '2×'}</span>
                </button>
              ))}
            </div>

            {/* Number grid — multi-select */}
            {betType === 'number' && (
              <div className="flex flex-col gap-1">
                <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  <div
                    onClick={() => !spinning && toggleNumber(0)}
                    className={['col-span-7 text-center py-1 rounded text-xs font-bold cursor-pointer bg-green-900 text-green-300 transition-all',
                      pickedNumbers.has(0) ? 'ring-2 ring-white brightness-125' : 'hover:brightness-110'].join(' ')}
                  >0 — Green</div>
                  {Array.from({ length: 36 }, (_, i) => i + 1).map(n => {
                    const isRed = RED_NUMBERS.has(n);
                    const picked = pickedNumbers.has(n);
                    const isWinner = winningNumber === n;
                    return (
                      <div key={n}
                        onClick={() => !spinning && toggleNumber(n)}
                        className={[
                          'text-center py-1 rounded text-xs font-bold cursor-pointer transition-all select-none',
                          isRed ? 'bg-red-900 text-red-200 hover:bg-red-700' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-600',
                          picked ? 'ring-2 ring-amber-300 brightness-150 scale-105 z-10 relative' : '',
                          isWinner ? 'ring-2 ring-yellow-200 animate-pulse' : '',
                        ].join(' ')}
                      >{n}</div>
                    );
                  })}
                </div>
                {pickedNumbers.size > 1 && (
                  <div className="text-center text-xs text-amber-600 tracking-wide">
                    {pickedNumbers.size} numbers · {splitBet}c each
                    {' '}· win pays <span className="text-amber-400 font-bold">+{splitBet * 35}c</span>
                  </div>
                )}
                {pickedNumbers.size === 0 && (
                  <div className="text-center text-xs text-gray-600">Pick one or more numbers</div>
                )}
              </div>
            )}

            {/* Bet amount */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="section-label">Bet amount</span>
                <span className="gold-glow font-bold chip-counter text-sm">{betAmount}c</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={betAmount}
                onChange={e => !spinning && setBetAmount(Number(e.target.value))}
                className="w-full accent-amber-500" disabled={spinning} />
              <div className="flex justify-between text-xs text-gray-700">
                <span>5c</span>
                {betType && betType !== 'number' && <span className="text-amber-700">Win: +{betAmount}c</span>}
                {betType === 'number' && pickedNumbers.size === 1 && <span className="text-amber-700">Win: +{betAmount * 35}c</span>}
                <span>50c</span>
              </div>
            </div>

            {/* Result display */}
            {rouletteResult && !spinning && (
              <div className={[
                'text-center py-3 px-4 rounded-xl border text-lg font-bold',
                rouletteResult.win
                  ? 'border-emerald-600 bg-emerald-950/40 text-emerald-400'
                  : 'border-red-800 bg-red-950/30 text-red-400',
              ].join(' ')} style={{ fontFamily: "'VT323',monospace", fontSize: 22 }}>
                {rouletteResult.win ? `✦ WIN +${rouletteResult.amount}c ✦` : `✗ LOST ${rouletteResult.amount}c`}
              </div>
            )}

            <div className="flex gap-2">
              {rouletteResult ? (
                <button onClick={closeRoulette} className="btn-primary flex-1 py-2">COLLECT</button>
              ) : (
                <>
                  <button onClick={() => { if (!spinning) closeRoulette(); }}
                    disabled={spinning} className="btn-secondary flex-1 py-2">Cancel</button>
                  <button
                    onClick={handleRoulette}
                    disabled={!betType || (betType === 'number' && pickedNumbers.size === 0) || spinning}
                    className="btn-primary flex-1 py-2 text-sm"
                  >
                    {spinning ? '⚪ Spinning...' : 'SPIN'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
