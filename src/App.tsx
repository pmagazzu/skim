import { useGameState } from './hooks/useGameState';
import { Hand } from './components/Hand';
import { CommunityCards } from './components/CommunityCards';
import { Vault } from './components/Vault';
import { SkimLedger } from './components/SkimLedger';
import { Consumables } from './components/Consumables';
import { ChipStack } from './components/ChipStack';
import { Shop } from './components/Shop';
import { SkimReport } from './components/SkimReport';

function App() {
  const { state, dispatch, selectedHandResult, selectedChipValue } = useGameState();

  function getBadges(): string[] {
    const badges: string[] = [];
    if (state.skimRate >= 0.30) badges.push('🐀 The Rat — Skim rate ≥ 30%');
    const history = state.roundHistory;
    if (history.length > 0) {
      const avg = history.reduce((s, r) => s + (1 - r.skimRate), 0) / history.length;
      if (avg >= 0.70) badges.push('🤝 Most Honest — Vault contribution ≥ 70%');
    }
    if (state.rouletteWins > 0) badges.push(`🎰 High Roller — ${state.rouletteWins} roulette win(s)`);
    if (state.phase === 'victory') badges.push('🏆 MVP — Completed the run!');
    return badges;
  }

  const roundPreviewResult = {
    round: state.round,
    vaultFilled: state.vault >= state.vaultTarget,
    vaultPct: Math.min(100, Math.floor((state.vault / state.vaultTarget) * 100)),
    personalChips: state.roundChips,
    skimRate: state.skimRate,
  };

  const totalSkimmed = state.roundHistory.reduce((s, r) => s + r.personalChips, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="vignette" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="title-font text-2xl gold-glow tracking-widest">SKIM</div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">Round</span>
          <span className="text-white font-bold">{state.round}/{state.totalRounds}</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-600">Bank</span>
          <span className="gold-glow font-bold chip-counter">{state.personalChips.toLocaleString()}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">

        {/* DEALING */}
        {state.phase === 'dealing' && (
          <div className="flex flex-col items-center gap-8">
            <div className="title-font text-4xl gold-glow tracking-widest text-center">
              {state.round === 1 ? 'SKIM' : `ROUND ${state.round}`}
            </div>
            <div className="text-gray-500 text-center max-w-xs">
              {state.round === 1
                ? 'Fill the vault. Take your cut. Try not to get caught.'
                : `Vault target: ${state.vaultTarget.toLocaleString()} chips`}
            </div>
            {state.chipStack.length > 0 && (
              <ChipStack chips={state.chipStack} blackChipUsed={false} />
            )}
            <button onClick={() => dispatch({ type: 'DEAL' })} className="btn-primary text-xl px-16 py-4">
              DEAL
            </button>
          </div>
        )}

        {/* SELECTING */}
        {state.phase === 'selecting' && (
          <div className="w-full max-w-2xl flex flex-col gap-5">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <Vault chips={state.vault} target={state.vaultTarget} />
              <SkimLedger
                personalChips={state.personalChips}
                skimRate={state.skimRate}
                roundChips={state.roundChips}
                lastScore={state.lastScore}
                lastHandName={state.lastHandName}
                lastBonusDetail={state.lastBonusDetail}
              />
            </div>

            {/* Community cards */}
            <CommunityCards
              cards={state.communityCards}
              selectedIds={state.selectedIds}
              onSelect={id => dispatch({ type: 'SELECT_CARD', id })}
            />

            {/* Felt / hand area */}
            <div className="felt p-5">
              <Hand
                hand={state.hand}
                selectedIds={state.selectedIds}
                onSelect={id => dispatch({ type: 'SELECT_CARD', id })}
                onPlay={() => dispatch({ type: 'PLAY_HAND' })}
                handResult={selectedHandResult}
                chipPreview={selectedChipValue}
                scratchMultiplier={state.scratchMultiplier}
              />
            </div>

            {/* Bottom row: consumables + chip stack */}
            <div className="flex gap-4 items-start">
              <Consumables
                held={state.consumables}
                onUse={type => dispatch({ type: 'USE_CONSUMABLE', consumable: type })}
                onRouletteBet={amount => dispatch({ type: 'ROULETTE_BET', amount })}
                scratchMultiplier={state.scratchMultiplier}
              />
              {state.chipStack.length > 0 && (
                <ChipStack chips={state.chipStack} blackChipUsed={state.blackChipUsedThisRound} />
              )}
            </div>

            <div className="text-center section-label">{state.deck.length} cards remaining</div>
          </div>
        )}

        {/* ROUND END */}
        {state.phase === 'round-end' && (
          <SkimReport
            result={roundPreviewResult}
            round={state.round}
            totalRounds={state.totalRounds}
            onContinue={() => dispatch({ type: 'NEXT_ROUND' })}
          />
        )}

        {/* SHOP */}
        {state.phase === 'shop' && (
          <Shop
            items={state.shopItems}
            personalChips={state.personalChips}
            consumableCount={state.consumables.length}
            chipCount={state.chipStack.length}
            onBuy={id => dispatch({ type: 'BUY_ITEM', itemId: id })}
            onEndShop={() => dispatch({ type: 'END_SHOP' })}
          />
        )}

        {/* GAME OVER */}
        {state.phase === 'game-over' && (
          <div className="flex flex-col items-center gap-6 text-center p-8 max-w-sm">
            <div className="title-font text-5xl text-red-500 tracking-widest">BUST</div>
            <p className="text-gray-500">The vault ran dry. Better luck next time.</p>
            <div className="w-full bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
              {state.roundHistory.map(r => (
                <div key={r.round} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                  <span className="text-gray-500">Round {r.round}</span>
                  <span className={r.vaultFilled ? 'text-emerald-400' : 'text-red-400'}>{r.vaultPct}% vault</span>
                  <span className="text-amber-400 chip-counter">+{r.personalChips}</span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-white/10 font-bold">
                <span className="text-gray-400">Total skimmed</span>
                <span className="gold-glow chip-counter">{totalSkimmed}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {getBadges().map(b => (
                <div key={b} className="text-sm text-amber-300 bg-amber-950/30 border border-amber-800/30 rounded-lg px-3 py-1">{b}</div>
              ))}
            </div>
            <button onClick={() => dispatch({ type: 'RESET' })} className="btn-primary text-base px-12">PLAY AGAIN</button>
          </div>
        )}

        {/* VICTORY */}
        {state.phase === 'victory' && (
          <div className="flex flex-col items-center gap-6 text-center p-8 max-w-sm">
            <div className="title-font text-4xl text-emerald-400 tracking-widest">✦ YOU WIN ✦</div>
            <p className="text-gray-500">All vaults filled. The house never stood a chance.</p>
            <div className="w-full bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
              {state.roundHistory.map(r => (
                <div key={r.round} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                  <span className="text-gray-500">Round {r.round}</span>
                  <span className="text-emerald-400">✓ {r.vaultPct}%</span>
                  <span className="text-amber-400 chip-counter">+{r.personalChips}</span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-white/10 font-bold">
                <span className="text-gray-400">Total skimmed</span>
                <span className="gold-glow chip-counter text-lg">{totalSkimmed + state.roundChips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Final skim rate</span>
                <span className="text-amber-500">{Math.round(state.skimRate * 100)}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {getBadges().map(b => (
                <div key={b} className="text-sm text-amber-300 bg-amber-950/30 border border-amber-800/30 rounded-lg px-3 py-1">{b}</div>
              ))}
            </div>
            <button onClick={() => dispatch({ type: 'RESET' })} className="btn-primary text-base px-12">PLAY AGAIN</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
