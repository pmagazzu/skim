// Casino chip SVG art — each chip type has its own color scheme and symbol
import type { ChipTypeValue } from '../game/chips';

interface ChipArtProps {
  type: ChipTypeValue;
  size?: number;
  dimmed?: boolean;
  fired?: boolean;
  fireKey?: string;
}

// Per-chip color config: [outerRim, innerFill, spotColor, textColor, symbol]
const CHIP_STYLE: Record<string, [string, string, string, string, string]> = {
  // Common
  RED:      ['#dc2626', '#b91c1c', '#fca5a5', '#fff',     'R'],
  LUCKY:    ['#7c3aed', '#6d28d9', '#c4b5fd', '#fff',     '★'],
  COPPER:   ['#c2410c', '#9a3412', '#fed7aa', '#fff',     'Cu'],
  PENNY:    ['#92400e', '#78350f', '#fde68a', '#fde68a',  '¢'],
  CHALK:    ['#a8a29e', '#78716c', '#fafaf9', '#fafaf9',  'CH'],
  TIN:      ['#64748b', '#475569', '#cbd5e1', '#e2e8f0',  'TN'],
  NICKEL:   ['#737373', '#525252', '#d4d4d4', '#e5e5e5',  'N'],
  ROSE:     ['#e11d48', '#be123c', '#fda4af', '#fff',     '♥'],
  RIVER:    ['#0369a1', '#075985', '#7dd3fc', '#e0f2fe',  '~'],
  EMBER:    ['#ea580c', '#c2410c', '#fdba74', '#fff',     '🔥'],
  // Uncommon
  BLUE:     ['#2563eb', '#1d4ed8', '#93c5fd', '#fff',     'B'],
  SILVER:   ['#9ca3af', '#6b7280', '#e5e7eb', '#fff',     'Ag'],
  JADE:     ['#059669', '#047857', '#6ee7b7', '#fff',     '♣'],
  IRON:     ['#4b5563', '#374151', '#9ca3af', '#d1d5db',  'Fe'],
  BRONZE:   ['#b45309', '#92400e', '#fcd34d', '#fff',     'Bz'],
  OBSIDIAN: ['#1c1917', '#0c0a09', '#57534e', '#a8a29e',  '◆'],
  SAPPHIRE: ['#1e40af', '#1e3a8a', '#93c5fd', '#bfdbfe',  '◈'],
  CORAL:    ['#db2777', '#be185d', '#f9a8d4', '#fff',     '✦'],
  AMBER:    ['#d97706', '#b45309', '#fde68a', '#fff',     '◑'],
  STEEL:    ['#334155', '#1e293b', '#94a3b8', '#cbd5e1',  '⚙'],
  // Rare
  BLACK:    ['#1f2937', '#111827', '#374151', '#9ca3af',  '♠'],
  GOLD:     ['#ca8a04', '#a16207', '#fef08a', '#fff',     '$'],
  ONYX:     ['#0c0a09', '#000',    '#292524', '#a8a29e',  '⬟'],
  RUBY:     ['#7f1d1d', '#450a0a', '#fca5a5', '#fca5a5',  '♦'],
  QUARTZ:   ['#7c3aed', '#6d28d9', '#ddd6fe', '#ede9fe',  'Qz'],
  CRYSTAL:  ['#0891b2', '#0e7490', '#a5f3fc', '#cffafe',  '❋'],
  // Legendary
  DIAMOND:  ['#0891b2', '#164e63', '#67e8f9', '#ffffff',  '💎'],
  PLATINUM: ['#cbd5e1', '#94a3b8', '#f8fafc', '#1e293b',  'Pt'],
  JOKER:    ['#a21caf', '#86198f', '#f0abfc', '#fff',     '🃏'],
  MOONSTONE:['#4338ca', '#3730a3', '#c7d2fe', '#e0e7ff',  '◉'],
  // New chips
  MARBLE:   ['#94a3b8', '#64748b', '#e2e8f0', '#1e293b',  '◈'],
  RUST:     ['#92400e', '#78350f', '#fcd34d', '#7c2d12',  '⌁'],
  GRAVEL:   ['#78716c', '#57534e', '#d6d3d1', '#292524',  '⬡'],
  BONE:     ['#d6d3d1', '#a8a29e', '#fafaf9', '#44403c',  '†'],
  CEDAR:    ['#92400e', '#78350f', '#fde68a', '#451a03',  '⌥'],
  TOPAZ:    ['#ca8a04', '#a16207', '#fef08a', '#713f12',  '◇'],
  HAZE:     ['#581c87', '#4c1d95', '#d8b4fe', '#3b0764',  '≋'],
  FORGE:    ['#c2410c', '#9a3412', '#fed7aa', '#431407',  '⚒'],
  PRISM:    ['#0891b2', '#0e7490', '#a5f3fc', '#083344',  '◈'],
  VOID:     ['#030712', '#111827', '#6b7280', '#f9fafb',  '◉'],
  // Batch 2 — Common
  FLINT:    ['#57534e', '#44403c', '#d6d3d1', '#e7e5e4',  '⚡'],
  COAL:     ['#171717', '#0a0a0a', '#404040', '#a3a3a3',  '1'],
  // Batch 2 — Uncommon
  IVORY:    ['#d6d3d1', '#a8a29e', '#fffbeb', '#78350f',  'A'],
  GRANITE:  ['#6b7280', '#374151', '#9ca3af', '#f3f4f6',  '⬡'],
  PYRITE:   ['#ca8a04', '#854d0e', '#fef08a', '#713f12',  'Au'],
  TIDE:     ['#0f766e', '#134e4a', '#5eead4', '#ccfbf1',  '≈'],
  // Batch 2 — Rare
  SHARD:    ['#7c3aed', '#4c1d95', '#c4b5fd', '#ede9fe',  '◭'],
  LICHEN:   ['#4d7c0f', '#365314', '#a3e635', '#ecfccb',  '⊕'],
  // Batch 2 — Legendary
  AURORA:   ['#7e22ce', '#4c1d95', '#67e8f9', '#e0f2fe',  '✦'],
  ECHO:     ['#3730a3', '#1e1b4b', '#a5b4fc', '#e0e7ff',  '↩'],
};

export function ChipArt({ type, size = 40, dimmed = false, fired = false, fireKey }: ChipArtProps) {
  const style = CHIP_STYLE[type] ?? ['#6b7280', '#4b5563', '#9ca3af', '#fff', '?'];
  const [rim, fill, spot, text, symbol] = style;

  const r = size / 2;
  const cx = r, cy = r;
  const spotR = size * 0.07;
  const spotDist = r * 0.78;
  const spotsCount = 8;

  // Edge spots around the rim
  const spots = Array.from({ length: spotsCount }, (_, i) => {
    const angle = (i / spotsCount) * Math.PI * 2;
    return {
      x: cx + spotDist * Math.cos(angle),
      y: cy + spotDist * Math.sin(angle),
    };
  });

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{
        display: 'block', opacity: dimmed ? 0.3 : 1,
        filter: fired ? `drop-shadow(0 0 6px ${rim})` : undefined,
      }}
      className={fired ? 'chip-fired' : undefined}
      key={fireKey}
    >
      {/* Outer rim */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill={rim} />
      {/* Inner fill */}
      <circle cx={cx} cy={cy} r={r * 0.72} fill={fill} />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke={spot} strokeWidth={size * 0.025} opacity={0.5} />
      {/* Edge spots */}
      {spots.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={spotR} fill={spot} opacity={0.85} />
      ))}
      {/* Symbol */}
      <text
        x={cx} y={cy}
        textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.28}
        fontWeight="900"
        fontFamily="'VT323', 'Cinzel', monospace"
        fill={text}
        style={{ userSelect: 'none' }}
      >{symbol}</text>
      {/* Shine */}
      <ellipse cx={cx - r * 0.15} cy={cy - r * 0.3} rx={r * 0.22} ry={r * 0.12}
        fill="white" opacity={0.12} transform={`rotate(-30, ${cx}, ${cy})`} />
    </svg>
  );
}
