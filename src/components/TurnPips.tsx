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
  void vault;
  void vaultTarget;
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

  void turnTimeRemaining;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
      {/* Pip track */}
      {Array.from({ length: maxHands }).map((_, i) => {
        const isActive = i >= handsPlayed;
        const isFlashing = i === flashIdx.current;
        return (
          <div key={i} style={{
            width: 20, height: 20, borderRadius: '50%',
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
        fontSize: 24,
        color: handsLeft <= 1 ? '#ef4444' : handsLeft <= 2 ? '#f59e0b' : '#6b7280',
        marginLeft: 4,
      }}>
        {handsLeft} left
      </span>
    </div>
  );
}
