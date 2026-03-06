import { useRef, useState } from 'react';
import type { ShopItem } from '../game/gameState';
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
            <div key={item.id} className="shop-card" style={{ borderColor: frame.border, boxShadow: frame.glow, opacity: sold ? 0.4 : 1 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: '#f8d082' }}>{item.label}</div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#9ca3af' }}>{sold ? 'Sold' : item.subtitle}</div>
                </div>
                <div style={{ fontFamily: "'VT323',monospace", color: '#6b7280', fontSize: 15 }}>{item.rarity.toUpperCase()}</div>
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
          );
        })}
      </div>
    </div>
  );
}
