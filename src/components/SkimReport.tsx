import type { RoundResult } from '../game/gameState';

interface SkimReportProps {
  result: RoundResult;
  round: number;
  totalRounds: number;
  onContinue: () => void;
}

export function SkimReport({ result, round, totalRounds, onContinue }: SkimReportProps) {
  const solidarityBonus = result.vaultPct === 100 && (1 - result.skimRate) >= 0.6;
  const lastRound = round >= totalRounds;

  return (
    <div className="flex flex-col items-center gap-5 p-8 text-center">
      <div className={['text-5xl font-black tracking-widest', result.vaultFilled ? 'text-green-400' : 'text-red-500'].join(' ')}>
        {result.vaultFilled ? '✅ VAULT FILLED' : '💀 BUST'}
      </div>

      <div className="text-gray-400 text-sm">Round {result.round} of {totalRounds}</div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-xs flex flex-col gap-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Vault filled</span>
          <span className={result.vaultPct >= 100 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {result.vaultPct}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Chips skimmed</span>
          <span className="text-yellow-400 font-bold">+{result.personalChips}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Your skim rate</span>
          <span className="text-orange-400 font-semibold">{Math.round(result.skimRate * 100)}%</span>
        </div>
        {solidarityBonus && (
          <div className="mt-1 pt-2 border-t border-green-800 text-green-400 text-sm font-semibold">
            🤝 Solidarity Bonus! Low skim = team player points
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="px-10 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg rounded-lg tracking-wider"
      >
        {result.vaultFilled && !lastRound ? 'TO SHOP →' : result.vaultFilled ? 'FINAL RESULTS →' : 'GAME OVER'}
      </button>
    </div>
  );
}
