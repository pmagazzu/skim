import { useEffect, useRef, useState } from 'react';

interface VaultProps {
  chips: number;
  target: number;
}

// 7-segment display paths for digits 0-9
// Each segment: a=top, b=top-right, c=bot-right, d=bottom, e=bot-left, f=top-left, g=middle
const SEGMENTS: Record<string, boolean[]> = {
  //         a      b      c      d      e      f      g
  '0': [true,  true,  true,  true,  true,  true,  false],
  '1': [false, true,  true,  false, false, false, false],
  '2': [true,  true,  false, true,  true,  false, true ],
  '3': [true,  true,  true,  true,  false, false, true ],
  '4': [false, true,  true,  false, false, true,  true ],
  '5': [true,  false, true,  true,  false, true,  true ],
  '6': [true,  false, true,  true,  true,  true,  true ],
  '7': [true,  true,  true,  false, false, false, false],
  '8': [true,  true,  true,  true,  true,  true,  true ],
  '9': [true,  true,  true,  true,  false, true,  true ],
};

function Digit({ char, color, dimColor }: { char: string; color: string; dimColor: string }) {
  const segs = SEGMENTS[char] ?? [false,false,false,false,false,false,false];
  const W = 9, H = 16, T = 1.6, G = 0.5;

  // segment rects: [x, y, w, h]
  const segDefs = [
    // a - top
    { x: T+G, y: 0,       w: W-2*(T+G), h: T },
    // b - top-right
    { x: W-T, y: T+G,     w: T, h: H/2-T-G*2 },
    // c - bot-right
    { x: W-T, y: H/2+G,   w: T, h: H/2-T-G*2 },
    // d - bottom
    { x: T+G, y: H-T,     w: W-2*(T+G), h: T },
    // e - bot-left
    { x: 0,   y: H/2+G,   w: T, h: H/2-T-G*2 },
    // f - top-left
    { x: 0,   y: T+G,     w: T, h: H/2-T-G*2 },
    // g - middle
    { x: T+G, y: H/2-T/2, w: W-2*(T+G), h: T },
  ];

  return (
    <svg width={W + 3} height={H + 2} viewBox={`-1 -1 ${W+3} ${H+2}`} style={{ display: 'block' }}>
      {segDefs.map((s, i) => (
        <rect
          key={i}
          x={s.x} y={s.y} width={s.w} height={s.h}
          rx={T / 2}
          fill={segs[i] ? color : dimColor}
          style={{ transition: 'fill 0.1s' }}
        />
      ))}
    </svg>
  );
}

function LedNumber({ value, maxDigits, color, dimColor }: { value: number; maxDigits: number; color: string; dimColor: string }) {
  const str = String(value).padStart(maxDigits, '0').slice(-maxDigits);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
      {str.split('').map((ch, i) => (
        <Digit key={i} char={ch} color={color} dimColor={dimColor} />
      ))}
    </div>
  );
}

export function Vault({ chips, target }: VaultProps) {
  const full = chips >= target;
  const maxDigits = Math.max(4, String(target).length);

  const [displayChips, setDisplayChips] = useState(chips);
  const [ticking, setTicking] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevChips = useRef(chips);

  useEffect(() => {
    if (chips === prevChips.current) return;
    const from = prevChips.current;
    const to = chips;
    prevChips.current = to;

    // Tick up the display
    const steps = Math.min(Math.abs(to - from), 15);
    const step = (to - from) / steps;
    let current = from;
    let count = 0;
    setTicking(true);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      count++;
      current += step;
      setDisplayChips(Math.round(count >= steps ? to : current));
      if (count >= steps) {
        clearInterval(tickRef.current!);
        setTicking(false);
      }
    }, 40);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [chips]);

  const barRef = useRef<HTMLDivElement | null>(null);
  const prevPct = useRef(0);

  useEffect(() => {
    const newPct = Math.min(1, chips / Math.max(1, target));
    if (newPct !== prevPct.current && barRef.current) {
      prevPct.current = newPct;
      const el = barRef.current;
      el.classList.remove('vault-fill-pulse');
      void el.offsetWidth;
      el.classList.add('vault-fill-pulse');
      setTimeout(() => el.classList.remove('vault-fill-pulse'), 400);
    }
  }, [chips, target]);

  const activeColor  = full ? '#4ade80' : ticking ? '#fde68a' : '#f59e0b';
  const dimColor     = full ? '#052e16' : '#1c1007';
  const glowColor    = full ? 'rgba(74,222,128,0.5)' : ticking ? 'rgba(253,230,138,0.4)' : 'rgba(245,158,11,0.25)';

  const pct = Math.min(1, displayChips / Math.max(1, target));
  const barColor = full ? '#22c55e' : pct >= 0.7 ? '#fbbf24' : '#ca8a04';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 3,
      padding: '3px 8px 4px',
      background: '#080808',
      border: `1px solid ${full ? '#166534' : '#1a1400'}`,
      borderRadius: 8,
      boxShadow: `0 0 16px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.03)`,
      transition: 'box-shadow 0.4s, border-color 0.4s',
      width: '100%',
    }}>
      {/* Row: label + LED scores */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{
          fontFamily: "'VT323', monospace",
          fontSize: 11, letterSpacing: '0.2em',
          color: full ? '#4ade80' : '#5a3e10',
          textTransform: 'uppercase',
        }}>
          {full ? '✦ VAULT FULL ✦' : 'VAULT'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LedNumber value={displayChips} maxDigits={maxDigits} color={activeColor} dimColor={dimColor} />
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 12, color: '#3a2a08', paddingBottom: 1 }}>/</div>
          <LedNumber value={target} maxDigits={maxDigits} color="#6b4e1a" dimColor={dimColor} />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 5, background: '#1a1400', borderRadius: 3, overflow: 'hidden', border: '1px solid #2a2000' }}>
        <div ref={barRef} style={{
          height: '100%', width: `${pct * 100}%`,
          background: barColor,
          borderRadius: 3,
          transition: 'width 0.4s ease, background 0.3s',
          boxShadow: full ? `0 0 8px ${barColor}` : 'none',
        }} />
      </div>
    </div>
  );
}
