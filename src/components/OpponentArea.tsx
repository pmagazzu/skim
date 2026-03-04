// Placeholder opponent area — shows face-down hand, chip stack, status
// Ready to be wired to real multiplayer state later

interface OpponentAreaProps {
  // Future: name, chipCount, handsPlayed, isTheirTurn, etc.
  // For now: static placeholder
  placeholder?: boolean;
}

const CARD_COUNT = 5;

export function OpponentArea({ placeholder = true }: OpponentAreaProps) {
  return (
    <div className="opponent-area">
      {/* Left: their chip stack (empty circles for now) */}
      <div className="flex flex-col gap-1 items-center opacity-30">
        {[0,1,2].map(i => (
          <div key={i} className="w-7 h-7 rounded-full border border-white/20 bg-white/5" />
        ))}
      </div>

      {/* Center: face-down cards + name */}
      <div className="flex flex-col items-center gap-1.5 flex-1">
        <div className="flex gap-1.5">
          {Array.from({ length: CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className="opponent-card"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
        <div className="text-xs tracking-widest opacity-30" style={{ fontFamily: "'VT323', monospace" }}>
          {placeholder ? '— WAITING FOR PLAYER 2 —' : 'PLAYER 2'}
        </div>
      </div>

      {/* Right: placeholder for their score/status */}
      <div className="flex flex-col gap-1 items-center opacity-20 text-xs" style={{ fontFamily: "'VT323', monospace", minWidth: 40 }}>
        <div className="text-gray-600">0</div>
        <div className="text-gray-700 text-xs">chips</div>
      </div>
    </div>
  );
}
