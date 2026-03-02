import type { ShopItem } from '../game/gameState';

interface ShopProps {
  items: ShopItem[];
  personalChips: number;
  consumableCount: number;
  chipCount: number;
  onBuy: (id: string) => void;
  onEndShop: () => void;
}

const ITEM_ICONS: Record<string, string> = {
  'consumable-SCRATCH_TICKET': '🎫',
  'consumable-HIGH_CARD_DRAW': '🃏',
  'consumable-ROULETTE': '🎰',
  'consumable-BURNED_HAND': '🔥',
  'chip-RED': '🔴',
  'chip-BLUE': '🔵',
  'chip-BLACK': '⚫',
  'chip-GOLD': '🟡',
  'chip-LUCKY': '🟣',
  'chip-SILVER': '⚪',
  'skim-upgrade': '📈',
};

function getIcon(item: ShopItem): string {
  if (item.type === 'skim-upgrade') return ITEM_ICONS['skim-upgrade'];
  if (item.type === 'chip' && item.chipType) return ITEM_ICONS[`chip-${item.chipType}`] ?? '🎲';
  if (item.type === 'consumable' && item.consumableType) return ITEM_ICONS[`consumable-${item.consumableType}`] ?? '🎴';
  return '🎴';
}

export function Shop({ items, personalChips, consumableCount, chipCount, onBuy, onEndShop }: ShopProps) {
  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full max-w-lg mx-auto">
      <div className="title-font text-2xl gold-glow tracking-widest">— SHOP —</div>
      <p className="text-gray-500 text-sm">
        Bank: <span className="gold-glow font-bold chip-counter">{personalChips.toLocaleString()}</span> chips
      </p>

      <div className="grid grid-cols-2 gap-3 w-full">
        {items.map(item => {
          const full = (item.type === 'consumable' && consumableCount >= 4) || (item.type === 'chip' && chipCount >= 5);
          const canBuy = personalChips >= item.cost && !full;
          return (
            <div key={item.id} className="shop-card flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getIcon(item)}</span>
                <span className="text-amber-200 font-semibold text-sm leading-tight">{item.label}</span>
              </div>
              <div className="text-gray-500 text-xs flex-1">{item.description}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="gold-glow font-bold text-sm chip-counter">{item.cost}</span>
                <button
                  onClick={() => canBuy && onBuy(item.id)}
                  disabled={!canBuy}
                  className={canBuy ? 'btn-primary text-xs px-4 py-1.5' : 'btn-secondary text-xs px-4 py-1.5 opacity-50 cursor-default'}
                >
                  {full ? 'FULL' : 'BUY'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onEndShop} className="btn-primary text-base px-12 mt-2">
        NEXT ROUND →
      </button>
    </div>
  );
}
