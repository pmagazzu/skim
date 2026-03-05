interface SkimLedgerProps {
  personalChips: number;
  skimRate: number;
  roundChips: number;
  lastScore: number | null;
  lastHandName: string | null;
  lastBonusDetail: string | null;
}

export function SkimLedger({ personalChips, skimRate, roundChips, lastHandName, lastBonusDetail }: SkimLedgerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: '#fbbf24', letterSpacing: '0.05em', lineHeight: 1 }}>
        💰{personalChips.toLocaleString()}c
      </div>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#6b5a3e' }}>
        {Math.round(skimRate * 100)}% · +{roundChips}c skimmed
      </div>
      {lastHandName && (
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 11, color: '#4ade80', maxWidth: 120, textAlign: 'right', lineHeight: 1.2 }}>
          {lastHandName}{lastBonusDetail ? ` (${lastBonusDetail})` : ''}
        </div>
      )}
    </div>
  );
}
