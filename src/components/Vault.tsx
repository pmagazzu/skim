import { useEffect, useRef, useState } from 'react';
import { playCoinStreamTick } from '../audio/sounds';

interface VaultProps {
  chips: number;
  target: number;
}

export function Vault({ chips, target }: VaultProps) {
  const full = chips >= target;
  const [displayChips, setDisplayChips] = useState(chips);
  const prevChips = useRef(chips);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chips === prevChips.current) return;
    const from = prevChips.current;
    const to = chips;
    prevChips.current = to;

    const steps = Math.min(Math.max(1, Math.abs(to - from)), 12);
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
    }, 35);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [chips]);

  useEffect(() => {
    if (!barRef.current) return;
    const el = barRef.current;
    el.classList.remove('vault-fill-pulse');
    void el.offsetWidth;
    el.classList.add('vault-fill-pulse');
    const t = setTimeout(() => el.classList.remove('vault-fill-pulse'), 400);
    return () => clearTimeout(t);
  }, [chips, target]);

  const pct = Math.min(1, displayChips / Math.max(1, target));
  const barColor = full ? '#22c55e' : pct >= 0.75 ? '#fbbf24' : '#ca8a04';

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 8,
        border: `1px solid ${full ? '#166534' : 'var(--border)'}`,
        background: full ? 'rgba(16,40,24,0.75)' : 'rgba(0,0,0,0.28)',
        padding: '4px 8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
          {full ? 'VAULT FULL' : 'VAULT'}
        </div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 30, color: full ? '#4ade80' : 'var(--gold-bright)', lineHeight: 1 }}>
          {displayChips.toLocaleString()} / {target.toLocaleString()}
        </div>
      </div>

      <div style={{ width: '100%', height: 8, background: 'rgba(0,0,0,0.28)', borderRadius: 999, overflow: 'hidden' }}>
        <div
          ref={barRef}
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            background: barColor,
            borderRadius: 999,
            transition: 'width 0.35s ease',
            boxShadow: full ? '0 0 10px rgba(34,197,94,0.6)' : 'none',
          }}
        />
      </div>
    </div>
  );
}
