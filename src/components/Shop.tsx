import { useState } from 'react';
import type { ShopItem, UpgradeTypeValue } from '../game/gameState';
import { UPGRADE_DEFS } from '../game/gameState';
import type { Bounty } from '../game/bounties';
import { RARITY_LABELS, RARITY_COLORS, CHIPS } from '../game/chips';
import type { ChipTypeValue } from '../game/chips';
import { ChipArt } from './ChipArt';
import { HAND_NAMES } from '../game/hands';
import type { HandRankValue } from '../game/hands';
import { SCORE_TABLE, handUpgradeCost, handBaseAtLevel } from '../game/scoring';

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
  return <span className={`text-xs font-bold ${color}`}>{label}</span>;
}

function ShopCard({ item, canBuy, full, onBuy, lowCardCount = 0 }: {
  item: ShopItem; canBuy: boolean; full: boolean; onBuy: () => void; lowCardCount?: number;
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
  return (
    <div className={['shop-card flex flex-col gap-2', rarityGlow].join(' ')}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2">
          {isChip ? <ChipArt type={item.chipType!} size={36} /> : icon ? <span className="text-2xl">{icon}</span> : <span className="text-xl opacity-60">📦</span>}
          <div>
            <div className="text-amber-200 font-semibold text-sm leading-tight">{item.label}</div>
            {item.rarity && <RarityBadge rarity={item.rarity} />}
          </div>
        </div>
      </div>
      {isPack && (
        <div className="text-xs text-gray-600 flex items-center gap-1">
          <span>Your deck:</span>
          <span className={lowCardCount > 10 ? 'text-amber-600' : 'text-gray-500'}>{lowCardCount} low cards</span>
          {(['FACE_UPGRADE', 'ROYAL_UPGRADE', 'PAIR_UPGRADE'] as string[]).includes(item.packType ?? '') && lowCardCount === 0 && (
            <span className="text-red-600 text-xs">· none to upgrade</span>
          )}
        </div>
      )}
      <div className="text-gray-500 text-xs flex-1 leading-relaxed">{item.description}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="gold-glow font-bold text-sm chip-counter">{item.cost}c</span>
        <button onClick={canBuy ? onBuy : undefined} disabled={!canBuy}
          className={canBuy ? 'btn-primary text-xs px-4 py-1.5' : 'btn-secondary text-xs px-4 py-1.5 opacity-40 cursor-default'}>
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
          <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{bounty.description}</div>
        </div>
        <div className={['text-xs px-2 py-1 rounded border shrink-0', bounty.accepted ? 'border-amber-600 text-amber-400 bg-amber-950/40' : 'border-gray-700 text-gray-600'].join(' ')}>
          {bounty.accepted ? '✓ ON' : 'OFF'}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-emerald-500 font-semibold">🎁 {bounty.rewardLabel}</span>
        <span className={`text-xs font-semibold ${bounty.accepted ? 'text-gray-600 line-through' : 'text-amber-600'}`}>
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
        <div className="text-amber-200 text-sm font-semibold leading-tight">{def.name}</div>
        <div className="text-gray-600 text-xs truncate">{def.description}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-gray-600 text-xs">slot {index + 1}</span>
        <button onClick={onSell} title={`Sell for ${refund}c`}
          className="text-xs px-2 py-0.5 border border-red-900/60 text-red-500 rounded hover:bg-red-950/30 transition-colors">
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
    <div className="shop-card flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{HAND_ICONS[rank]}</span>
        <div className="flex-1">
          <div className="text-amber-200 font-semibold text-sm">{HAND_NAMES[rank]}</div>
          <div className="text-gray-600 text-xs">Level {level} → {level + 1}</div>
        </div>
        <div className="text-xs text-emerald-400 font-mono shrink-0">Lv.{level}</div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Base: <span className="text-gray-400">{currentBase}</span> → <span className="text-emerald-400">{nextBase}</span></span>
        <span className="text-gray-600">×{cfg.mult} mult</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="gold-glow font-bold text-sm chip-counter">{cost}c</span>
        <button onClick={canBuy ? onBuy : undefined} disabled={!canBuy}
          className={canBuy ? 'btn-primary text-xs px-4 py-1.5' : 'btn-secondary text-xs px-4 py-1.5 opacity-40 cursor-default'}>
          UPGRADE
        </button>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} style={{ whiteSpace: 'nowrap', flexShrink: 0, fontSize: 10, padding: '4px 8px' }} className={['relative rounded transition-all', active ? 'btn-primary' : 'btn-secondary'].join(' ')}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-black text-xs flex items-center justify-center font-bold" style={{ fontSize: 9 }}>{badge}</span>
      )}
    </button>
  );
}

export function Shop({
  items, personalChips, consumableCount, chipCount, maxChips, deckSize, lowCardCount,
  availableBounties, chipStack, purchasedUpgrades, shopDiscount,
  handLevels, shopHandUpgrades, handRerollCost,
  onBuy, onAcceptBounty, onSellChip, onBuyUpgrade, onBuyHandUpgrade, onRerollHandUpgrades, onBuyForge, onViewDeck, onEndShop,
}: ShopProps) {
  const [tab, setTab] = useState<ShopTab>('chips');

  const chipItems    = items.filter(i => i.type === 'chip');
  const casinoItems  = items.filter(i => i.type === 'consumable' || i.type === 'skim-upgrade');
  const packItems    = items.filter(i => i.type === 'pack');

  return (
    <div className="flex flex-col gap-4 p-5 w-full max-w-2xl mx-auto" style={{ overflowY: 'visible' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="title-font text-2xl gold-glow tracking-widest">— SHOP —</div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="text-gray-500 text-sm">
            Bank: <span className="gold-glow font-bold chip-counter">{personalChips.toLocaleString()}</span>
            {shopDiscount > 0 && <span className="text-emerald-500 text-xs ml-2">(-{Math.round(shopDiscount * 100)}% off)</span>}
          </div>
          <div className="flex items-center gap-3 text-gray-700 text-xs">
            <span>Deck: {deckSize}</span>
            <span>Chips: {chipCount}/{maxChips}</span>
            <button onClick={onViewDeck} className="text-amber-700 hover:text-amber-500 underline underline-offset-2 transition-colors">View Deck</button>
          </div>
        </div>
      </div>

      {/* Your Stack — always visible */}
      {chipStack.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span className="section-label">Your Stack</span>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-gray-700 text-xs">sell for 45% back</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {chipStack.map((chip, i) => (
              <OwnedChipRow key={`${chip}-${i}`} chip={chip} index={i} personalChips={personalChips} onSell={() => onSellChip(i)} />
            ))}
          </div>
        </div>
      )}

      {/* Tab nav — single row, no wrap */}
      <div className="flex gap-1" style={{ overflowX: 'auto', overflowY: 'visible', scrollbarWidth: 'none', paddingTop: 8, paddingBottom: 2 }}>
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
        <div className="grid grid-cols-3 gap-2">
          {chipItems.map(item => {
            const full = chipCount >= maxChips;
            const canBuy = personalChips >= item.cost && !full;
            return <ShopCard key={item.id} item={item} canBuy={canBuy} full={full} onBuy={() => onBuy(item.id)} />;
          })}
        </div>
      )}

      {/* Tab: Casino */}
      {tab === 'casino' && (
        <div className="grid grid-cols-2 gap-2">
          {casinoItems.map(item => {
            const full = item.type === 'consumable' && consumableCount >= 4;
            const canBuy = personalChips >= item.cost && !full;
            return <ShopCard key={item.id} item={item} canBuy={canBuy} full={full} onBuy={() => onBuy(item.id)} />;
          })}
        </div>
      )}

      {/* Tab: Deck */}
      {tab === 'deck' && (
        <div className="grid grid-cols-2 gap-2">
          {packItems.map(item => {
            const canBuy = personalChips >= item.cost;
            return <ShopCard key={item.id} item={item} canBuy={canBuy} full={false} onBuy={() => onBuy(item.id)} lowCardCount={lowCardCount} />;
          })}
          {packItems.length === 0 && <div className="text-gray-600 text-sm col-span-2 text-center py-4">No packs available this round.</div>}
        </div>
      )}

      {/* Tab: Hands */}
      {tab === 'hands' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
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
              <div className="col-span-2 text-gray-600 text-sm text-center py-4">No hand upgrades this visit.</div>
            )}
          </div>
          {/* Reroll */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="text-gray-600 text-xs">Don't like these? Reroll for new options.</div>
            <button
              onClick={personalChips >= handRerollCost ? onRerollHandUpgrades : undefined}
              disabled={personalChips < handRerollCost}
              className={personalChips >= handRerollCost ? 'btn-secondary text-xs px-3 py-1' : 'btn-secondary text-xs px-3 py-1 opacity-30 cursor-default'}
            >
              🎲 Reroll ({handRerollCost}c)
            </button>
          </div>
          {/* All hand levels reference */}
          <div className="border-t border-white/5 pt-2">
            <div className="section-label mb-2">All Hand Levels</div>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(SCORE_TABLE) as unknown as HandRankValue[]).map(Number).map((r: HandRankValue) => {
                const lv = handLevels[r] ?? 1;
                return (
                  <div key={r} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-white/[0.02]">
                    <span className="text-gray-500">{HAND_NAMES[r]}</span>
                    <span className="text-amber-600 font-mono">Lv.{lv} · {handBaseAtLevel(r, lv)}+</span>
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
                    <div className="text-gray-500 text-xs leading-relaxed">{def.description}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={owned ? 'text-emerald-500 text-xs font-bold' : 'gold-glow font-bold text-sm chip-counter'}>
                    {owned ? '✓ OWNED' : `${discountedCost}c`}
                  </span>
                  {!owned && (
                    <button onClick={canBuy ? () => onBuyUpgrade(key) : undefined} disabled={!canBuy}
                      className={canBuy ? 'btn-primary text-xs px-4 py-1.5' : 'btn-secondary text-xs px-4 py-1.5 opacity-40 cursor-default'}>
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
                <div className="text-gray-500 text-xs">{desc}</div>
                <div className="flex items-center justify-between">
                  <span className="gold-glow font-bold text-sm chip-counter">{cost}c</span>
                  <button
                    onClick={canAfford ? () => onBuyForge(rarity) : undefined}
                    disabled={!canAfford}
                    className={canAfford ? 'btn-primary text-xs px-4 py-1.5' : 'btn-secondary text-xs px-4 py-1.5 opacity-40 cursor-default'}
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

      <button onClick={onEndShop} className="btn-primary text-base px-12 self-center mt-2">
        NEXT ROUND →
      </button>
    </div>
  );
}
