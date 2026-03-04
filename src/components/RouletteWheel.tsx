import { useEffect, useRef, useState } from 'react';

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

// European roulette wheel order
const WHEEL_ORDER = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];

interface RouletteWheelProps {
  spinning: boolean;
  result: number | null;
  highlightNumbers?: Set<number>;
  onSpinEnd?: () => void;
}

export function RouletteWheel({ spinning, result, highlightNumbers, onSpinEnd }: RouletteWheelProps) {
  const [wheelAngle, setWheelAngle] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballR, setBallR] = useState(68); // starts outer
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const baseWheelAngle = useRef(0);
  const spinDuration = 2800;

  useEffect(() => {
    if (!spinning || result === null) return;

    // Where does the result slot sit on the wheel?
    const slotIdx = WHEEL_ORDER.indexOf(result);
    const slotAngle = (slotIdx / WHEEL_ORDER.length) * 360;

    // We spin the wheel ~5 full rotations, landing with result at top (270°)
    const targetWheelAngle = baseWheelAngle.current + 360 * 5 + (270 - slotAngle - baseWheelAngle.current % 360 + 360) % 360;

    const startWheel = baseWheelAngle.current;
    const startBall = ballAngle;
    startTimeRef.current = performance.now();

    function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
    function easeInOut(t: number) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

    function frame(now: number) {
      const elapsed = now - (startTimeRef.current ?? now);
      const t = Math.min(1, elapsed / spinDuration);

      // Wheel slows to a stop
      const we = easeOut(t);
      const newWheel = startWheel + (targetWheelAngle - startWheel) * we;
      setWheelAngle(newWheel);

      // Ball spins opposite direction faster, then slows and spirals inward
      const ballSpins = startBall - 360 * 8 * easeOut(t);
      setBallAngle(ballSpins);
      // Ball spirals from r=68 to r=44 in last 40% of spin
      const spiral = t > 0.6 ? easeInOut((t - 0.6) / 0.4) : 0;
      setBallR(68 - spiral * 24);

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        baseWheelAngle.current = newWheel % 360;
        onSpinEnd?.();
      }
    }

    animRef.current = requestAnimationFrame(frame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, result]);

  const cx = 80, cy = 80, r = 74;
  const numSlots = WHEEL_ORDER.length;
  const sliceAngle = 360 / numSlots;

  // Ball position
  const ballRad = (ballAngle * Math.PI) / 180;
  const bx = cx + ballR * Math.cos(ballRad);
  const by = cy + ballR * Math.sin(ballRad);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <svg viewBox="0 0 160 160" width="200" height="200" style={{ display: 'block' }}>
      {/* Outer rim */}
      <circle cx={cx} cy={cy} r={77} fill="#1a0f00" stroke="#5a3a10" strokeWidth="3" />

      {/* Wheel slots */}
      <g transform={`rotate(${wheelAngle}, ${cx}, ${cy})`}>
        {WHEEL_ORDER.map((num, i) => {
          const startA = (i * sliceAngle - sliceAngle / 2) * Math.PI / 180;
          const endA = ((i + 1) * sliceAngle - sliceAngle / 2) * Math.PI / 180;
          const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
          const x2 = cx + r * Math.cos(endA),   y2 = cy + r * Math.sin(endA);
          const mx = cx + (r * 0.72) * Math.cos((startA + endA) / 2);
          const my = cy + (r * 0.72) * Math.sin((startA + endA) / 2);
          const fill = num === 0 ? '#166534' : RED_NUMBERS.has(num) ? '#7f1d1d' : '#111';
          const isResult = num === result && !spinning;
          const isHighlighted = highlightNumbers?.has(num) && !spinning;
          return (
            <g key={num}>
              <path
                d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
                fill={isResult ? (fill === '#7f1d1d' ? '#ef4444' : fill === '#111' ? '#374151' : '#22c55e') : isHighlighted ? (fill === '#7f1d1d' ? '#c02626' : fill === '#111' ? '#2d3748' : '#16803c') : fill}
                stroke="#2a1a00"
                strokeWidth="0.5"
              />
              <text
                x={mx} y={my}
                fontSize="4.5"
                fill={num === 0 ? '#86efac' : '#e5e7eb'}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="'VT323', monospace"
                transform={`rotate(${i * sliceAngle + 90}, ${mx}, ${my})`}
              >{num}</text>
            </g>
          );
        })}

        {/* Inner hub */}
        <circle cx={cx} cy={cy} r={22} fill="#120a00" stroke="#3a2000" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={14} fill="#1a0f00" stroke="#5a3a10" strokeWidth="1.5" />
        {/* Spokes */}
        {[0,45,90,135].map(a => {
          const ar = a * Math.PI / 180;
          return <line key={a}
            x1={cx + 14 * Math.cos(ar)} y1={cy + 14 * Math.sin(ar)}
            x2={cx + 22 * Math.cos(ar)} y2={cy + 22 * Math.sin(ar)}
            stroke="#5a3a10" strokeWidth="1"
          />;
        })}
        <circle cx={cx} cy={cy} r={5} fill="#2a1500" stroke="#ca8a04" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={2} fill="#ca8a04" />
      </g>

      {/* Ball track ring */}
      <circle cx={cx} cy={cy} r={70} fill="none" stroke="#3a2000" strokeWidth="2" strokeDasharray="2 3" opacity="0.4" />

      {/* Ball */}
      <circle cx={bx} cy={by} r={3.5} fill="white" stroke="#aaa" strokeWidth="0.5"
        style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' }} />

      {/* Pointer at top */}
      <polygon points={`${cx},${cy - 76} ${cx - 4},${cy - 68} ${cx + 4},${cy - 68}`} fill="#ca8a04" />

      {/* Result number in center */}
      {result !== null && !spinning && (() => {
        const isRed = RED_NUMBERS.has(result);
        const isGreen = result === 0;
        const color = isGreen ? '#22c55e' : isRed ? '#ef4444' : '#e5e7eb';
        return (
          <text x={cx} y={cy + 3} fontSize="13" fill={color}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'VT323', monospace" fontWeight="bold"
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
            {result}
          </text>
        );
      })()}
    </svg>

    {/* Result banner below wheel */}
    {result !== null && !spinning && (() => {
      const isRed = RED_NUMBERS.has(result);
      const isGreen = result === 0;
      const colorLabel = isGreen ? 'GREEN' : isRed ? 'RED' : 'BLACK';
      const bg = isGreen ? 'rgba(34,197,94,0.15)' : isRed ? 'rgba(239,68,68,0.15)' : 'rgba(30,30,30,0.5)';
      const border = isGreen ? '#16a34a' : isRed ? '#b91c1c' : '#374151';
      const text = isGreen ? '#4ade80' : isRed ? '#f87171' : '#d1d5db';
      return (
        <div style={{
          marginTop: 6, padding: '4px 16px', borderRadius: 6,
          background: bg, border: `1px solid ${border}`,
          fontFamily: "'VT323',monospace", fontSize: 18,
          color: text, textAlign: 'center', letterSpacing: '0.1em',
          filter: `drop-shadow(0 0 6px ${text})`,
        }}>
          {result} — {colorLabel}
        </div>
      );
    })()}
    </div>
  );
}
