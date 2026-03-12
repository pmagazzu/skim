import { useEffect, useRef } from 'react';
import type { BoosterTypeValue, ShopItem } from '../game/gameState';
import { playButtonPress, playButtonPunch } from '../audio/sounds';

interface ShopProps {
  items: ShopItem[];
  personalChips: number;
  onBuy: (id: string) => void;
  onRerollBoosters: () => void;
  boosterRerollCost: number;
  onViewDeck: () => void;
  onEndShop: () => void;
}

function rarityFrame(rarity: string) {
  if (rarity === 'legendary') return { border: '#f59e0b', glow: '0 0 18px rgba(245,158,11,0.35)' };
  if (rarity === 'rare') return { border: '#a855f7', glow: '0 0 14px rgba(168,85,247,0.28)' };
  if (rarity === 'uncommon') return { border: '#3b82f6', glow: '0 0 10px rgba(59,130,246,0.22)' };
  return { border: '#6b7280', glow: 'none' };
}

const BOOSTER_COLOR: Record<BoosterTypeValue, string> = {
  CHIP: '#ffd166',
  HAND: '#93c5fd',
  UTILITY: '#bef264',
  FORGE: '#fb923c',
  WILDCARD: '#c4b5fd',
  BOUNTY: '#fda4af',
};

const FOIL_GRADIENT: Record<BoosterTypeValue, string> = {
  CHIP: 'linear-gradient(145deg,#50320c,#b78329 45%,#5a390e)',
  HAND: 'linear-gradient(145deg,#1f3657,#4f78c8 45%,#233b60)',
  UTILITY: 'linear-gradient(145deg,#3c4b12,#95ad2f 45%,#3b4a12)',
  FORGE: 'linear-gradient(145deg,#4d1f10,#c65a28 45%,#4c1f10)',
  WILDCARD: 'linear-gradient(145deg,#3f1d62,#9b59d0 45%,#1f4d66)',
  BOUNTY: 'linear-gradient(145deg,#3e1111,#ad3333 45%,#3f1212)',
};

const BOOSTER_EXPLAIN: Record<BoosterTypeValue, string> = {
  CHIP: 'Contains 2-4 chips · pick 1',
  HAND: 'Contains hand upgrades · pick 1',
  UTILITY: 'Contains utility upgrades · pick 1',
  FORGE: 'Contains forge paths · pick 1',
  WILDCARD: 'Contains mixed rewards · pick 1',
  BOUNTY: 'Contains contracts · pick 1',
};

const BOOSTER_STYLE: Record<BoosterTypeValue, { band: string; stamp: string; edge: string; pattern: string; brand: string; shape: 'sport' | 'tcg' | 'tech' | 'metal' | 'neon' | 'poster' }> = {
  CHIP: { band: '#fbbf24', stamp: 'STACK', edge: '#7c4a03', pattern: 'repeating-linear-gradient(95deg, rgba(255,255,255,0.13) 0px, rgba(255,255,255,0.13) 2px, transparent 2px, transparent 8px)', brand: 'CASINO CLASSIC', shape: 'sport' },
  HAND: { band: '#60a5fa', stamp: 'COMBO', edge: '#1d4ed8', pattern: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 3px, transparent 3px, transparent 9px)', brand: 'ARCANA DECK', shape: 'tcg' },
  UTILITY: { band: '#a3e635', stamp: 'TECH', edge: '#4d7c0f', pattern: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 3px, transparent 3px, transparent 7px)', brand: 'GADGET LAB', shape: 'tech' },
  FORGE: { band: '#fb923c', stamp: 'HEAT', edge: '#9a3412', pattern: 'repeating-linear-gradient(125deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 2px, transparent 2px, transparent 6px)', brand: 'IRONWORKS', shape: 'metal' },
  WILDCARD: { band: '#c084fc', stamp: 'CHAOS', edge: '#6d28d9', pattern: 'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.2), transparent 22%, rgba(255,255,255,0.15), transparent 50%, rgba(255,255,255,0.2), transparent 78%, rgba(255,255,255,0.15), transparent)', brand: 'NOVA RIP', shape: 'neon' },
  BOUNTY: { band: '#fb7185', stamp: 'HUNT', edge: '#9f1239', pattern: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 4px, transparent 4px, transparent 10px)', brand: 'OUTLAW POSTER', shape: 'poster' },
};

function FoilPack({ type, rarity, sold }: { type: BoosterTypeValue; rarity: string; sold?: boolean }) {
  const rareGlow = rarity === 'legendary'
    ? '0 0 18px rgba(245,158,11,0.45), 0 8px 18px rgba(0,0,0,0.45)'
    : rarity === 'rare'
      ? '0 0 14px rgba(168,85,247,0.35), 0 8px 18px rgba(0,0,0,0.45)'
      : '0 6px 16px rgba(0,0,0,0.35)';
  const stars = rarity === 'legendary' ? '★★★' : rarity === 'rare' ? '★★' : rarity === 'uncommon' ? '★' : '•';
  const s = BOOSTER_STYLE[type];
  const shapeRadius = s.shape === 'sport' ? '14px 14px 10px 10px' : s.shape === 'poster' ? '6px' : s.shape === 'neon' ? '16px 16px 8px 8px' : '11px';

  return (
    <div style={{
      width: 72,
      height: 98,
      borderRadius: shapeRadius,
      background: FOIL_GRADIENT[type],
      border: `1px solid ${s.edge}`,
      boxShadow: sold ? 'none' : `${rareGlow}, inset 0 1px 0 rgba(255,255,255,0.36)`,
      position: 'relative',
      overflow: 'hidden',
      opacity: sold ? 0.45 : 1,
      flexShrink: 0,
      transform: sold ? 'none' : (s.shape === 'poster' ? 'rotate(-1deg)' : 'perspective(500px) rotateX(2deg)'),
    }}>
      <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, background: s.pattern, opacity: type === 'WILDCARD' ? 0.45 : 1 }} />
      <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 12%, rgba(255,255,255,0.4), transparent 38%)' }} />

      {/* Brand-specific wrappers to feel like different product lines */}
      {s.shape === 'sport' && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 14, background: 'rgba(0,0,0,0.28)' }} />}
      {s.shape === 'tcg' && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, border: '2px double rgba(255,255,255,0.18)' }} />}
      {s.shape === 'tech' && <>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 16, borderLeft: `2px solid ${s.band}`, borderTop: `2px solid ${s.band}` }} />
        <div style={{ position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, borderRight: `2px solid ${s.band}`, borderBottom: `2px solid ${s.band}` }} />
      </>}
      {s.shape === 'metal' && <div style={{ position: 'absolute', left: 0, right: 0, top: 36, height: 10, background: 'rgba(0,0,0,0.35)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)' }} />}
      {s.shape === 'neon' && <div style={{ position: 'absolute', inset: 3, border: `1px solid ${s.band}`, boxShadow: `0 0 8px ${s.band}66 inset` }} />}
      {s.shape === 'poster' && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, background: 'rgba(0,0,0,0.35)' }} />}

      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: s.band, boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.25)' }} />

      <div style={{ position: 'absolute', left: 10, right: 6, top: 6, textAlign: 'center', fontFamily: "'VT323',monospace", fontSize: 10, letterSpacing: '0.14em', color: '#fff7e1', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
        {stars}
      </div>

      <div style={{ position: 'absolute', left: 10, right: 6, top: 16, textAlign: 'center', fontFamily: "'VT323',monospace", fontSize: 8, letterSpacing: '0.12em', color: '#f4e4c2', opacity: 0.9 }}>
        {s.brand}
      </div>

      <div style={{ position: 'absolute', right: 4, top: 26, padding: '1px 4px', borderRadius: 4, background: 'rgba(0,0,0,0.35)', fontFamily: "'VT323',monospace", fontSize: 9, letterSpacing: '0.07em', color: s.band }}>
        {s.stamp}
      </div>

      <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))' }}>
        <svg width="36" height="36" viewBox="0 0 34 34" aria-hidden>
          <circle cx="17" cy="17" r="15" fill="rgba(0,0,0,0.25)" stroke={BOOSTER_COLOR[type]} strokeWidth="1.6" />
          {type === 'CHIP' && <>
            <circle cx="17" cy="17" r="8" fill="none" stroke={BOOSTER_COLOR[type]} strokeWidth="1.8" />
            <circle cx="17" cy="17" r="3" fill={BOOSTER_COLOR[type]} />
          </>}
          {type === 'HAND' && <path d="M10 22 L10 12 L13 12 L13 18 L15 18 L15 10 L18 10 L18 18 L20 18 L20 11 L23 11 L23 18 L25 18 L25 14 L27 14 L27 22 Z" fill={BOOSTER_COLOR[type]} />}
          {type === 'UTILITY' && <>
            <rect x="10" y="10" width="6" height="6" fill={BOOSTER_COLOR[type]} />
            <rect x="18" y="18" width="6" height="6" fill={BOOSTER_COLOR[type]} />
            <rect x="18" y="10" width="6" height="6" fill="none" stroke={BOOSTER_COLOR[type]} strokeWidth="1.5" />
            <rect x="10" y="18" width="6" height="6" fill="none" stroke={BOOSTER_COLOR[type]} strokeWidth="1.5" />
          </>}
          {type === 'FORGE' && <>
            <rect x="9" y="20" width="12" height="4" fill={BOOSTER_COLOR[type]} />
            <rect x="19" y="12" width="8" height="4" fill={BOOSTER_COLOR[type]} />
            <rect x="23" y="16" width="2" height="8" fill={BOOSTER_COLOR[type]} />
          </>}
          {type === 'WILDCARD' && <path d="M17 8 L19.5 14.5 L26.5 14.5 L21 18.8 L23.2 25.5 L17 21.3 L10.8 25.5 L13 18.8 L7.5 14.5 L14.5 14.5 Z" fill={BOOSTER_COLOR[type]} />}
          {type === 'BOUNTY' && <>
            <circle cx="17" cy="17" r="8" fill="none" stroke={BOOSTER_COLOR[type]} strokeWidth="1.8" />
            <circle cx="17" cy="17" r="3" fill={BOOSTER_COLOR[type]} />
            <line x1="17" y1="6" x2="17" y2="11" stroke={BOOSTER_COLOR[type]} strokeWidth="1.5" />
            <line x1="17" y1="23" x2="17" y2="28" stroke={BOOSTER_COLOR[type]} strokeWidth="1.5" />
            <line x1="6" y1="17" x2="11" y2="17" stroke={BOOSTER_COLOR[type]} strokeWidth="1.5" />
            <line x1="23" y1="17" x2="28" y2="17" stroke={BOOSTER_COLOR[type]} strokeWidth="1.5" />
          </>}
        </svg>
      </div>

      <div style={{ position: 'absolute', left: 10, right: 0, bottom: 4, textAlign: 'center', fontFamily: "'VT323',monospace", fontSize: 10, letterSpacing: '0.09em', color: '#fff4dc', textShadow: '0 1px 2px rgba(0,0,0,0.55)' }}>
        FOIL PACK
      </div>
    </div>
  );
}

export function Shop({ items, personalChips, onBuy, onRerollBoosters, boosterRerollCost, onViewDeck, onEndShop }: ShopProps) {
  const snapshotRef = useRef<ShopItem[]>([]);
  const idsKeyRef = useRef('');

  const idsKey = items.map(i => i.id).sort().join('|');
  useEffect(() => {
    // Refresh snapshot only when OFFER IDs change (new visit / reroll).
    if (idsKey && idsKey !== idsKeyRef.current) {
      snapshotRef.current = items;
      idsKeyRef.current = idsKey;
    }
  }, [idsKey, items]);

  const stableItems = snapshotRef.current.length > 0 ? snapshotRef.current : items;
  const liveById = new Map(items.map(i => [i.id, i]));

  function punchButton(el?: HTMLButtonElement | null) {
    if (!el) return;
    el.classList.remove('btn-punch');
    void el.offsetWidth;
    el.classList.add('btn-punch');
    setTimeout(() => el.classList.remove('btn-punch'), 190);
  }

  function buy(id: string, el?: HTMLButtonElement | null) {
    punchButton(el);
    onBuy(id);
  }

  return (
    <div className="flex flex-col gap-3 p-3 w-full">
      <div style={{ textAlign: 'center', fontFamily: "'Press Start 2P',monospace", fontSize: 16, color: 'var(--accent-bright)', textShadow: '0 0 10px var(--accent-glow)' }}>BOOSTER SHOP</div>

      <div className="flex items-center justify-between">
        <button onClick={(e) => { playButtonPress(); punchButton(e.currentTarget); onViewDeck(); }} className="btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }}>DECK</button>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 28, color: 'var(--accent-bright)', textShadow: '0 0 8px var(--accent-glow)' }}>💰 {personalChips.toLocaleString()}c</div>
        <button onClick={(e) => { playButtonPress(); punchButton(e.currentTarget); onEndShop(); }} className="btn-primary" style={{ fontSize: 13, padding: '7px 12px' }}>CONTINUE →</button>
      </div>

      <button
        onClick={personalChips >= boosterRerollCost ? (e) => { playButtonPress(); punchButton(e.currentTarget); onRerollBoosters(); } : undefined}
        disabled={personalChips < boosterRerollCost}
        className={personalChips >= boosterRerollCost ? 'btn-secondary' : 'btn-secondary opacity-40'}
        style={{ fontSize: 13, padding: '8px 0' }}
      >
        REROLL BOOSTERS · {boosterRerollCost}c
      </button>

      <div className="grid grid-cols-1 gap-2">
        {stableItems.slice(0, 5).map(item => {
          const live = liveById.get(item.id);
          const sold = !live || live.cost === 0;
          const effectiveCost = live?.cost ?? item.cost;
          const canBuy = !sold && personalChips >= effectiveCost;
          const frame = rarityFrame(item.rarity);
          return (
            <div key={item.id} className="shop-card" style={{ borderColor: frame.border, boxShadow: frame.glow, opacity: sold ? 0.55 : 1 }}>
              <div className="flex items-center gap-3">
                <FoilPack type={item.boosterType} rarity={item.rarity} sold={sold} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: sold ? 'var(--text-dim)' : 'color-mix(in srgb, var(--text-dim) 88%, white 12%)' }}>
                    {sold ? 'SOLD' : item.subtitle}
                  </div>
                  {!sold && (
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: 12, color: 'var(--text-dim)' }}>
                      {BOOSTER_EXPLAIN[item.boosterType]}
                    </div>
                  )}
                  <div style={{ fontFamily: "'VT323',monospace", color: 'var(--text-dim)', fontSize: 14, letterSpacing: '0.08em', marginTop: 2 }}>
                    {item.rarity.toUpperCase()}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: 'var(--accent-bright)', textShadow: '0 0 8px var(--accent-glow)' }}>{sold ? '—' : `${effectiveCost}c`}</span>
                    <button
                      onClick={canBuy ? (e) => { playButtonPunch(); buy(item.id, e.currentTarget); } : undefined}
                      disabled={!canBuy}
                      className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40'}
                      style={{ fontSize: 14, padding: '6px 14px' }}
                    >
                      {sold ? 'SOLD' : canBuy ? 'BUY' : 'CAN\'T'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
