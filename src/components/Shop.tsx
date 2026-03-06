import { useMemo, useRef, useState } from 'react';
import type { ShopItem, UpgradeTypeValue } from '../game/gameState';
import { UPGRADE_DEFS } from '../game/gameState';
import type { Bounty } from '../game/bounties';
import { CHIPS } from '../game/chips';
import type { ChipTypeValue } from '../game/chips';
import { ChipArt } from './ChipArt';
import { HAND_NAMES } from '../game/hands';
import type { HandRankValue } from '../game/hands';
import { handUpgradeCost, handBaseAtLevel } from '../game/scoring';
import { playButtonPress, playButtonPunch } from '../audio/sounds';

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

function conciseDesc(item: ShopItem): string {
  const d = item.description;
  if (item.type === 'pack') return 'Open now · add to deck';
  if (d.length <= 50) return d;
  return `${d.slice(0, 50)}…`;
}

function OfferCard({ item, sold, canBuy, onBuy, full }: {
  item: ShopItem | null;
  sold?: boolean;
  canBuy?: boolean;
  full?: boolean;
  onBuy?: () => void;
}) {
  if (!item) {
    return (
      <div className="shop-card" style={{ opacity: 0.4, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#6b5a3e' }}>NO OFFER</span>
      </div>
    );
  }
  if (sold) {
    return (
      <div className="shop-card" style={{ opacity: 0.35, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#6b5a3e', letterSpacing: '0.1em' }}>SOLD</span>
      </div>
    );
  }

  const isChip = item.type === 'chip' && item.chipType;
  const icon = item.type === 'consumable' && item.consumableType
    ? CONSUMABLE_ICONS[item.consumableType] ?? '🎴'
    : item.type === 'pack' ? '📦' : item.type === 'skim-upgrade' ? '📈' : '✨';
  const slotLabel = item.type === 'chip'
    ? 'CHIP'
    : item.type === 'consumable'
      ? 'CASINO'
      : item.type === 'skim-upgrade'
        ? 'SKIM'
        : item.type === 'pack'
          ? 'DECK'
          : 'OFFER';

  return (
    <div className="shop-card flex flex-col gap-1.5" style={{ minHeight: 120 }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isChip ? <ChipArt type={item.chipType!} size={30} /> : <span style={{ fontSize: 22 }}>{icon}</span>}
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#f8d082', lineHeight: 1 }} className="truncate">{item.label}</div>
        </div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 12, color: '#6b7280', letterSpacing: '0.08em' }}>{slotLabel}</div>
      </div>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#9ca3af', lineHeight: 1.2 }}>{conciseDesc(item)}</div>
      <div className="mt-auto flex items-center justify-between">
        <span className="chip-counter" style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#fbbf24' }}>{item.cost}c</span>
        <button
          onClick={canBuy ? () => { playButtonPunch(); onBuy?.(); } : undefined}
          disabled={!canBuy}
          className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40 cursor-default'}
          style={{ fontSize: 13, padding: '6px 14px', minHeight: 34 }}
        >
          {full ? 'FULL' : canBuy ? 'BUY' : 'CAN\'T'}
        </button>
      </div>
    </div>
  );
}

function SectionToggle({ title, open, onClick, right }: { title: string; open: boolean; onClick: () => void; right?: string }) {
  return (
    <button
      onClick={() => { playButtonPress(); onClick(); }}
      className="btn-secondary w-full flex items-center justify-between"
      style={{ fontSize: 14, padding: '8px 10px' }}
    >
      <span style={{ fontFamily: "'VT323',monospace", fontSize: 19 }}>{open ? '▾' : '▸'} {title}</span>
      {right && <span style={{ fontFamily: "'VT323',monospace", fontSize: 16, opacity: 0.8 }}>{right}</span>}
    </button>
  );
}

export function Shop({
  items, personalChips, consumableCount, chipCount, maxChips, deckSize,
  availableBounties, chipStack, purchasedUpgrades, shopDiscount,
  handLevels, shopHandUpgrades, handRerollCost,
  onBuy, onAcceptBounty, onSellChip, onBuyUpgrade, onBuyHandUpgrade, onRerollHandUpgrades, onBuyForge,
  currentTheme, onSetTheme, onViewDeck, onEndShop,
}: ShopProps) {
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set());
  const [openHands, setOpenHands] = useState(false);
  const [openBounties, setOpenBounties] = useState(false);
  const [openStack, setOpenStack] = useState(false);
  const [openUpgrades, setOpenUpgrades] = useState(false);

  const snapshotRef = useRef<ShopItem[]>([]);
  if (snapshotRef.current.length === 0 && items.length > 0) snapshotRef.current = items;

  const stableItems = snapshotRef.current.length > 0 ? snapshotRef.current : items;
  const liveIds = new Set(items.map(i => i.id));

  function handleBuy(id: string) {
    setSoldIds(prev => new Set([...prev, id]));
    onBuy(id);
  }

  const offers = useMemo(() => {
    const chips = stableItems.filter(i => i.type === 'chip');
    const casino = stableItems.filter(i => i.type === 'consumable');
    const skim = stableItems.filter(i => i.type === 'skim-upgrade');
    const deck = stableItems.filter(i => i.type === 'pack');

    return [
      chips[0] ?? null,
      chips[1] ?? null,
      chips[2] ?? null,
      casino[0] ?? null,
      skim[0] ?? null,
      deck[0] ?? null,
    ] as const;
  }, [stableItems]);

  return (
    <div className="flex flex-col gap-3 p-3 w-full">
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 16, letterSpacing: '0.08em', color: '#fbbf24' }}>SHOP</div>
      </div>

      {/* Compact top controls */}
      <div className="flex items-center justify-between">
        <button onClick={() => { playButtonPress(); onViewDeck(); }} className="btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }}>DECK {deckSize}</button>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 28, color: '#fbbf24' }}>💰 {personalChips.toLocaleString()}c</div>
        <button onClick={() => { playButtonPress(); onEndShop(); }} className="btn-primary" style={{ fontSize: 13, padding: '7px 12px' }}>DONE →</button>
      </div>

      {/* Offer board */}
      <div className="grid grid-cols-2 gap-2">
        {offers.map((item, idx) => {
          if (!item) return <OfferCard key={`empty-${idx}`} item={null} />;
          const isSold = soldIds.has(item.id) || !liveIds.has(item.id);
          const full = item.type === 'chip'
            ? chipCount >= maxChips
            : item.type === 'consumable'
              ? consumableCount >= 4
              : false;
          const canBuy = !isSold && !full && personalChips >= item.cost;
          return (
            <OfferCard
              key={item.id}
              item={item}
              sold={isSold}
              full={full}
              canBuy={canBuy}
              onBuy={() => handleBuy(item.id)}
            />
          );
        })}
      </div>

      {/* Manage sections (collapsed by default) */}
      <SectionToggle title="Hand Upgrades" open={openHands} onClick={() => setOpenHands(v => !v)} right={`${shopHandUpgrades.length}`} />
      {openHands && (
        <div className="flex flex-col gap-2">
          {shopHandUpgrades.map(rank => {
            const lv = handLevels[rank] ?? 1;
            const cost = Math.max(1, Math.ceil(handUpgradeCost(rank, lv) * (1 - shopDiscount)));
            const canBuy = personalChips >= cost;
            return (
              <div key={rank} className="shop-card flex items-center justify-between gap-2" style={{ padding: '8px 10px' }}>
                <div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#f8d082' }}>{HAND_NAMES[rank]}</div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#6b7280' }}>Lv.{lv} → {handBaseAtLevel(rank, lv + 1)}c</div>
                </div>
                <button onClick={canBuy ? () => onBuyHandUpgrade(rank) : undefined} disabled={!canBuy} className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40'} style={{ fontSize: 13, padding: '6px 10px' }}>{cost}c</button>
              </div>
            );
          })}
          <button onClick={personalChips >= handRerollCost ? onRerollHandUpgrades : undefined} disabled={personalChips < handRerollCost} className={personalChips >= handRerollCost ? 'btn-secondary' : 'btn-secondary opacity-40'} style={{ fontSize: 13, padding: '8px 0' }}>
            Reroll {handRerollCost}c
          </button>
        </div>
      )}

      <SectionToggle title="Bounties" open={openBounties} onClick={() => setOpenBounties(v => !v)} right={`${availableBounties.filter(b => !b.accepted).length}`} />
      {openBounties && (
        <div className="flex flex-col gap-2">
          {availableBounties.slice(0, 2).map(b => {
            const fee = b.fee ?? 10;
            const can = b.accepted || personalChips >= fee;
            return (
              <button key={b.id} onClick={can ? () => onAcceptBounty(b.id) : undefined} disabled={!can} className={can ? 'shop-card text-left' : 'shop-card opacity-40 text-left'} style={{ padding: '8px 10px' }}>
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 19, color: '#f8d082' }}>{b.title}</div>
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#9ca3af' }}>{b.rewardLabel} · {b.accepted ? 'ON' : `${fee}c`}</div>
              </button>
            );
          })}
        </div>
      )}

      <SectionToggle title="Your Stack" open={openStack} onClick={() => setOpenStack(v => !v)} right={`${chipStack.length}`} />
      {openStack && (
        <div className="flex flex-col gap-1.5">
          {chipStack.map((chip, i) => {
            const def = CHIPS[chip];
            const refund = Math.floor(def.cost * 0.45);
            return (
              <div key={`${chip}-${i}`} className="shop-card flex items-center gap-2" style={{ padding: '6px 8px' }}>
                <ChipArt type={chip} size={26} />
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#f8d082', flex: 1 }}>{def.name}</div>
                <button onClick={() => onSellChip(i)} className="btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }}>SELL {refund}c</button>
              </div>
            );
          })}
        </div>
      )}

      <SectionToggle title="Upgrades + Forge + Theme" open={openUpgrades} onClick={() => setOpenUpgrades(v => !v)} />
      {openUpgrades && (
        <div className="flex flex-col gap-2">
          {(Object.keys(UPGRADE_DEFS) as UpgradeTypeValue[]).slice(0, 4).map(key => {
            const def = UPGRADE_DEFS[key];
            const owned = purchasedUpgrades.includes(key);
            const cost = Math.max(1, Math.floor(def.cost * (1 - shopDiscount)));
            const canBuy = !owned && personalChips >= cost;
            return (
              <div key={key} className="shop-card flex items-center justify-between" style={{ padding: '7px 10px' }}>
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 18 }}>{def.icon} {def.label}</div>
                {owned ? <span style={{ fontFamily: "'VT323',monospace", color: '#4ade80' }}>OWNED</span> : <button onClick={canBuy ? () => onBuyUpgrade(key) : undefined} disabled={!canBuy} className={canBuy ? 'btn-primary' : 'btn-secondary opacity-40'} style={{ fontSize: 12, padding: '4px 8px' }}>{cost}c</button>}
              </div>
            );
          })}

          <div className="grid grid-cols-2 gap-2">
            {([
              { rarity: 'common' as const, cost: 20, label: 'Forge C' },
              { rarity: 'uncommon' as const, cost: 45, label: 'Forge U' },
              { rarity: 'rare' as const, cost: 90, label: 'Forge R' },
              { rarity: 'legendary' as const, cost: 200, label: 'Forge L' },
            ]).map(f => (
              <button key={f.rarity} onClick={personalChips >= f.cost ? () => onBuyForge(f.rarity) : undefined} disabled={personalChips < f.cost} className={personalChips >= f.cost ? 'btn-secondary' : 'btn-secondary opacity-40'} style={{ fontSize: 13, padding: '8px 0' }}>
                {f.label} · {f.cost}c
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={() => onSetTheme('gold')} className={currentTheme === 'gold' ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12, padding: '6px 10px' }}>🌙 DARK</button>
            <button onClick={() => onSetTheme('smoke')} className={currentTheme === 'smoke' ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12, padding: '6px 10px' }}>☀️ LIGHT</button>
          </div>
        </div>
      )}

      <button onClick={() => { playButtonPress(); onEndShop(); }} className="btn-primary w-full" style={{ fontSize: 16, padding: '12px 0' }}>
        NEXT ROUND →
      </button>
    </div>
  );
}
