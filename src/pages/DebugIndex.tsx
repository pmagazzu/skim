import { CHIPS, RARITY_COLORS, RARITY_LABELS } from '../game/chips';
import { CONSUMABLES } from '../game/consumables';
import { BOUNTY_POOL } from '../game/bounties';

interface Props {
  onClose: () => void;
}

const CHIP_BG: Record<string, string> = {
  RED: 'bg-red-600', LUCKY: 'bg-purple-600', COPPER: 'bg-orange-700',
  PENNY: 'bg-amber-800', CHALK: 'bg-stone-400', TIN: 'bg-slate-500',
  NICKEL: 'bg-neutral-500', ROSE: 'bg-rose-600', RIVER: 'bg-sky-700', EMBER: 'bg-orange-600',
  BLUE: 'bg-blue-600', SILVER: 'bg-gray-400', JADE: 'bg-emerald-600',
  IRON: 'bg-zinc-600', BRONZE: 'bg-amber-700', OBSIDIAN: 'bg-gray-950',
  SAPPHIRE: 'bg-blue-800', CORAL: 'bg-pink-600', AMBER: 'bg-yellow-700', STEEL: 'bg-slate-700',
  BLACK: 'bg-gray-800', GOLD: 'bg-yellow-500', ONYX: 'bg-black',
  RUBY: 'bg-red-900', QUARTZ: 'bg-violet-400', CRYSTAL: 'bg-cyan-500',
  DIAMOND: 'bg-cyan-300', PLATINUM: 'bg-slate-300', JOKER: 'bg-fuchsia-600', MOONSTONE: 'bg-indigo-400',
};

export default function DebugIndex({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0d0b0e] overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="title-font text-3xl gold-glow tracking-widest">📖 Game Catalog</h1>
          <button onClick={onClose} className="btn-secondary px-4 py-2">✕ Close</button>
        </div>

        {/* Section 1: Chips */}
        <section className="mb-10">
          <h2 className="section-label text-lg mb-4">🎰 Chips ({Object.values(CHIPS).length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.values(CHIPS).map(chip => {
              const rarityColor = RARITY_COLORS[chip.rarity];
              const rarityLabel = RARITY_LABELS[chip.rarity];
              const bg = CHIP_BG[chip.type] ?? 'bg-gray-600';
              return (
                <div key={chip.type} className="bg-[#1a1410] border border-amber-900/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${bg}`}>
                      {chip.type[0]}
                    </div>
                    <div>
                      <div className="text-amber-200 font-semibold text-sm">{chip.name}</div>
                      <div className={`text-xs font-bold ${rarityColor}`}>{rarityLabel}</div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs leading-relaxed">{chip.description}</div>
                  <div className="text-amber-600 text-xs font-bold">{chip.cost} chips</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Consumables */}
        <section className="mb-10">
          <h2 className="section-label text-lg mb-4">🃏 Consumables ({Object.values(CONSUMABLES).length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(CONSUMABLES).map(c => (
              <div key={c.type} className="bg-[#1a1410] border border-amber-900/30 rounded-xl p-3 flex flex-col gap-2 items-center text-center">
                <span className="text-3xl">{c.icon}</span>
                <div className="text-amber-200 font-semibold text-sm">{c.name}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{c.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Bounties */}
        <section className="mb-10">
          <h2 className="section-label text-lg mb-4">📋 Bounty Pool ({BOUNTY_POOL.length})</h2>
          <div className="flex flex-col gap-2">
            {BOUNTY_POOL.map((b, i) => (
              <div key={i} className="bg-[#1a1410] border border-amber-900/30 rounded-xl p-3 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-amber-200 font-semibold text-sm">{b.title}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{b.description}</div>
                </div>
                <div className="text-emerald-400 text-xs font-bold whitespace-nowrap shrink-0">🎁 {b.rewardLabel}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
