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
  RED:     'text-red-400',
  BLUE:    'text-blue-400',
  BLACK:   'text-gray-300',
  GOLD:    'text-yellow-400',
  LUCKY:   'text-purple-400',
  SILVER:  'text-gray-400',
  DIAMOND: 'text-cyan-300',
};

export function ScoreChain({ baseScore, handName, steps, finalScore, skimRate }: ScoreChainProps) {
  const skimmed = Math.floor(finalScore * skimRate);
  const toVault = finalScore - skimmed;

  return (
    <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2 text-sm w-full">
      <div className="section-label mb-1">Scoring Chain</div>

      {/* Base hand */}
      <div className="flex justify-between items-center text-gray-400">
        <span>{handName}</span>
        <span className="font-bold chip-counter text-white">{baseScore}</span>
      </div>

      {/* Chip steps */}
      {steps.map((step, i) => {
        const color = CHIPS[step.chipType] ? CHIP_COLORS[step.chipType] : 'text-gray-400';
        const isSpecial = step.skimDoubled || step.vaultBonus || step.diamondActive;
        return (
          <div key={i} className={['flex justify-between items-center', color].join(' ')}>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-60">↳</span>
              <span>{step.label}</span>
              <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-white/5">
                {step.delta}
              </span>
            </div>
            {isSpecial ? (
              <span className="text-xs opacity-70 italic">
                {step.skimDoubled && 'skim doubled!'}
                {step.vaultBonus && `+${step.vaultBonus} vault`}
                {step.diamondActive && 'skim→vault 50%'}
              </span>
            ) : (
              <span className="font-bold chip-counter">{step.after}</span>
            )}
          </div>
        );
      })}

      {/* Divider + final */}
      <div className="border-t border-white/5 pt-2 mt-1 flex justify-between items-center font-bold">
        <span className="gold-glow">Total</span>
        <span className="gold-glow chip-counter text-lg">{finalScore}</span>
      </div>

      {/* Split */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>→ Vault  <span className="text-emerald-500">{toVault}</span></span>
        <span>→ You  <span className="text-amber-400">{skimmed}</span></span>
      </div>
    </div>
  );
}
