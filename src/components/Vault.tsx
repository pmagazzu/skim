interface VaultProps {
  chips: number;
  target: number;
}

export function Vault({ chips, target }: VaultProps) {
  const pct = Math.min(100, Math.floor((chips / target) * 100));
  const full = chips >= target;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400 uppercase tracking-widest">Vault</span>
        <span className="text-sm font-bold text-green-400">{chips.toLocaleString()} / {target.toLocaleString()}</span>
      </div>
      <div className="w-full h-5 bg-gray-800 rounded overflow-hidden border border-gray-700">
        <div
          className={['h-full rounded transition-all duration-500', full ? 'bg-green-400 vault-glow' : 'bg-green-600'].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-500">{pct}%</div>
    </div>
  );
}
