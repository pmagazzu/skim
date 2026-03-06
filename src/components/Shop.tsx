import { useState, useRef } from 'react';
import type { ShopItem, UpgradeTypeValue } from '../game/gameState';
import { UPGRADE_DEFS } from '../game/gameState';
import type { Bounty } from '../game/bounties';
import { RARITY_LABELS, RARITY_COLORS, CHIPS } from '../game/chips';
import type { ChipTypeValue } from '../game/chips';
import { ChipArt } from './ChipArt';
import { HAND_NAMES } from '../game/hands';
import type { HandRankValue } from '../game/hands';
import { SCORE_TABLE, handUpgradeCost, handBaseAtLevel } from '../game/scoring';
import { playTabSwitch } from '../audio/sounds';

type ShopTab = 'chips' | 'casino' | 'deck' | 'bounties' | 'upgrades' | 'hands' | 'forge';

interface ShopProps {
  items: ShopItem[];
  personalChips: number;
  consumableCount: number;
  chipCount: number;
  maxChips: number;
  deckSize: number;
  lowCardCount: number;
  availableBounties: Bounty[];
  chipStack: ChipTypeValue[];
  purchasedUpgrades: UpgradeTypeValue[];
  shopDiscount: number;
  handLevels: Record<number, number>;
  shopHandUpgrades: HandRankValue[];
  handRerollCost: number;
  onBuy: (id: string) => void;
  onAcceptBounty: (id: string) => void;
  onSellChip: (index: number) => void;
  onBuyUpgrade: (t: UpgradeTypeValue) => void;
  onBuyHandUpgrade: (rank: HandRankValue) => void;
  onRerollHandUpgrades: () => void;
  onBuyForge: (rarity: 'common' | 'uncommon' | 'rare' | 'legendary') => void;
  currentTheme: 'gold' | 'neon' | 'blood' | 'ice' | 'smoke';
  onSetTheme: (t: 'gold' | 'neon' | 'blood' | 'ice' | 'smoke') => void;
  onViewDeck: () => void;
  onEndShop: () => void;
}

const CONSUMABLE_ICONS: Record<string, string> = {
  SCRATCH_TICKET: '🎫',
  HIGH_CARD_DRAW: '🃏',
  ROULETTE: '🎰',
  BURNED_HAND: '🔥',
};

function RarityBadge({ rarity }: { rarity?: string }) {
  if (!rarity) return null;
  const label = RARITY_LABELS[rarity as keyof typeof RARITY_LABELS] ?? rarity;
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? 'text-gray-400';
  return <span className={`text-sm font-bold ${color}`}>{label}</span>;
}

function ShopCard({ item, canBuy, full, sold, onBuy, lowCardCount = 0 }: {
  item: ShopItem; canBuy: boolean; full: boolean; sold?: boolean; onBuy: () => void; lowCardCount?: number;
}) {
  const rarityGlow =
    item.rarity === 'legendary' ? 'shop-card-legendary' :
    item.rarity === 'rare'      ? 'shop-card-rare' :
    item.rarity === 'uncommon'  ? 'shop-card-uncommon' : '';
  const isChip = item.type === 'chip' && item.chipType;
  const isPack = item.type === 'pack';
  const icon = item.type === 'consumable' && item.consumableType
    ? CONSUMABLE_ICONS[item.consumableType] ?? '🎴'
    : isPack ? null : '📈';
  if (sold) {
    return (
      <div className="shop-card flex items-center justify-center" style={{ opacity: 0.3, minHeight: 80 }}>
        <span style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#4b5563', letterSpacing: '0.1em' }}>SOLD</span>
      </div>
    );
  }

  return (
    <div className={['shop-card flex flex-col gap-2', rarityGlow].join(' ')}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2">
          {isChip ? <ChipArt type={item.chipType!} size={36} /> : icon ? <span className="text-2xl">{icon}</span> : <span className="text-xl opacity-60">📦</span>}
          <div>
            <div className="text-amber-200 font-semibold leading-tight" style={{ fontSize: 15 }}>{item.label}</div>
            {item.rarity && <RarityBadge rarity={item.rarity} />}
          </div>
        </div>
      </div>
      {isPack && (
        <div className="text-sm text-gray-600 flex items-center gap-1">
          <span>Your deck:</span>
          <span className={lowCardCount > 10 ? 'text-amber-600' : 'text-gray-500'}>{lowCardCount} low cards</span>
          {(['FACE_UPGRADE', 'ROYAL_UPGRADE', 'PAIR_UPGRADE'] as string[]).includes(item.packType ?? '') && lowCardCount === 0 && (
            <span className="text-red-600 text-sm">· none to upgrade</span>
          )}
        </div>
      )}
      <div className="text-gray-500 flex-1 leading-relaxed" style={{ fontSize: 13 }}>{item.description}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="gold-glow font-bold chip-counter" style={{ fontSize: 17 }}>{item.cost}c</span>
        <button onClick={canBuy ? onBuy : undefined} disabled={!canBuy}
          style={{ fontSize: 13, padding: '8px 18px', minHeight: 38 }}
          className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40 cursor-default'}>
          {full ? 'FULL' : !canBuy ? 'CAN\'T' : 'BUY'}
        </button>
      </div>
    </div>
  );
}

function BountyCard({ bounty, canAfford, onToggle }: { bounty: Bounty; canAfford: boolean; onToggle: () => void }) {
  const fee = bounty.fee ?? 10;
  const disabled = !bounty.accepted && !canAfford;
  return (
    <div className={['shop-card transition-all', bounty.accepted ? 'border-amber-600/60 bg-amber-950/20' : '', disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'].join(' ')} onClick={disabled ? undefined : onToggle}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-amber-200 font-semibold text-sm">{bounty.title}</div>
          <div className="text-gray-500 text-sm mt-0.5 leading-relaxed">{bounty.description}</div>
        </div>
        <div className={['text-sm px-2 py-1 rounded border shrink-0', bounty.accepted ? 'border-amber-600 text-amber-400 bg-amber-950/40' : 'border-gray-700 text-gray-600'].join(' ')}>
          {bounty.accepted ? '✓ ON' : 'OFF'}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-emerald-500 font-semibold">🎁 {bounty.rewardLabel}</span>
        <span className={`text-sm font-semibold ${bounty.accepted ? 'text-gray-600 line-through' : 'text-amber-600'}`}>
          {bounty.accepted ? `refund ${fee}c` : `${fee}c to accept`}
        </span>
      </div>
    </div>
  );
}

function OwnedChipRow({ chip, index, personalChips, onSell }: {
  chip: ChipTypeValue; index: number; personalChips: number; onSell: () => void;
}) {
  const def = CHIPS[chip];
  const refund = Math.floor(def.cost * 0.45);
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <ChipArt type={chip} size={32} />
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: '#fde68a', lineHeight: 1.2 }}>{def.name}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#4b5563' }}>{def.description}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <button onClick={onSell} title={`Sell for ${refund}c`}
          style={{ fontSize: 13, padding: '6px 12px', minHeight: 36 }}
          className="border border-red-900/60 text-red-500 rounded hover:bg-red-950/30 transition-colors">
          SELL {refund}c
        </button>
      </div>
    </div>
  );
}

const HAND_ICONS: Record<number, string> = {
  1:'🃏', 2:'👯', 3:'✌️', 4:'🎰', 5:'➡️', 6:'♠️', 7:'🏠', 8:'⚡', 9:'🌊', 10:'👑',
};

function HandUpgradeCard({ rank, level, canBuy, discount, onBuy }: {
  rank: HandRankValue; level: number; canBuy: boolean; discount: number; onBuy: () => void;
}) {
  const cfg = SCORE_TABLE[rank];
  const currentBase = handBaseAtLevel(rank, level);
  const nextBase = handBaseAtLevel(rank, level + 1);
  const rawCost = handUpgradeCost(rank, level);
  const cost = Math.max(1, Math.ceil(rawCost * (1 - discount)));
  return (
    <div className="shop-card flex items-center gap-3" style={{ padding: '12px 14px' }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>{HAND_ICONS[rank]}</span>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#fde68a', lineHeight: 1.2 }}>{HAND_NAMES[rank]}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#4b5563' }}>
          {currentBase} → <span style={{ color: '#4ade80' }}>{nextBase}</span> chips · ×{cfg.mult}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#a78bfa' }}>Lv.{level}</span>
        <button onClick={canBuy ? onBuy : undefined} disabled={!canBuy}
          style={{ fontSize: 13, padding: '7px 14px', minHeight: 36 }}
          className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40 cursor-default'}>
          {cost}c UP
        </button>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={() => { playTabSwitch(); onClick(); }} style={{ whiteSpace: 'nowrap', flexShrink: 0, fontSize: 11, padding: '8px 12px', minHeight: 40 }} className={['relative rounded transition-all', active ? 'btn-primary' : 'btn-secondary'].join(' ')}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-black text-sm flex items-center justify-center font-bold" style={{ fontSize: 9 }}>{badge}</span>
      )}
    </button>
  );
}

export function Shop({
  items, personalChips, consumableCount, chipCount, maxChips, deckSize, lowCardCount,
  availableBounties, chipStack, purchasedUpgrades, shopDiscount,
  handLevels, shopHandUpgrades, handRerollCost,
  onBuy, onAcceptBounty, onSellChip, onBuyUpgrade, onBuyHandUpgrade, onRerollHandUpgrades, onBuyForge, currentTheme, onSetTheme, onViewDeck, onEndShop,
}: ShopProps) {
  const [tab, setTab] = useState<ShopTab>('chips');
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set());

  // Snapshot items once per shop mount.
  // This prevents reflow when purchased items are removed from live state.
  // New shop visits remount this component, so snapshot refreshes naturally.
  const snapshotRef = useRef<ShopItem[]>([]);
  if (snapshotRef.current.length === 0 && items.length > 0) {
    snapshotRef.current = items;
  }

  // Use stable snapshot for rendering; live `items` only for sold detection
  const stableItems = snapshotRef.current.length > 0 ? snapshotRef.current : items;
  const liveIds = new Set(items.map(i => i.id));

  function handleBuy(id: string) {
    setSoldIds(prev => new Set([...prev, id]));
    onBuy(id);
  }

  const chipItems    = stableItems.filter(i => i.type === 'chip');
  const casinoItems  = stableItems.filter(i => i.type === 'consumable' || i.type === 'skim-upgrade');
  const packItems    = stableItems.filter(i => i.type === 'pack');

  return (
    <div className="flex flex-col gap-4 p-3 w-full" style={{ overflowY: 'visible' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="title-font text-2xl gold-glow tracking-widest">— SHOP —</div>
        <div className="flex flex-col items-end gap-0.5">
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#6b7280' }}>
            Bank: <span className="gold-glow chip-counter" style={{ fontSize: 22 }}>{personalChips.toLocaleString()}c</span>
            {shopDiscount > 0 && <span style={{ color: '#4ade80', fontSize: 15, marginLeft: 8 }}>-{Math.round(shopDiscount * 100)}% off</span>}
          </div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#4b5563', display: 'flex', gap: 12 }}>
            <span>Deck: {deckSize}</span>
            <span>Chips: {chipCount}/{maxChips}</span>
            <button onClick={onViewDeck} style={{ color: '#92400e', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>View Deck</button>
          </div>
        </div>
      </div>

      {/* Your Stack — always visible */}
      {chipStack.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#4b5563', letterSpacing: '0.1em' }}>YOUR STACK</span>
            <div className="flex-1 h-px bg-white/5" />
            <span style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#4b5563' }}>sell = 45% back</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {chipStack.map((chip, i) => (
              <OwnedChipRow key={`${chip}-${i}`} chip={chip} index={i} personalChips={personalChips} onSell={() => onSellChip(i)} />
            ))}
          </div>
        </div>
      )}

      {/* Tab nav — single row, no wrap */}
      <div className="flex gap-1" style={{ overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', paddingTop: 8, paddingBottom: 2, touchAction: 'pan-x', overscrollBehaviorX: 'contain' } as React.CSSProperties}>
        <TabButton label="CHIPS"    active={tab === 'chips'}    onClick={() => setTab('chips')}    badge={chipItems.length} />
        <TabButton label="CASINO"   active={tab === 'casino'}   onClick={() => setTab('casino')}   badge={casinoItems.length} />
        <TabButton label="DECK"     active={tab === 'deck'}     onClick={() => setTab('deck')}     badge={packItems.length} />
        <TabButton label="HANDS"    active={tab === 'hands'}    onClick={() => setTab('hands')}    badge={shopHandUpgrades.length} />
        <TabButton label="BOUNTIES" active={tab === 'bounties'} onClick={() => setTab('bounties')} badge={availableBounties.filter(b => !b.accepted).length} />
        <TabButton label="UPGRADES" active={tab === 'upgrades'} onClick={() => setTab('upgrades')} />
        <TabButton label="FORGE"    active={tab === 'forge'}    onClick={() => setTab('forge')} />
      </div>

      {/* Tab: Chips */}
      {tab === 'chips' && (
        <div className="grid grid-cols-2 gap-3">
          {chipItems.map(item => {
            const isSold = soldIds.has(item.id) || !liveIds.has(item.id);
            const full = chipCount >= maxChips;
            const canBuy = !isSold && personalChips >= item.cost && !full;
            return <ShopCard key={item.id} item={item} canBuy={canBuy} full={full} sold={isSold} onBuy={() => handleBuy(item.id)} />;
          })}
        </div>
      )}

      {/* Tab: Casino */}
      {tab === 'casino' && (
        <div className="flex flex-col gap-3">
          {casinoItems.map(item => {
            const isSold = soldIds.has(item.id) || !liveIds.has(item.id);
            const full = item.type === 'consumable' && consumableCount >= 4;
            const canBuy = !isSold && personalChips >= item.cost && !full;
            return <ShopCard key={item.id} item={item} canBuy={canBuy} full={full} sold={isSold} onBuy={() => handleBuy(item.id)} />;
          })}
        </div>
      )}

      {/* Tab: Deck */}
      {tab === 'deck' && (
        <div className="flex flex-col gap-3">
          {packItems.map(item => {
            const isSold = soldIds.has(item.id) || !liveIds.has(item.id);
            const canBuy = !isSold && personalChips >= item.cost;
            return <ShopCard key={item.id} item={item} canBuy={canBuy} full={false} sold={isSold} onBuy={() => handleBuy(item.id)} lowCardCount={lowCardCount} />;
          })}
          {packItems.length === 0 && <div className="text-gray-600 text-sm text-center py-4">No packs available this round.</div>}
        </div>
      )}

      {/* Tab: Hands */}
      {tab === 'hands' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {shopHandUpgrades.map(rank => (
              <HandUpgradeCard
                key={rank}
                rank={rank}
                level={handLevels[rank] ?? 1}
                canBuy={personalChips >= Math.max(1, Math.ceil(handUpgradeCost(rank, handLevels[rank] ?? 1) * (1 - shopDiscount)))}
                discount={shopDiscount}
                onBuy={() => onBuyHandUpgrade(rank)}
              />
            ))}
            {shopHandUpgrades.length === 0 && (
              <div className="text-gray-600 text-sm text-center py-4">No hand upgrades this visit.</div>
            )}
          </div>
          {/* Reroll */}
          <button
            onClick={personalChips >= handRerollCost ? onRerollHandUpgrades : undefined}
            disabled={personalChips < handRerollCost}
            style={{ fontSize: 14, padding: '10px 0', width: '100%' }}
            className={personalChips >= handRerollCost ? 'btn-secondary' : 'btn-secondary opacity-30 cursor-default'}
          >
            🎲 Reroll for {handRerollCost}c
          </button>
          {/* All hand levels reference */}
          <div className="border-t border-white/5 pt-2">
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#4b5563', letterSpacing: '0.1em', marginBottom: 8 }}>ALL HAND LEVELS</div>
            <div className="flex flex-col gap-1">
              {(Object.keys(SCORE_TABLE) as unknown as HandRankValue[]).map(Number).map((r: HandRankValue) => {
                const lv = handLevels[r] ?? 1;
                return (
                  <div key={r} className="flex items-center justify-between px-2 py-1.5 rounded bg-white/[0.02]">
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#9ca3af' }}>{HAND_NAMES[r]}</span>
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: lv > 1 ? '#a78bfa' : '#6b5a3e' }}>Lv.{lv} · {handBaseAtLevel(r, lv)}c</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bounties */}
      {tab === 'bounties' && (
        <div className="flex flex-col gap-2">
          {availableBounties.map(b => (
            <BountyCard key={b.id} bounty={b} canAfford={personalChips >= (b.fee ?? 10)} onToggle={() => onAcceptBounty(b.id)} />
          ))}
          {availableBounties.length === 0 && <div className="text-gray-600 text-sm text-center py-4">No bounties available.</div>}
        </div>
      )}

      {/* Tab: Upgrades */}
      {tab === 'upgrades' && (
        <div className="flex flex-col gap-2">
          {(Object.keys(UPGRADE_DEFS) as UpgradeTypeValue[]).map(key => {
            const def = UPGRADE_DEFS[key];
            const owned = purchasedUpgrades.includes(key);
            const discountedCost = Math.max(1, Math.floor(def.cost * (1 - shopDiscount)));
            const canBuy = !owned && personalChips >= discountedCost;
            return (
              <div key={key} className={['shop-card flex flex-col gap-1.5', owned ? 'opacity-60' : ''].join(' ')}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{def.icon}</span>
                  <div className="flex-1">
                    <div className="text-amber-200 font-semibold text-sm">{def.label}</div>
                    <div className="text-gray-500 text-sm leading-relaxed">{def.description}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={owned ? 'text-emerald-500 text-sm font-bold' : 'gold-glow font-bold text-sm chip-counter'}>
                    {owned ? '✓ OWNED' : `${discountedCost}c`}
                  </span>
                  {!owned && (
                    <button onClick={canBuy ? () => onBuyUpgrade(key) : undefined} disabled={!canBuy}
                      className={canBuy ? 'btn-primary text-sm px-4 py-1.5' : 'btn-secondary text-sm px-4 py-1.5 opacity-40 cursor-default'}>
                      BUY
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Forge */}
      {tab === 'forge' && (
        <div className="flex flex-col gap-4">
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: '#6b5a3e', lineHeight: 1.8 }}>
            Apply a random modifier to a random unmodified card in your deck.
            Higher rarity = more powerful effects.
          </div>
          {([
            { rarity: 'common' as const,    cost: 20,  label: '💎 Common Forge',    desc: 'Polished (+10c) or Scarred (+15c)',           color: '#d1d5db' },
            { rarity: 'uncommon' as const,  cost: 45,  label: '⚡ Uncommon Forge',  desc: 'Charged, Hot (×1.5), or Wild (any suit)',    color: '#a78bfa' },
            { rarity: 'rare' as const,      cost: 90,  label: '💣 Rare Forge',      desc: 'Volatile (+50/−20) or Ghost (rank-hidden)',   color: '#f87171' },
            { rarity: 'legendary' as const, cost: 200, label: '💀 Legendary Forge', desc: 'Cursed (+80, burns) or Mimic (copy modifier)', color: '#fbbf24' },
          ]).map(({ rarity, cost, label, desc, color }) => {
            const canAfford = personalChips >= cost;
            return (
              <div key={rarity} className="shop-card flex flex-col gap-2">
                <div style={{ color, fontFamily: "'Press Start 2P',monospace", fontSize: 9 }}>{label}</div>
                <div className="text-gray-500 text-sm">{desc}</div>
                <div className="flex items-center justify-between">
                  <span className="gold-glow font-bold text-sm chip-counter">{cost}c</span>
                  <button
                    onClick={canAfford ? () => onBuyForge(rarity) : undefined}
                    disabled={!canAfford}
                    className={canAfford ? 'btn-primary text-sm px-4 py-1.5' : 'btn-secondary text-sm px-4 py-1.5 opacity-40 cursor-default'}
                  >
                    FORGE
                  </button>
                </div>
              </div>
            );
          })}
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#4b5563', textAlign: 'center' }}>
            Cards already modified cannot be targeted again.
          </div>
        </div>
      )}

      {/* Theme switcher */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>COLOR THEME</div>
        <div className="flex gap-2 justify-center flex-wrap">
          {([
            { id: 'gold',  label: '🟡', title: 'GOLD'  },
            { id: 'neon',  label: '🔵', title: 'NEON'  },
            { id: 'blood', label: '🔴', title: 'BLOOD' },
            { id: 'ice',   label: '🩵', title: 'ICE'   },
            { id: 'smoke', label: '⬜', title: 'SMOKE' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => onSetTheme(t.id)} title={t.title}
              style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: 9,
                padding: '6px 10px', borderRadius: 6, cursor: 'pointer', minHeight: 36,
                background: currentTheme === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${currentTheme === t.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: currentTheme === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>
              {t.label} {t.title}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onEndShop} className="btn-primary w-full mt-2" style={{ fontSize: 16, padding: '14px 0' }}>
        NEXT ROUND →
      </button>
    </div>
  );
}
