interface VaultProps {
  chips: number;
  target: number;
}

export function Vault({ chips, target }: VaultProps) {
  const pct = Math.min(100, Math.floor((chips / target) * 100));
  const full = chips >= target;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <span className="section-label">Vault</span>
        <span className={['text-sm font-bold chip-counter', full ? 'gold-glow' : 'text-emerald-400'].join(' ')}>
          {chips.toLocaleString()} <span className="text-gray-600">/</span> {target.toLocaleString()}
        </span>
      </div>
      <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div
          className={['h-full rounded-full vault-bar-fill', full ? 'vault-bar-full' : ''].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {full && <div className="text-center text-xs text-emerald-400 font-semibold tracking-widest">✦ VAULT FULL ✦</div>}
    </div>
  );
}
