import type { ShopItem, UpgradeTypeValue } from '../game/gameState';
import { UPGRADE_DEFS } from '../game/gameState';
import type { Bounty } from '../game/bounties';
import { RARITY_LABELS, RARITY_COLORS, CHIPS } from '../game/chips';
import type { ChipTypeValue } from '../game/chips';
import { ChipArt } from './ChipArt';
import { HAND_NAMES } from '../game/hands';
import type { HandRankValue } from '../game/hands';
import { SCORE_TABLE, handUpgradeCost, handBaseAtLevel } from '../game/scoring';
import { playButtonPunch } from '../audio/sounds';

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

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#6b5a3e', letterSpacing: '0.12em' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

function RarityBadge({ rarity }: { rarity?: string }) {
  if (!rarity) return null;
  const label = RARITY_LABELS[rarity as keyof typeof RARITY_LABELS] ?? rarity;
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? 'text-gray-400';
  return <span className={`text-sm font-bold ${color}`}>{label}</span>;
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
      <div className="flex items-start gap-2">
        {isChip ? <ChipArt type={item.chipType!} size={34} /> : icon ? <span style={{ fontSize: 22 }}>{icon}</span> : <span style={{ fontSize: 20, opacity: 0.6 }}>📦</span>}
        <div className="flex-1 min-w-0">
          <div style={{ color: '#fde68a', fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{item.label}</div>
          {item.rarity && <RarityBadge rarity={item.rarity} />}
        </div>
      </div>
      {isPack && lowCardCount > 0 && (
        <div style={{ fontSize: 12, color: '#6b7280' }}>Deck: {lowCardCount} low cards</div>
      )}
      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, flex: 1 }}>{item.description}</div>
      <div className="flex items-center justify-between">
        <span className="gold-glow font-bold chip-counter" style={{ fontSize: 16 }}>{item.cost}c</span>
        <button onClick={canBuy ? (e) => {
          playButtonPunch();
          const btn = e.currentTarget as HTMLButtonElement;
          btn.classList.add('btn-punch');
          setTimeout(() => btn.classList.remove('btn-punch'), 220);
          onBuy();
        } : undefined} disabled={!canBuy}
          style={{ fontSize: 13, padding: '7px 16px', minHeight: 36 }}
          className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40 cursor-default'}>
          {full ? 'FULL' : !canBuy ? "CAN'T" : 'BUY'}
        </button>
      </div>
    </div>
  );
}

function BountyCard({ bounty, canAfford, onToggle }: { bounty: Bounty; canAfford: boolean; onToggle: () => void }) {
  const fee = bounty.fee ?? 10;
  const disabled = !bounty.accepted && !canAfford;
  return (
    <div
      className={['shop-card transition-all', bounty.accepted ? 'border-amber-600/60 bg-amber-950/20' : '', disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'].join(' ')}
      onClick={disabled ? undefined : onToggle}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div style={{ color: '#fde68a', fontWeight: 600, fontSize: 13 }}>{bounty.title}</div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>{bounty.description}</div>
        </div>
        <div className={['text-sm px-2 py-1 rounded border shrink-0', bounty.accepted ? 'border-amber-600 text-amber-400 bg-amber-950/40' : 'border-gray-700 text-gray-600'].join(' ')}>
          {bounty.accepted ? '✓ ON' : 'OFF'}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>🎁 {bounty.rewardLabel}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: bounty.accepted ? '#4b5563' : '#d97706', textDecoration: bounty.accepted ? 'line-through' : 'none' }}>
          {bounty.accepted ? `refund ${fee}c` : `${fee}c to accept`}
        </span>
      </div>
    </div>
  );
}

function OwnedChipRow({ chip, personalChips, onSell }: {
  chip: ChipTypeValue; personalChips: number; onSell: () => void;
}) {
  const def = CHIPS[chip];
  const refund = Math.floor(def.cost * 0.45);
  void personalChips;
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-white/5 bg-white/[0.02]">
      <ChipArt type={chip} size={30} />
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#fde68a', lineHeight: 1.2 }}>{def.name}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#4b5563' }}>{def.description}</div>
      </div>
      <button onClick={onSell}
        style={{ fontSize: 12, padding: '5px 10px', minHeight: 32, flexShrink: 0 }}
        className="border border-red-900/60 text-red-500 rounded hover:bg-red-950/30 transition-colors">
        SELL {refund}c
      </button>
    </div>
  );
}

function HandUpgradeCard({ rank, level, canBuy, discount, onBuy }: {
  rank: HandRankValue; level: number; canBuy: boolean; discount: number; onBuy: () => void;
}) {
  const cfg = SCORE_TABLE[rank];
  const currentBase = handBaseAtLevel(rank, level);
  const nextBase = handBaseAtLevel(rank, level + 1);
  const rawCost = handUpgradeCost(rank, level);
  const cost = Math.max(1, Math.ceil(rawCost * (1 - discount)));
  return (
    <div className="shop-card flex items-center gap-3" style={{ padding: '10px 12px' }}>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: '#fde68a', lineHeight: 1.2 }}>{HAND_NAMES[rank]}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#4b5563' }}>
          {currentBase} → <span style={{ color: '#4ade80' }}>{nextBase}</span> · ×{cfg.mult}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#a78bfa' }}>Lv.{level}</span>
        <button onClick={canBuy ? onBuy : undefined} disabled={!canBuy}
          style={{ fontSize: 12, padding: '6px 12px', minHeight: 32 }}
          className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40 cursor-default'}>
          {cost}c UP
        </button>
      </div>
    </div>
  );
}

// ── Main Shop ──────────────────────────────────────────────────────────────

export function Shop({
  items, personalChips, consumableCount, chipCount, maxChips, deckSize, lowCardCount,
  availableBounties, chipStack, purchasedUpgrades, shopDiscount,
  handLevels, shopHandUpgrades, handRerollCost,
  onBuy, onAcceptBounty, onSellChip, onBuyUpgrade, onBuyHandUpgrade, onRerollHandUpgrades, onBuyForge,
  currentTheme, onSetTheme, onViewDeck, onEndShop,
}: ShopProps) {
  const chipItems   = items.filter(i => i.type === 'chip');
  const casinoItems = items.filter(i => i.type === 'consumable' || i.type === 'skim-upgrade');
  const packItems   = items.filter(i => i.type === 'pack');
  // Show up to 2 bounties in the shop
  const shopBounties = availableBounties.slice(0, 2);

  return (
    <div className="flex flex-col gap-4 p-3 w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="title-font text-2xl gold-glow tracking-widest">— SHOP —</div>
        <div className="flex flex-col items-end gap-0.5">
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#6b7280' }}>
            Bank: <span className="gold-glow chip-counter" style={{ fontSize: 22 }}>{personalChips.toLocaleString()}c</span>
            {shopDiscount > 0 && <span style={{ color: '#4ade80', fontSize: 14, marginLeft: 8 }}>-{Math.round(shopDiscount * 100)}% off</span>}
          </div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#4b5563', display: 'flex', gap: 10 }}>
            <span>Deck: {deckSize}</span>
            <span>Chips: {chipCount}/{maxChips}</span>
            <button onClick={onViewDeck} style={{ color: '#92400e', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
              View
            </button>
          </div>
        </div>
      </div>

      {/* ── CHIPS ───────────────────────────────────────────── */}
      {chipItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader icon="🪙" label="CHIPS" />
          <div className="grid grid-cols-2 gap-2">
            {chipItems.map(item => {
              const full = chipCount >= maxChips;
              const canBuy = personalChips >= item.cost && !full;
              return <ShopCard key={item.id} item={item} canBuy={canBuy} full={full} onBuy={() => onBuy(item.id)} />;
            })}
          </div>
        </div>
      )}

      {/* ── CASINO ──────────────────────────────────────────── */}
      {casinoItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader icon="🎰" label="CASINO" />
          <div className="flex flex-col gap-2">
            {casinoItems.map(item => {
              const full = item.type === 'consumable' && consumableCount >= 4;
              const canBuy = personalChips >= item.cost && !full;
              return <ShopCard key={item.id} item={item} canBuy={canBuy} full={full} onBuy={() => onBuy(item.id)} />;
            })}
          </div>
        </div>
      )}

      {/* ── DECK ────────────────────────────────────────────── */}
      {packItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader icon="📦" label="DECK" />
          <div className="flex flex-col gap-2">
            {packItems.map(item => {
              const canBuy = personalChips >= item.cost;
              return <ShopCard key={item.id} item={item} canBuy={canBuy} full={false} onBuy={() => onBuy(item.id)} lowCardCount={lowCardCount} />;
            })}
          </div>
        </div>
      )}

      {/* ── HANDS ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionHeader icon="🃏" label="HANDS" />
        {shopHandUpgrades.length > 0 ? (
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
          </div>
        ) : (
          <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>No upgrades this visit.</div>
        )}
        <button
          onClick={personalChips >= handRerollCost ? onRerollHandUpgrades : undefined}
          disabled={personalChips < handRerollCost}
          style={{ fontSize: 13, padding: '8px 0', width: '100%' }}
          className={personalChips >= handRerollCost ? 'btn-secondary' : 'btn-secondary opacity-30 cursor-default'}
        >
          🎲 Reroll hands — {handRerollCost}c
        </button>
      </div>

      {/* ── BOUNTIES ────────────────────────────────────────── */}
      {shopBounties.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader icon="🎯" label="BOUNTIES" />
          {shopBounties.map(b => (
            <BountyCard key={b.id} bounty={b} canAfford={personalChips >= (b.fee ?? 10)} onToggle={() => onAcceptBounty(b.id)} />
          ))}
        </div>
      )}

      {/* ── FORGE ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionHeader icon="⚒" label="FORGE" />
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#4b5563', lineHeight: 1.6, marginBottom: 2 }}>
          Apply a random modifier to a random unmodified card in your deck.
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { rarity: 'common' as const,    cost: 20,  label: 'Common',    desc: 'Polished or Scarred',     color: '#d1d5db' },
            { rarity: 'uncommon' as const,  cost: 45,  label: 'Uncommon',  desc: 'Charged, Hot, or Wild',   color: '#a78bfa' },
            { rarity: 'rare' as const,      cost: 90,  label: 'Rare',      desc: 'Volatile or Ghost',       color: '#f87171' },
            { rarity: 'legendary' as const, cost: 200, label: 'Legendary', desc: 'Cursed or Mimic',         color: '#fbbf24' },
          ]).map(({ rarity, cost, label, desc, color }) => {
            const canAfford = personalChips >= cost;
            return (
              <div key={rarity} className="shop-card flex flex-col gap-1.5" style={{ padding: '10px 12px' }}>
                <div style={{ color, fontFamily: "'VT323',monospace", fontSize: 15 }}>{label}</div>
                <div style={{ color: '#6b7280', fontSize: 12, flex: 1 }}>{desc}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="gold-glow font-bold chip-counter" style={{ fontSize: 14 }}>{cost}c</span>
                  <button
                    onClick={canAfford ? () => onBuyForge(rarity) : undefined}
                    disabled={!canAfford}
                    style={{ fontSize: 12, padding: '5px 12px', minHeight: 30 }}
                    className={canAfford ? 'btn-primary' : 'btn-secondary opacity-40 cursor-default'}>
                    FORGE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── UPGRADES ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionHeader icon="🔧" label="UPGRADES" />
        <div className="flex flex-col gap-2">
          {(Object.keys(UPGRADE_DEFS) as UpgradeTypeValue[]).map(key => {
            const def = UPGRADE_DEFS[key];
            const owned = purchasedUpgrades.includes(key);
            const discountedCost = Math.max(1, Math.floor(def.cost * (1 - shopDiscount)));
            const canBuy = !owned && personalChips >= discountedCost;
            return (
              <div key={key} className={['shop-card flex items-center gap-3', owned ? 'opacity-50' : ''].join(' ')} style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{def.icon}</span>
                <div className="flex-1 min-w-0">
                  <div style={{ color: '#fde68a', fontWeight: 600, fontSize: 13 }}>{def.label}</div>
                  <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>{def.description}</div>
                </div>
                <div className="shrink-0">
                  {owned ? (
                    <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700 }}>✓</span>
                  ) : (
                    <button onClick={canBuy ? () => onBuyUpgrade(key) : undefined} disabled={!canBuy}
                      style={{ fontSize: 12, padding: '5px 12px', minHeight: 32 }}
                      className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40 cursor-default'}>
                      {discountedCost}c
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── YOUR STACK ──────────────────────────────────────── */}
      {chipStack.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <SectionHeader icon="🎰" label="YOUR STACK" />
            <span style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#4b5563' }}>sell = 45% back</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {chipStack.map((chip, i) => (
              <OwnedChipRow key={`${chip}-${i}`} chip={chip} personalChips={personalChips} onSell={() => onSellChip(i)} />
            ))}
          </div>
        </div>
      )}

      {/* ── THEME ───────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#4b5563', letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>COLOR THEME</div>
        <div className="flex gap-2 justify-center flex-wrap">
          {([
            { id: 'gold',  label: '🟡 GOLD'  },
            { id: 'neon',  label: '🔵 NEON'  },
            { id: 'blood', label: '🔴 BLOOD' },
            { id: 'ice',   label: '🩵 ICE'   },
            { id: 'smoke', label: '⬜ SMOKE' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => onSetTheme(t.id)}
              style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: 8,
                padding: '6px 10px', borderRadius: 6, cursor: 'pointer', minHeight: 34,
                background: currentTheme === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${currentTheme === t.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: currentTheme === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onEndShop} className="btn-primary w-full" style={{ fontSize: 16, padding: '14px 0' }}>
        NEXT ROUND →
      </button>
    </div>
  );
}
