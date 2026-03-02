import type { ShopItem } from '../game/gameState';

interface ShopProps {
  items: ShopItem[];
  personalChips: number;
  consumableCount: number;
  onBuy: (id: string) => void;
  onEndShop: () => void;
}

export function Shop({ items, personalChips, consumableCount, onBuy, onEndShop }: ShopProps) {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-2xl font-bold text-yellow-400 tracking-wider">🛒 SHOP</h2>
      <p className="text-gray-400">
        Your chips: <span className="text-yellow-400 font-bold chip-glow">{personalChips}</span>
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {items.map(item => {
          const canBuy = personalChips >= item.cost && (item.type !== 'consumable' || consumableCount < 4);
          return (
            <div
              key={item.id}
              className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="font-semibold text-yellow-300">{item.label}</div>
              <div className="text-xs text-gray-400 flex-1">{item.description}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-yellow-500 font-bold">{item.cost} chips</span>
                <button
                  onClick={() => canBuy && onBuy(item.id)}
                  disabled={!canBuy}
                  className={[
                    'px-3 py-1 rounded text-sm font-semibold transition-all',
                    canBuy
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-black cursor-pointer'
                      : 'bg-gray-700 text-gray-500 cursor-default',
                  ].join(' ')}
                >
                  {consumableCount >= 4 && item.type === 'consumable' ? 'Full' : 'BUY'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onEndShop}
        className="mt-2 px-10 py-3 bg-green-700 hover:bg-green-600 text-white font-bold text-lg rounded-lg tracking-wider"
      >
        DONE SHOPPING →
      </button>
    </div>
  );
}
