import { useGameState } from './hooks/useGameState';
import { Hand } from './components/Hand';
import { Vault } from './components/Vault';
import { SkimLedger } from './components/SkimLedger';
import { Consumables } from './components/Consumables';
import { Shop } from './components/Shop';
import { SkimReport } from './components/SkimReport';

function App() {
  const { state, dispatch, selectedHandResult, selectedChipValue } = useGameState();

  function handlePlayHand() {
    dispatch({ type: 'PLAY_HAND' });
  }

  // Compute badges at end
  function getBadges() {
    const badges: string[] = [];
    const history = state.roundHistory;
    if (history.length === 0) return badges;

    // The Rat: ended with skim rate >= 30%
    if (state.skimRate >= 0.30) badges.push('🐀 The Rat — Skim rate ≥ 30%');
    // Most Honest: avg vault contribution >= 70%
    const avgContrib = history.reduce((s, r) => s + (1 - r.skimRate), 0) / history.length;
    if (avgContrib >= 0.70) badges.push('🤝 Most Honest — Vault contribution ≥ 70%');
    // High Roller: won a roulette bet
    if (state.rouletteWins > 0) badges.push(`🎰 High Roller — Won ${state.rouletteWins} roulette bet(s)`);
    // MVP: completed all rounds
    if (state.phase === 'victory') badges.push('🏆 MVP — Completed the run!');
    return badges;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0e17' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="text-yellow-400 font-black text-2xl tracking-widest chip-glow">SKIM</div>
        <div className="text-gray-400 text-sm">
          Round <span className="text-white font-bold">{state.round}</span> / {state.totalRounds}
        </div>
        <div className="text-gray-400 text-sm">
          Chips: <span className="text-yellow-400 font-bold">{state.personalChips}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">

        {/* DEALING */}
        {state.phase === 'dealing' && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-gray-400 text-center">
              {state.round === 1
                ? 'Welcome to SKIM. Fill the Vault — but take your cut.'
                : `Round ${state.round} — Vault target: ${state.vaultTarget.toLocaleString()} chips`}
            </div>
            <button
              onClick={() => dispatch({ type: 'DEAL' })}
              className="px-16 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-2xl rounded-xl tracking-wider shadow-lg hover:shadow-yellow-500/40 transition-all"
            >
              DEAL
            </button>
          </div>
        )}

        {/* SELECTING */}
        {state.phase === 'selecting' && (
          <div className="w-full max-w-2xl flex flex-col gap-4">
            {/* Vault + Ledger row */}
            <div className="grid grid-cols-2 gap-3">
              <Vault chips={state.vault} target={state.vaultTarget} />
              <SkimLedger
                personalChips={state.personalChips}
                skimRate={state.skimRate}
                roundChips={state.roundChips}
                lastScore={state.lastScore}
                lastHandName={state.lastHandName}
              />
            </div>

            {/* Felt / hand area */}
            <div className="felt p-4">
              <Hand
                hand={state.hand}
                selectedIds={state.selectedIds}
                onSelect={id => dispatch({ type: 'SELECT_CARD', id })}
                onPlay={handlePlayHand}
                handResult={selectedHandResult}
                chipPreview={selectedChipValue}
                scratchMultiplier={state.scratchMultiplier}
              />
            </div>

            {/* Consumables */}
            <Consumables
              held={state.consumables}
              onUse={type => dispatch({ type: 'USE_CONSUMABLE', consumable: type })}
              onRouletteBet={amount => dispatch({ type: 'ROULETTE_BET', amount })}
              scratchMultiplier={state.scratchMultiplier}
            />

            {/* Deck count */}
            <div className="text-center text-gray-600 text-xs">
              {state.deck.length} cards remaining in deck
            </div>
          </div>
        )}

        {/* ROUND END */}
        {state.phase === 'round-end' && (() => {
          // Build result from current state (NEXT_ROUND hasn't been called yet)
          const vaultFilled = state.vault >= state.vaultTarget;
          const vaultPct = Math.min(100, Math.floor((state.vault / state.vaultTarget) * 100));
          const previewResult = {
            round: state.round,
            vaultFilled,
            vaultPct,
            personalChips: state.roundChips,
            skimRate: state.skimRate,
          };
          return (
            <SkimReport
              result={previewResult}
              round={state.round}
              totalRounds={state.totalRounds}
              onContinue={() => dispatch({ type: 'NEXT_ROUND' })}
            />
          );
        })()}

        {/* SHOP */}
        {state.phase === 'shop' && (
          <Shop
            items={state.shopItems}
            personalChips={state.personalChips}
            consumableCount={state.consumables.length}
            onBuy={id => dispatch({ type: 'BUY_ITEM', itemId: id })}
            onEndShop={() => dispatch({ type: 'END_SHOP' })}
          />
        )}

        {/* GAME OVER */}
        {state.phase === 'game-over' && (
          <div className="flex flex-col items-center gap-6 text-center p-8">
            <div className="text-6xl font-black text-red-500 tracking-widest">💀 BUST</div>
            <p className="text-gray-400">The vault wasn't filled. Better luck next time.</p>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-sm">
              <div className="text-gray-400 text-sm mb-3">Round History</div>
              {state.roundHistory.map(r => (
                <div key={r.round} className="flex justify-between py-1 border-b border-gray-800 last:border-0 text-sm">
                  <span className="text-gray-400">Round {r.round}</span>
                  <span className={r.vaultFilled ? 'text-green-400' : 'text-red-400'}>
                    {r.vaultFilled ? '✓' : '✗'} {r.vaultPct}% vault
                  </span>
                  <span className="text-yellow-400">+{r.personalChips}</span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-700 font-bold">
                <span className="text-gray-300">Total skimmed</span>
                <span className="text-yellow-400 chip-glow">
                  {state.roundHistory.reduce((s, r) => s + r.personalChips, 0)} chips
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {getBadges().map(b => (
                <div key={b} className="text-sm text-yellow-300">{b}</div>
              ))}
            </div>

            <button
              onClick={() => dispatch({ type: 'RESET' })}
              className="px-10 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg rounded-lg"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {/* VICTORY */}
        {state.phase === 'victory' && (
          <div className="flex flex-col items-center gap-6 text-center p-8">
            <div className="text-5xl font-black text-green-400 tracking-widest">🏆 YOU WIN</div>
            <p className="text-gray-400">All vaults filled. The house never stood a chance.</p>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-sm">
              <div className="text-gray-400 text-sm mb-3">Final Results</div>
              {state.roundHistory.map(r => (
                <div key={r.round} className="flex justify-between py-1 border-b border-gray-800 last:border-0 text-sm">
                  <span className="text-gray-400">Round {r.round}</span>
                  <span className="text-green-400">✓ {r.vaultPct}% vault</span>
                  <span className="text-yellow-400">+{r.personalChips}</span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-700 font-bold">
                <span className="text-gray-300">Total skimmed</span>
                <span className="text-yellow-400 chip-glow text-lg">
                  {state.roundHistory.reduce((s, r) => s + r.personalChips, 0)} chips
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-300">Final skim rate</span>
                <span className="text-orange-400">{Math.round(state.skimRate * 100)}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {getBadges().map(b => (
                <div key={b} className="text-sm text-yellow-300 bg-yellow-950/30 border border-yellow-800 rounded px-3 py-1">{b}</div>
              ))}
            </div>

            <button
              onClick={() => dispatch({ type: 'RESET' })}
              className="px-10 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg rounded-lg"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
