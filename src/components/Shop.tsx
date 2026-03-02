import type { ShopItem } from '../game/gameState';
import type { Bounty } from '../game/bounties';
import { RARITY_LABELS, RARITY_COLORS } from '../game/chips';

interface ShopProps {
  items: ShopItem[];
  personalChips: number;
  consumableCount: number;
  chipCount: number;
  availableBounties: Bounty[];
  onBuy: (id: string) => void;
  onAcceptBounty: (id: string) => void;
  onEndShop: () => void;
}

const CONSUMABLE_ICONS: Record<string, string> = {
  SCRATCH_TICKET: '🎫',
  HIGH_CARD_DRAW: '🃏',
  ROULETTE: '🎰',
  BURNED_HAND: '🔥',
};

const CHIP_ICONS: Record<string, string> = {
  RED: '🔴', BLUE: '🔵', BLACK: '⚫', GOLD: '🟡', LUCKY: '🟣', SILVER: '⚪', DIAMOND: '💎',
};

function RarityBadge({ rarity }: { rarity?: string }) {
  if (!rarity) return null;
  const label = RARITY_LABELS[rarity as keyof typeof RARITY_LABELS] ?? rarity;
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? 'text-gray-400';
  return <span className={`text-xs font-bold ${color}`}>{label}</span>;
}

function ShopCard({ item, canBuy, full, onBuy }: {
  item: ShopItem;
  canBuy: boolean;
  full: boolean;
  onBuy: () => void;
}) {
  const icon = item.type === 'consumable' && item.consumableType
    ? CONSUMABLE_ICONS[item.consumableType] ?? '🎴'
    : item.type === 'chip' && item.chipType
    ? CHIP_ICONS[item.chipType] ?? '🎲'
    : '📈';

  return (
    <div className={[
      'shop-card flex flex-col gap-2',
      item.rarity === 'legendary' ? 'border-yellow-600/60' : '',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="text-amber-200 font-semibold text-sm leading-tight">{item.label}</div>
            {item.rarity && <RarityBadge rarity={item.rarity} />}
          </div>
        </div>
      </div>
      <div className="text-gray-500 text-xs flex-1 leading-relaxed">{item.description}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="gold-glow font-bold text-sm chip-counter">{item.cost}c</span>
        <button
          onClick={canBuy ? onBuy : undefined}
          disabled={!canBuy}
          className={canBuy ? 'btn-primary text-xs px-4 py-1.5' : 'btn-secondary text-xs px-4 py-1.5 opacity-40 cursor-default'}
        >
          {full ? 'FULL' : !canBuy ? 'CAN\'T' : 'BUY'}
        </button>
      </div>
    </div>
  );
}

function BountyCard({ bounty, onToggle }: { bounty: Bounty; onToggle: () => void }) {
  return (
    <div className={[
      'shop-card cursor-pointer transition-all',
      bounty.accepted ? 'border-amber-600/60 bg-amber-950/20' : '',
    ].join(' ')} onClick={onToggle}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-amber-200 font-semibold text-sm">{bounty.title}</div>
          <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{bounty.description}</div>
        </div>
        <div className={[
          'text-xs px-2 py-1 rounded border shrink-0',
          bounty.accepted
            ? 'border-amber-600 text-amber-400 bg-amber-950/40'
            : 'border-gray-700 text-gray-600',
        ].join(' ')}>
          {bounty.accepted ? '✓ ON' : 'OFF'}
        </div>
      </div>
      <div className="mt-2 text-xs text-emerald-500 font-semibold">🎁 {bounty.rewardLabel}</div>
    </div>
  );
}

export function Shop({ items, personalChips, consumableCount, chipCount, availableBounties, onBuy, onAcceptBounty, onEndShop }: ShopProps) {
  const chipItems = items.filter(i => i.type === 'chip');
  const casinoItems = items.filter(i => i.type === 'consumable' || i.type === 'skim-upgrade');

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="title-font text-2xl gold-glow tracking-widest">— SHOP —</div>
        <div className="text-gray-500 text-sm">
          Bank: <span className="gold-glow font-bold chip-counter">{personalChips.toLocaleString()}</span>
        </div>
      </div>

      {/* Section 1: Chip Stack */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="section-label">Chip Stack</span>
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-gray-600">{chipCount}/5 held</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {chipItems.map(item => {
            const full = chipCount >= 5;
            const canBuy = personalChips >= item.cost && !full;
            return <ShopCard key={item.id} item={item} canBuy={canBuy} full={full} onBuy={() => onBuy(item.id)} />;
          })}
        </div>
      </div>

      {/* Section 2: Casino */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="section-label">Casino</span>
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-gray-600">{consumableCount}/4 held</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {casinoItems.map(item => {
            const full = item.type === 'consumable' && consumableCount >= 4;
            const canBuy = personalChips >= item.cost && !full;
            return <ShopCard key={item.id} item={item} canBuy={canBuy} full={full} onBuy={() => onBuy(item.id)} />;
          })}
        </div>
      </div>

      {/* Section 3: Bounties */}
      {availableBounties.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="section-label">Bounties</span>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-gray-600">Toggle to accept — rewards on completion</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {availableBounties.map(b => (
              <BountyCard key={b.id} bounty={b} onToggle={() => onAcceptBounty(b.id)} />
            ))}
          </div>
        </div>
      )}

      <button onClick={onEndShop} className="btn-primary text-base px-12 self-center mt-2">
        NEXT ROUND →
      </button>
    </div>
  );
}
