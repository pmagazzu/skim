import { useEffect, useRef, useState } from 'react';
import { playCoinStreamTick } from '../audio/sounds';

interface SkimLedgerProps {
  personalChips: number;
  skimRate: number;
  roundChips: number;
  lastScore: number | null;
  lastHandName: string | null;
  lastBonusDetail: string | null;
}

export function SkimLedger({ personalChips, skimRate }: SkimLedgerProps) {
  const [displayChips, setDisplayChips] = useState(personalChips);
  const prevChips = useRef(personalChips);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (personalChips === prevChips.current) return;
    const from = prevChips.current;
    const to = personalChips;
    prevChips.current = to;

    const steps = Math.min(Math.max(1, Math.abs(to - from)), 14);
    const step = (to - from) / steps;
    let current = from;
    let count = 0;

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      count++;
      current += step;
      setDisplayChips(Math.round(count >= steps ? to : current));
      if (to > from) playCoinStreamTick(count);
      if (count >= steps && tickRef.current) clearInterval(tickRef.current);
    }, 28);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [personalChips]);

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#fbbf24', letterSpacing: '0.03em', lineHeight: 1 }}>
        💰{displayChips.toLocaleString()}c
      </div>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#6b5a3e' }}>
        skim {Math.round(skimRate * 100)}%
      </div>
    </div>
  );
}
