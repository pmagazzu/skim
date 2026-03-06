import { useRef, useState } from 'react';
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

const BOOSTER_ICON: Record<BoosterTypeValue, string> = {
  CHIP: '🪙',
  HAND: '🖐️',
  UTILITY: '🎲',
  FORGE: '⚒️',
  WILDCARD: '✨',
  BOUNTY: '🎯',
};

const FOIL_GRADIENT: Record<BoosterTypeValue, string> = {
  CHIP: 'linear-gradient(145deg,#50320c,#b78329 45%,#5a390e)',
  HAND: 'linear-gradient(145deg,#1f3657,#4f78c8 45%,#233b60)',
  UTILITY: 'linear-gradient(145deg,#3c4b12,#95ad2f 45%,#3b4a12)',
  FORGE: 'linear-gradient(145deg,#4d1f10,#c65a28 45%,#4c1f10)',
  WILDCARD: 'linear-gradient(145deg,#3f1d62,#9b59d0 45%,#1f4d66)',
  BOUNTY: 'linear-gradient(145deg,#3e1111,#ad3333 45%,#3f1212)',
};

function FoilPack({ type, sold }: { type: BoosterTypeValue; sold?: boolean }) {
  return (
    <div style={{
      width: 70,
      height: 92,
      borderRadius: 10,
      background: FOIL_GRADIENT[type],
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow: sold ? 'none' : '0 6px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)',
      position: 'relative',
      overflow: 'hidden',
      opacity: sold ? 0.45 : 1,
      flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 4px, transparent 4px, transparent 10px)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))' }}>
        {BOOSTER_ICON[type]}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 5, textAlign: 'center', fontFamily: "'VT323',monospace", fontSize: 11, letterSpacing: '0.08em', color: '#f5e9d0' }}>
        BOOSTER
      </div>
    </div>
  );
}

export function Shop({ items, personalChips, onBuy, onRerollBoosters, boosterRerollCost, onViewDeck, onEndShop }: ShopProps) {
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set());
  const snapshotRef = useRef<ShopItem[]>([]);
  if (snapshotRef.current.length === 0 && items.length > 0) snapshotRef.current = items;
  const stableItems = snapshotRef.current.length > 0 ? snapshotRef.current : items;

  function buy(id: string) {
    setSoldIds(prev => new Set([...prev, id]));
    onBuy(id);
  }

  return (
    <div className="flex flex-col gap-3 p-3 w-full">
      <div style={{ textAlign: 'center', fontFamily: "'Press Start 2P',monospace", fontSize: 16, color: '#fbbf24' }}>BOOSTER SHOP</div>

      <div className="flex items-center justify-between">
        <button onClick={() => { playButtonPress(); onViewDeck(); }} className="btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }}>DECK</button>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 28, color: '#fbbf24' }}>💰 {personalChips.toLocaleString()}c</div>
        <button onClick={() => { playButtonPress(); onEndShop(); }} className="btn-primary" style={{ fontSize: 13, padding: '7px 12px' }}>CONTINUE →</button>
      </div>

      <button
        onClick={personalChips >= boosterRerollCost ? () => { playButtonPress(); onRerollBoosters(); } : undefined}
        disabled={personalChips < boosterRerollCost}
        className={personalChips >= boosterRerollCost ? 'btn-secondary' : 'btn-secondary opacity-40'}
        style={{ fontSize: 13, padding: '8px 0' }}
      >
        REROLL BOOSTERS · {boosterRerollCost}c
      </button>

      <div className="grid grid-cols-1 gap-2">
        {stableItems.slice(0, 5).map(item => {
          const sold = soldIds.has(item.id) || item.cost === 0;
          const canBuy = !sold && personalChips >= item.cost;
          const frame = rarityFrame(item.rarity);
          return (
            <div key={item.id} className="shop-card" style={{ borderColor: frame.border, boxShadow: frame.glow, opacity: sold ? 0.55 : 1 }}>
              <div className="flex items-center gap-3">
                <FoilPack type={item.boosterType} sold={sold} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: '#f8d082', lineHeight: 1 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#9ca3af' }}>
                    {sold ? 'SOLD' : item.subtitle}
                  </div>
                  <div style={{ fontFamily: "'VT323',monospace", color: '#6b7280', fontSize: 14, letterSpacing: '0.08em', marginTop: 2 }}>
                    {item.rarity.toUpperCase()}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: '#fbbf24' }}>{sold ? '—' : `${item.cost}c`}</span>
                    <button
                      onClick={canBuy ? () => { playButtonPunch(); buy(item.id); } : undefined}
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
