interface SkimLedgerProps {
  personalChips: number;
  skimRate: number;
  roundChips: number;
  lastScore: number | null;
  lastHandName: string | null;
}

export function SkimLedger({ personalChips, skimRate, roundChips, lastScore, lastHandName }: SkimLedgerProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex flex-col gap-1.5">
      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your Cut</div>
      <div className="flex justify-between">
        <span className="text-gray-400 text-sm">Personal chips</span>
        <span className="text-yellow-400 font-bold chip-glow">{personalChips.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400 text-sm">Skim rate</span>
        <span className="text-orange-400 font-semibold">{Math.round(skimRate * 100)}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400 text-sm">Skimmed this round</span>
        <span className="text-yellow-300 font-semibold">+{roundChips.toLocaleString()}</span>
      </div>
      {lastScore !== null && (
        <div className="mt-1 pt-1 border-t border-gray-700 text-xs text-green-400">
          Last: {lastHandName} → +{lastScore} chips
        </div>
      )}
    </div>
  );
}
