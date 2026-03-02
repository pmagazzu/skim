interface SkimLedgerProps {
  personalChips: number;
  skimRate: number;
  roundChips: number;
  lastScore: number | null;
  lastHandName: string | null;
  lastBonusDetail: string | null;
}

export function SkimLedger({ personalChips, skimRate, roundChips, lastScore, lastHandName, lastBonusDetail }: SkimLedgerProps) {
  return (
    <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
      <div className="section-label">Your Cut</div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">Bank</span>
        <span className="gold-glow font-bold chip-counter text-lg">{personalChips.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">Skim rate</span>
        <span className="text-amber-500 font-semibold">{Math.round(skimRate * 100)}%</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">Skimmed</span>
        <span className="text-amber-400 font-semibold">+{roundChips.toLocaleString()}</span>
      </div>
      {lastScore !== null && (
        <div className="mt-1 pt-2 border-t border-white/5 text-xs text-emerald-500 font-medium">
          {lastHandName} → <span className="font-bold">+{lastScore}</span>
          {lastBonusDetail && <span className="text-amber-600 ml-1">({lastBonusDetail})</span>}
        </div>
      )}
    </div>
  );
}
