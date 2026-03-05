import { useEffect, useRef } from 'react';

interface TurnPipsProps {
  handsPlayed: number;
  maxHands: number;
  vault: number;
  vaultTarget: number;
  turnTimeRemaining: number | null;  // seconds, null = no timer
}

export function TurnPips({ handsPlayed, maxHands, vault, vaultTarget, turnTimeRemaining }: TurnPipsProps) {
  const handsLeft = maxHands - handsPlayed;
  const vaultPct = Math.min(1, vault / Math.max(1, vaultTarget));
  const prevPlayed = useRef(handsPlayed);
  const flashIdx = useRef<number | null>(null);

  // Track which pip just fired for flash animation
  if (handsPlayed !== prevPlayed.current) {
    flashIdx.current = handsPlayed - 1; // the pip that just turned dark
    prevPlayed.current = handsPlayed;
  }

  function pipColor(i: number): string {
    if (i < handsPlayed) return '#2a2520';     // played — dark
    const remaining = maxHands - handsPlayed;
    if (remaining === 1) return '#ef4444';     // last one — red
    if (remaining <= 2) return '#f59e0b';      // danger — amber
    return '#22c55e';                          // safe — green
  }

  function pipGlow(i: number): string {
    if (i < handsPlayed) return 'none';
    const remaining = maxHands - handsPlayed;
    if (remaining === 1) return '0 0 8px rgba(239,68,68,0.7)';
    if (remaining <= 2) return '0 0 8px rgba(245,158,11,0.6)';
    return '0 0 6px rgba(34,197,94,0.4)';
  }

  // Timer color
  const timerPct = turnTimeRemaining != null
    ? turnTimeRemaining / (turnTimeRemaining > 45 ? 60 : 45)
    : 1;
  const timerColor = turnTimeRemaining != null && turnTimeRemaining <= 8
    ? '#ef4444'
    : turnTimeRemaining != null && turnTimeRemaining <= 15
    ? '#f59e0b'
    : '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>

      {/* Pip track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Array.from({ length: maxHands }).map((_, i) => {
          const isActive = i >= handsPlayed;
          const isFlashing = i === flashIdx.current;
          return (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: pipColor(i),
              boxShadow: isActive ? pipGlow(i) : 'none',
              border: `2px solid ${isActive ? pipColor(i) : '#333'}`,
              transition: 'background 0.3s, box-shadow 0.3s',
              animation: isFlashing ? 'pip-fire 0.4s ease-out forwards' : 'none',
              flexShrink: 0,
            }} />
          );
        })}
        <span style={{
          fontFamily: "'VT323',monospace",
          fontSize: 22,
          color: handsLeft <= 1 ? '#ef4444' : handsLeft <= 2 ? '#f59e0b' : '#6b7280',
          marginLeft: 6,
        }}>
          {handsLeft} left
        </span>
      </div>

      {/* Vault progress bar */}
      <div style={{ width: '88%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'stretch' }}>
        <div style={{ width: '100%', height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden', border: '1px solid #2a2520' }}>
          <div style={{
            height: '100%',
            width: `${vaultPct * 100}%`,
            background: vaultPct >= 1
              ? '#22c55e'
              : vaultPct >= 0.7
              ? 'linear-gradient(90deg,#ca8a04,#fbbf24)'
              : 'linear-gradient(90deg,#92400e,#ca8a04)',
            borderRadius: 3,
            transition: 'width 0.4s ease',
            boxShadow: vaultPct >= 1 ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'VT323',monospace", fontSize: 11, color: '#4b5563' }}>
          <span style={{ fontSize: 14 }}>{vault.toLocaleString()}</span>
          <span style={{ color: vaultPct >= 1 ? '#22c55e' : '#6b5a3e', fontSize: 14 }}>
            {Math.round(vaultPct * 100)}% filled
          </span>
          <span style={{ fontSize: 14 }}>{vaultTarget.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
