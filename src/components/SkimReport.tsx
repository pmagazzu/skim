import type { RoundResult } from '../game/gameState';

interface SkimReportProps {
  result: RoundResult;
  round: number;
  totalRounds: number;
  onContinue: () => void;
}

export function SkimReport({ result, round, totalRounds, onContinue }: SkimReportProps) {
  const solidarityBonus = result.vaultFilled && (1 - result.skimRate) >= 0.6;
  const lastRound = round >= totalRounds;

  return (
    <div className="flex flex-col items-center gap-6 p-8 text-center max-w-sm mx-auto">
      <div className={['title-font text-4xl tracking-widest', result.vaultFilled ? 'text-emerald-400' : 'text-red-500'].join(' ')}>
        {result.vaultFilled ? '✦ VAULT FILLED ✦' : '✦ BUST ✦'}
      </div>
      <div className="section-label">Round {result.round} of {totalRounds}</div>

      <div className="w-full bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Vault</span>
          <span className={result.vaultFilled ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {result.vaultPct}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Chips skimmed</span>
          <span className="gold-glow font-bold chip-counter">+{result.personalChips}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Skim rate</span>
          <span className="text-amber-500">{Math.round(result.skimRate * 100)}%</span>
        </div>
        {solidarityBonus && (
          <div className="pt-2 border-t border-white/5 text-emerald-400 text-sm font-semibold">
            🤝 Solidarity Bonus — you kept it honest
          </div>
        )}
      </div>

      <button onClick={onContinue} className="btn-primary text-base px-12">
        {result.vaultFilled && !lastRound ? 'TO SHOP →' : result.vaultFilled ? 'FINAL RESULTS →' : 'GAME OVER'}
      </button>
    </div>
  );
}
