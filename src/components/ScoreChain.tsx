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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 6px',
      padding: '5px 10px', borderRadius: 8,
      background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)',
      fontFamily: "'VT323',monospace", fontSize: 14,
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
        style={{ color: '#fde68a', fontWeight: 700, fontSize: 16, display: 'inline-block' }}
      >
        {finalScore}
      </span>

      {/* Split */}
      <span style={{ color: '#4b5563', fontSize: 12, marginLeft: 4 }}>
        vault <span style={{ color: '#34d399' }}>{toVault}</span>
        {' · '}you <span style={{ color: '#fbbf24' }}>{skimmed}</span>
      </span>
    </div>
  );
}
