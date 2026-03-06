import { useEffect, useRef } from 'react';
import type { ScoreStep } from '../game/chips';
import { CHIPS } from '../game/chips';

interface ScoreChainProps {
  baseScore: number;
  handName: string;
  steps: ScoreStep[];
  finalScore: number;
  skimRate: number;
}

const CHIP_COLORS: Record<string, string> = {
  RED: '#f87171', BLUE: '#60a5fa', BLACK: '#d1d5db',
  GOLD: '#fbbf24', LUCKY: '#c084fc', SILVER: '#9ca3af',
  DIAMOND: '#67e8f9',
};

export function ScoreChain({ baseScore, handName, steps, finalScore, skimRate }: ScoreChainProps) {
  const skimmed = Math.floor(finalScore * skimRate);
  const toVault = finalScore - skimmed;
  const finalRef = useRef<HTMLSpanElement | null>(null);
  const prevFinal = useRef<number | null>(null);

  useEffect(() => {
    if (finalScore !== prevFinal.current && finalRef.current) {
      prevFinal.current = finalScore;
      const el = finalRef.current;
      el.classList.remove('score-number-pop');
      void el.offsetWidth; // reflow
      el.classList.add('score-number-pop');
      setTimeout(() => el.classList.remove('score-number-pop'), 350);
    }
  }, [finalScore]);

  return (
    <div className="score-chain-bg" style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px',
      padding: '8px 12px', borderRadius: 8,
      background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)',
      fontFamily: "'VT323',monospace", fontSize: 18,
    }}>
      {/* Hand name + base */}
      <span style={{ color: '#d1d5db' }}>{handName}</span>
      <span style={{ color: '#fbbf24', fontWeight: 700 }}>{baseScore}</span>

      {/* Chip steps */}
      {steps.map((step, i) => {
        const isScratch = (step.chipType as string) === 'SCRATCH';
        const color = isScratch ? '#fb923c' : (CHIP_COLORS[step.chipType] ?? '#9ca3af');
        return (
          <span key={i} className="score-step-in" style={{ animationDelay: `${i * 80}ms`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{ color: '#4b5563' }}>›</span>
            <span style={{ color }}>{step.label}</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{step.after}</span>
          </span>
        );
      })}

      {/* Final */}
      <span style={{ color: '#4b5563', marginLeft: 2 }}>›</span>
      <span
        key={finalScore}
        className="score-slam"
        style={{ color: '#fde68a', fontWeight: 700, fontSize: 22, display: 'inline-block' }}
      >
        <span ref={finalRef} style={{ display: 'inline-block' }}>{finalScore}</span>
      </span>

      {/* Split */}
      <span style={{ color: '#4b5563', fontSize: 16, marginLeft: 4 }}>
        vault <span style={{ color: '#34d399' }}>{toVault}</span>
        {' · '}you <span style={{ color: '#fbbf24' }}>{skimmed}</span>
      </span>
    </div>
  );
}
