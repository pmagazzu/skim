interface SkimLedgerProps {
  personalChips: number;
  skimRate: number;
  roundChips: number;
  lastScore: number | null;
  lastHandName: string | null;
  lastBonusDetail: string | null;
}

export function SkimLedger({ personalChips, skimRate }: SkimLedgerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#fbbf24', letterSpacing: '0.03em', lineHeight: 1 }}>
        💰{personalChips.toLocaleString()}c
      </div>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#6b5a3e' }}>
        skim {Math.round(skimRate * 100)}%
      </div>
    </div>
  );
}
