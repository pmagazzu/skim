import { useState, useEffect, useRef } from 'react';
import { playChipBloop, playCardSelect, playCardDeselect, playCardDeal, playDiscard, playButtonPress, playHandPlay, playRoundWin, playRoundFail, playPurchase, playTimerWarn, playScoreImpact, playChipBloopScaled, playScoreSlamFinal, playVaultSeal } from './audio/sounds';
import { useGameState } from './hooks/useGameState';
import { Hand } from './components/Hand';
import { CommunityCards } from './components/CommunityCards';
import { Vault } from './components/Vault';
import { SkimLedger } from './components/SkimLedger';
import { Consumables } from './components/Consumables';
import { ChipStack } from './components/ChipStack';
import { Shop } from './components/Shop';
import { SkimReport } from './components/SkimReport';
import { ResultModal } from './components/ResultModal';
import { ScoreChain } from './components/ScoreChain';
import { ConsumableResult } from './components/ConsumableResult';
import ActiveBounties from './components/ActiveBounties';
import DebugIndex from './pages/DebugIndex';
import { Lobby } from './pages/Lobby';
import { CoopGame } from './pages/CoopGame';
import { PackOpenModal } from './components/PackOpenModal';
import { ForgeResultModal } from './components/ForgeResultModal';
import { Tutorial } from './components/Tutorial';
import { OpponentArea } from './components/OpponentArea';
import { DeckViewer } from './components/DeckViewer';
import { UpgradeType } from './game/gameState';

type SortMode = 'dealt' | 'high' | 'low' | 'suit';

// ── Menu panel overlay — triggered by inline MENU buttons ──
function MenuPanel({ open, onClose, onDevWin, onCatalog, onTutorial, onMainMenu }: {
  open: boolean; onClose: () => void; onDevWin: () => void; onCatalog: () => void;
  onTutorial?: () => void; onMainMenu?: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 290, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{
        position: 'fixed', bottom: '50%', left: '50%',
        transform: 'translate(-50%, 50%)',
        zIndex: 295, width: 'min(340px, 92vw)',
        background: '#0d0a07', border: '1px solid #3a2e1e',
        borderRadius: 16, padding: '20px 18px 18px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.9)',
      }}>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#ca8a04', textAlign: 'center', marginBottom: 16, letterSpacing: '0.14em' }}>
          ─── MENU ───
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => { onClose(); onDevWin(); }}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 12, cursor: 'pointer',
              background: 'linear-gradient(145deg,#1e3a8a,#1d4ed8)',
              border: '2px solid #3b82f6',
              boxShadow: '0 4px 0 #1e3a8a, 0 6px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
              color: '#bfdbfe', fontFamily: "'Press Start 2P',monospace", fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'transform 0.08s, box-shadow 0.08s',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(3px)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
          >
            <span style={{ fontSize: 20 }}>⚡</span> DEV WIN +1000c
          </button>
          <button
            onClick={() => { onClose(); onCatalog(); }}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.35)',
              color: '#93c5fd', fontFamily: "'VT323',monospace", fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            📖 CHIP CATALOG
          </button>
          {onTutorial && (
            <button onClick={() => { onClose(); onTutorial(); }} style={{ width: '100%', padding: '12px 0', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid #3a2e1e', color: '#9ca3af', fontFamily: "'VT323',monospace", fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ? HOW TO PLAY
            </button>
          )}
          {onMainMenu && (
            <button onClick={() => { onClose(); onMainMenu(); }} style={{ width: '100%', padding: '12px 0', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', border: '1px solid #2a2520', color: '#4b5563', fontFamily: "'VT323',monospace", fontSize: 19 }}>
              ← MAIN MENU
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              background: 'transparent', border: '1px solid #2a2520',
              color: '#4b5563', fontFamily: "'VT323',monospace", fontSize: 19,
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </>
  );
}

// Shared inline MENU button style
function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'VT323',monospace", fontSize: 17,
        padding: '5px 14px', borderRadius: 7, cursor: 'pointer',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#6b7280', letterSpacing: '0.08em',
        flexShrink: 0,
      }}
    >
      MENU
    </button>
  );
}

function App() {
  const [appMode, setAppMode] = useState<'solo' | 'lobby' | 'coop'>('solo');
  const [coopRoom, setCoopRoom] = useState<{ code: string; playerIndex: 0 | 1 } | null>(null);

  const { state, dispatch, selectedHandResult, selectedChipValue } = useGameState();
  const [sortMode, setSortMode] = useState<SortMode>('dealt');
  const [showCatalog, setShowCatalog] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [appScreen, setAppScreen] = useState<'mainmenu' | 'tutorial' | 'game'>('mainmenu');
  const [turnTimer, setTurnTimer] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerWarnedHalf = useRef(false);
  const timerWarnedUrgent = useRef(false);
  const prevScore = useRef<number | null>(null);
  const [shakeTier, setShakeTier] = useState(0);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme ?? 'gold');
  }, [state.theme]);

// Play sounds when a hand scores — scaled by score/vaultTarget
  useEffect(() => {
    if (state.lastScore !== null && state.lastScore !== prevScore.current) {
      prevScore.current = state.lastScore;
      const tier = playScoreImpact(state.lastScore, state.vaultTarget, state.bestHandRankThisRound);

      // Screen shake for tier 2+
      if (tier >= 2) {
        setShakeTier(tier);
        setTimeout(() => setShakeTier(0), tier === 3 ? 500 : 300);
      }

      // Chip sequence with pitch climb
      state.lastFiredChips.forEach((chipType, i) => {
        playChipBloopScaled(chipType, i, tier);
      });

      // Final slam after all chips
      const chipDelay = state.lastFiredChips.length > 0
        ? state.lastFiredChips.length * (tier >= 2 ? 110 : 90) + 80
        : 60;
      setTimeout(() => playScoreSlamFinal(tier), chipDelay);
    }
  }, [state.lastScore, state.lastFiredChips, state.vaultTarget, state.bestHandRankThisRound]);

  const prevPhase = useRef<string | null>(null);
  // Play round result sounds on phase transition
  // Turn timer — active during selecting phase (90s Round 1, 60s Round 2, 45s Round 3+)
  useEffect(() => {
    if (state.phase === 'selecting' && !state.consumableResult) {
      const duration = state.ante >= 3 ? 45 : state.ante >= 2 ? 60 : 90;
      timerWarnedHalf.current = false;
      timerWarnedUrgent.current = false;
      setTurnTimer(duration);
      timerRef.current = setInterval(() => {
        setTurnTimer(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timerRef.current!);
            dispatch({ type: 'DISCARD_HAND' });
            return null;
          }
          const next = prev - 1;
          const half = Math.floor(duration / 2);
          const quarter = Math.floor(duration / 4);
          if (next <= half && !timerWarnedHalf.current) {
            timerWarnedHalf.current = true;
            playTimerWarn(false);
          }
          if (next <= quarter && !timerWarnedUrgent.current) {
            timerWarnedUrgent.current = true;
            playTimerWarn(true);
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTurnTimer(null);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.ante, state.handsPlayedThisRound]);

  useEffect(() => {
    if (prevPhase.current !== state.phase) {
      if (state.phase === 'score-review') {
        const vaultFilled = state.vault >= state.vaultTarget;
        if (vaultFilled) {
          setTimeout(() => playVaultSeal(), 200);
          setTimeout(() => playRoundWin(), 700);
        } else {
          setTimeout(() => playRoundFail(), 400);
        }
      } else if (state.phase === 'ante-complete') {
        setTimeout(() => playRoundWin(), 200);
      }
      prevPhase.current = state.phase;
    }
  }, [state.phase, state.vault, state.vaultTarget]);

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

  // Co-op mode routing
  if (appMode === 'lobby') {
    return <Lobby
      onGameStart={(code, idx) => { setCoopRoom({ code, playerIndex: idx }); setAppMode('coop'); }}
      onBack={() => setAppMode('solo')}
    />;
  }
  if (appMode === 'coop' && coopRoom) {
    return <CoopGame
      roomCode={coopRoom.code}
      playerIndex={coopRoom.playerIndex}
      onExit={() => { setCoopRoom(null); setAppMode('solo'); }}
    />;
  }

  // ── Main menu ──
  if (appScreen === 'mainmenu') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="vignette" />
        <div style={{ width: '100%', maxWidth: 430, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="title-font gold-glow" style={{ fontSize: 80, letterSpacing: '0.14em', lineHeight: 1 }}>SKIM</div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#6b5a3e', marginTop: 6, letterSpacing: '0.1em' }}>
              Fill the vault. Take your cut. Don't get caught.
            </div>
          </div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 28, color: '#3a2e1e', letterSpacing: '0.3em' }}>♠ ♥ ♦ ♣</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
            <button
              onClick={() => setAppScreen('game')}
              style={{
                width: '100%', padding: '18px 0', borderRadius: 12, cursor: 'pointer',
                background: 'linear-gradient(135deg, #92400e, #ca8a04)',
                border: '1px solid #fde68a', color: '#fde68a',
                fontFamily: "'VT323',monospace", fontSize: 30, letterSpacing: '0.12em',
                boxShadow: '0 0 24px rgba(202,138,4,0.3), 0 4px 0 #78350f',
              }}
            >▶ PLAY</button>
            <button
              onClick={() => setAppScreen('tutorial')}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', border: '1px solid #3a2e1e',
                color: '#ca8a04', fontFamily: "'VT323',monospace", fontSize: 24, letterSpacing: '0.1em',
              }}
            >? HOW TO PLAY</button>
          </div>
          <MenuButton onClick={() => setShowMenu(true)} />
        </div>
        <MenuPanel open={showMenu} onClose={() => setShowMenu(false)} onDevWin={() => {}} onCatalog={() => setShowCatalog(true)} />
        {showCatalog && <DebugIndex onClose={() => setShowCatalog(false)} />}
      </div>
    );
  }

  // ── Tutorial ──
  if (appScreen === 'tutorial') {
    return <Tutorial onClose={() => setAppScreen('game')} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="vignette" />
      {/* Header — hidden during active gameplay to save vertical space */}
      <header className={`flex items-center justify-between px-4 py-3 border-b border-white/5 ${state.phase === 'selecting' || state.phase === 'score-review' ? 'hidden' : ''}`} style={{ maxWidth: 430, width: '100%', alignSelf: 'center', boxSizing: 'border-box' }}>
        <div className="flex items-center gap-3">
          <div className="title-font text-2xl gold-glow tracking-widest">SKIM</div>
          <button onClick={() => setAppMode('lobby')} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 7, background: 'transparent', border: '1px solid #3a2e1e', borderRadius: 4, color: '#6b5a3e', padding: '3px 7px', cursor: 'pointer', letterSpacing: '0.05em' }}>
            CO-OP
          </button>
        </div>

        {/* Ante progress tracker */}
        {state.phase !== 'difficulty' && (
          <div className="flex items-center gap-3">
            {/* Round indicator */}
            <div className="flex flex-col items-center">
              <div className="text-sm text-gray-600 uppercase tracking-widest">Round</div>
              <div className="title-font text-lg text-amber-400">{state.ante}</div>
            </div>
            {/* Level pips */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-sm text-gray-600 uppercase tracking-widest">Level</div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(r => (
                  <div
                    key={r}
                    className={`w-3 h-3 rounded-full border transition-all ${
                      r < state.roundInAnte
                        ? 'bg-emerald-500 border-emerald-400'
                        : r === state.roundInAnte
                        ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                        : 'bg-transparent border-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Rounds beaten */}
            {state.ante > 1 && (
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-600 uppercase tracking-widest">Cleared</div>
                <div className="flex gap-1">
                  {Array.from({ length: state.ante - 1 }).map((_, i) => (
                    <span key={i} className="text-emerald-500 text-sm">✦</span>
                  ))}
                </div>
              </div>
            )}
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-600">Bank</div>
              <div className="gold-glow font-bold chip-counter text-sm">{state.personalChips.toLocaleString()}</div>
            </div>
          </div>
        )}
        <MenuButton onClick={() => setShowMenu(true)} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-0 w-full overflow-x-hidden">

        {/* DIFFICULTY SELECT */}
        {state.phase === 'difficulty' && (
          <div className="game-canvas" style={{ paddingTop: 24, paddingBottom: 24, gap: 20 }}>

            {/* Title */}
            <div style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <MenuButton onClick={() => setShowMenu(true)} />
              </div>
              <div className="title-font gold-glow" style={{ fontSize: 68, letterSpacing: '0.12em', lineHeight: 1 }}>SKIM</div>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#6b5a3e', marginTop: 6, letterSpacing: '0.08em' }}>
                Fill the vault. Take your cut.
              </div>
            </div>

            {/* Theme picker */}
            <div style={{ width: '100%' }}>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#4b5563', letterSpacing: '0.1em', marginBottom: 10, textAlign: 'center' }}>
                — COLOR THEME —
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {([
                  { id: 'gold',  label: 'GOLD',  swatch: '#ca8a04' },
                  { id: 'neon',  label: 'NEON',  swatch: '#00bcd4' },
                  { id: 'blood', label: 'BLOOD', swatch: '#c62828' },
                  { id: 'ice',   label: 'ICE',   swatch: '#0288d1' },
                  { id: 'smoke', label: 'SMOKE', swatch: '#757575' },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    onClick={() => dispatch({ type: 'SET_THEME', theme: t.id })}
                    style={{
                      fontFamily: "'VT323',monospace", fontSize: 17,
                      padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                      background: state.theme === t.id ? t.swatch + '33' : 'transparent',
                      border: `2px solid ${state.theme === t.id ? t.swatch : t.swatch + '55'}`,
                      color: state.theme === t.id ? t.swatch : t.swatch + '88',
                      transition: 'all 0.15s',
                      minWidth: 70,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div style={{ width: '100%' }}>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#4b5563', letterSpacing: '0.1em', marginBottom: 10, textAlign: 'center' }}>
                — SELECT DIFFICULTY —
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {([
                  { d: 'easy',   icon: '🟢', label: 'EASY',   sub: '10 hands · More time, lower pressure' },
                  { d: 'normal', icon: '🟡', label: 'NORMAL', sub: '8 hands · Balanced challenge' },
                  { d: 'hard',   icon: '🔴', label: 'HARD',   sub: '6 hands · Every hand counts' },
                ] as const).map(({ d, icon, label, sub }) => (
                  <button
                    key={d}
                    onClick={() => dispatch({ type: 'SET_DIFFICULTY', difficulty: d })}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: '14px 16px',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    className="hover:border-amber-700 hover:bg-amber-950/20"
                  >
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#e5d5b0', marginBottom: 3 }}>
                      {icon} {label}
                    </div>
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#4b5563' }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

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
              <ChipStack
                chips={state.chipStack}
                blackChipUsed={false}
                onReorder={(from, to) => dispatch({ type: 'REORDER_CHIPS', fromIndex: from, toIndex: to })}
              />
            )}
            <button onClick={() => { playButtonPress(); [0,1,2,3,4].forEach(i => playCardDeal(i)); dispatch({ type: 'DEAL' }); }} className="btn-primary text-xl px-16 py-4">
              DEAL
            </button>
          </div>
        )}

        {/* SELECTING */}
        {state.phase === 'selecting' && (
          <div className="game-canvas">
            {/* ── Portrait layout: single column ── */}
            <div className="felt-outer-row">

            {/* ── Felt table ── */}
            <div className={`felt felt-table relative felt-skin-${state.feltSkin}${shakeTier >= 3 ? ' felt-shake-big' : shakeTier === 2 ? ' felt-shake' : ''}`}>




              {/* Top area — portrait compact layout */}
              <div className="felt-top-row">
                {/* Strip 1: vault bar full width */}
                <Vault chips={state.vault} target={state.vaultTarget} />

                {/* Strip 2: round label | wallet | skim rate */}
                <div className="felt-top-row-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#ca8a04', letterSpacing: '0.06em' }}>
                      Round {state.ante} · Lvl {state.roundInAnte}/3
                    </div>
                    <MenuButton onClick={() => setShowMenu(true)} />
                  </div>
                  <OpponentArea />
                  <SkimLedger
                    personalChips={state.personalChips}
                    skimRate={state.skimRate}
                    roundChips={state.roundChips}
                    lastScore={state.lastScore}
                    lastHandName={state.lastHandName}
                    lastBonusDetail={state.lastBonusDetail}
                  />
                </div>

                {/* Strip 3: active bounties inline */}
                {state.activeBounties.length > 0 && (
                  <div className="flex flex-row flex-wrap gap-1" style={{ width: '100%' }}>
                    {state.activeBounties.map(b => (
                      <div key={b.id} className={[
                        'px-2 py-0.5 rounded',
                        b.completed ? 'text-emerald-600 opacity-50 line-through' : 'text-amber-700',
                      ].join(' ')} style={{ fontFamily: "'VT323',monospace", fontSize: 15 }}>
                        {b.completed ? '✓' : '◎'} {b.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 2: community left | hand right */}
              <div className="table-divider" />
              <div className="felt-play-row">

                {/* TOP: Community cards */}
                <div className="felt-community-col">
                  <CommunityCards
                    cards={state.communityCards}
                    selectedIds={state.selectedIds}
                    onSelect={id => {
                      const wasSelected = state.selectedIds.includes(id);
                      wasSelected ? playCardDeselect() : playCardSelect();
                      dispatch({ type: 'SELECT_CARD', id });
                    }}
                    deckCount={state.deck.length}
                    newCardIds={state.newCommunityIds}
                    onClearNew={() => dispatch({ type: 'CLEAR_NEW_COMMUNITY' })}
                    onDeckClick={() => setShowDeckViewer(true)}
                    sortMode={sortMode}
                  />
                </div>

                {/* BOTTOM: Your hand */}
                <div className="felt-hand-col">
                  <Hand
                    hand={state.hand}
                    selectedIds={state.selectedIds}
                    onSelect={id => {
                      const wasSelected = state.selectedIds.includes(id);
                      wasSelected ? playCardDeselect() : playCardSelect();
                      dispatch({ type: 'SELECT_CARD', id });
                    }}
                    onPlay={() => { playHandPlay(); dispatch({ type: 'PLAY_HAND' }); }}
                    onDiscard={() => { playDiscard(); dispatch({ type: 'DISCARD_HAND' }); }}
                    handResult={selectedHandResult}
                    chipPreview={selectedChipValue}
                    scratchMultiplier={state.scratchMultiplier}
                    handsLeft={state.maxHandsPerRound - state.handsPlayedThisRound}
                    handsPlayed={state.handsPlayedThisRound}
                    maxHands={state.maxHandsPerRound}
                    vault={state.vault}
                    vaultTarget={state.vaultTarget}
                    turnTimeRemaining={turnTimer}
                    sortMode={sortMode}
                    onSortChange={setSortMode}
                    discardsUsed={state.discardedThisRound}
                    maxFreeDiscards={state.maxFreeDiscards}
                    extraDiscardCost={state.extraDiscardCost}
                    personalChips={state.personalChips}
                    handLevels={state.handLevels}
                  />
                </div>
              </div>

              {/* Chip stack — horizontal scrollable row inside felt */}
              {state.chipStack.length > 0 && (
                <div style={{ width: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, padding: '2px 4px', justifyContent: 'center' }}>
                    <ChipStack
                      chips={state.chipStack}
                      blackChipUsed={state.blackChipUsedThisRound}
                      lastFiredChips={state.lastFiredChips}
                      canTip={state.phase === 'selecting' && !state.tipBonus}
                      onReorder={(from, to) => dispatch({ type: 'REORDER_CHIPS', fromIndex: from, toIndex: to })}
                      onTipChip={index => dispatch({ type: 'TIP_CHIP', index })}
                    />
                  </div>
                  {state.tipBonus && (
                    <div className="text-sm text-center px-3 py-1 rounded border border-amber-500/50 bg-amber-950/30 text-amber-300 animate-pulse" style={{ fontFamily: "'VT323',monospace", fontSize: 12, margin: '2px 0' }}>
                      🎯 TIP ACTIVE: {state.tipBonus.label}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Consumables — horizontal strip below felt */}
            <div className="consumables-sidebar">
              <Consumables
                held={state.consumables}
                onUse={type => dispatch({ type: 'USE_CONSUMABLE', consumable: type })}
                onRouletteBet={amount => dispatch({ type: 'ROULETTE_BET', amount })}
                scratchMultiplier={state.scratchMultiplier}
                unlockedSlots={state.consumableSlots}
                vertical={false}
              />
            </div>
            </div>

            {/* Scoring chain */}
            {state.lastScore !== null && state.lastBaseScore !== null && (
              <ScoreChain
                baseScore={state.lastBaseScore}
                handName={state.lastHandName ?? ''}
                steps={state.lastScoreChain}
                finalScore={state.lastScore}
                skimRate={state.skimRate}
              />
            )}

          </div>
        )}

        {/* SCORE REVIEW — pause after last hand before advancing */}
        {state.phase === 'score-review' && (
          <div className="w-full max-w-2xl flex flex-col gap-5 items-center">
            <div className="title-font text-2xl gold-glow tracking-widest">Round Complete</div>
            {state.lastScore !== null && state.lastBaseScore !== null && (
              <ScoreChain
                baseScore={state.lastBaseScore}
                handName={state.lastHandName ?? ''}
                steps={state.lastScoreChain}
                finalScore={state.lastScore}
                skimRate={state.skimRate}
              />
            )}
            <div className="grid grid-cols-2 gap-3 w-full">
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
            <button
              onClick={() => { playButtonPress(); dispatch({ type: 'CONTINUE_SCORE_REVIEW' }); }}
              className="btn-primary text-lg px-12 py-3 mt-2"
            >
              Continue to Results →
            </button>
          </div>
        )}

        {/* ROUND END */}
        {state.phase === 'round-end' && (
          <SkimReport
            result={roundPreviewResult}
            round={state.round}
            roundInAnte={state.roundInAnte}
            ante={state.ante}
            onContinue={() => { playButtonPress(); dispatch({ type: 'NEXT_ROUND' }); }}
          />
        )}

        {/* ANTE COMPLETE */}
        {state.phase === 'ante-complete' && (
          <div className="flex flex-col items-center gap-6 text-center p-8 max-w-sm">
            <div className="title-font text-4xl gold-glow tracking-widest">✦ ROUND {state.ante - 1} COMPLETE ✦</div>
            <div className="text-gray-400 text-sm">The stakes are rising. Round {state.ante} begins.</div>
            <div className="text-amber-400 text-sm font-semibold">
              Vault target: <span className="gold-glow chip-counter">{state.vaultTarget.toLocaleString()}</span>
            </div>
            <button onClick={() => { playButtonPress(); [0,1,2,3,4].forEach(i => playCardDeal(i)); dispatch({ type: 'START_ANTE' }); }} className="btn-primary text-xl px-16 py-4 mt-2">
              START ROUND {state.ante} →
            </button>
          </div>
        )}

        {/* SHOP */}
        {state.phase === 'shop' && (
          <div className="game-canvas">
          <Shop
            items={state.shopItems}
            personalChips={state.personalChips}
            consumableCount={state.consumables.length}
            chipCount={state.chipStack.length}
            maxChips={state.purchasedUpgrades.includes(UpgradeType.EXTRA_CHIP_SLOT) ? 6 : 5}
            deckSize={state.deck.length}
            lowCardCount={state.deck.filter(c => c.rank <= 8).length}
            availableBounties={state.availableBounties}
            chipStack={state.chipStack}
            purchasedUpgrades={state.purchasedUpgrades}
            shopDiscount={state.shopDiscount}
            onBuy={id => { playPurchase(); dispatch({ type: 'BUY_ITEM', itemId: id }); }}
            onAcceptBounty={id => dispatch({ type: 'ACCEPT_BOUNTY', bountyId: id })}
            handLevels={state.handLevels}
            shopHandUpgrades={state.shopHandUpgrades}
            handRerollCost={state.handRerollCost}
            onSellChip={index => dispatch({ type: 'SELL_CHIP', index })}
            onBuyUpgrade={t => { playPurchase(); dispatch({ type: 'BUY_UPGRADE', upgradeType: t }); }}
            onBuyHandUpgrade={rank => { playPurchase(); dispatch({ type: 'BUY_HAND_UPGRADE', handRank: rank }); }}
            onRerollHandUpgrades={() => dispatch({ type: 'REROLL_HAND_UPGRADES' })}
            onBuyForge={rarity => { playPurchase(); dispatch({ type: 'BUY_FORGE', rarity }); }}
            currentTheme={state.theme}
            onSetTheme={theme => dispatch({ type: 'SET_THEME', theme })}
            onViewDeck={() => setShowDeckViewer(true)}
            onEndShop={() => dispatch({ type: 'END_SHOP' })}
          />
          </div>
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
            <button onClick={() => { dispatch({ type: 'RESET' }); setAppScreen('mainmenu'); }} className="btn-primary text-base px-12">PLAY AGAIN</button>
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
            <button onClick={() => { dispatch({ type: 'RESET' }); setAppScreen('mainmenu'); }} className="btn-primary text-base px-12">PLAY AGAIN</button>
          </div>
        )}
      </main>

      {/* Consumable result modal */}
      {state.consumableResult && (
        <ResultModal
          title={state.consumableResult.title}
          message={state.consumableResult.message}
          onDismiss={() => dispatch({ type: 'DISMISS_RESULT' })}
        />
      )}

      {/* ── Menu panel overlay ── */}
      <MenuPanel
        open={showMenu}
        onClose={() => setShowMenu(false)}
        onDevWin={() => dispatch({ type: 'DEBUG_WIN' })}
        onCatalog={() => setShowCatalog(true)}
        onTutorial={() => setAppScreen('tutorial')}
        onMainMenu={() => { dispatch({ type: 'RESET' }); setAppScreen('mainmenu'); }}
      />
      {showCatalog && <DebugIndex onClose={() => setShowCatalog(false)} />}
      {state.forgeResult && (
        <ForgeResultModal
          card={state.forgeResult.card}
          modifier={state.forgeResult.modifier}
          onDismiss={() => dispatch({ type: 'DISMISS_RESULT' })}
        />
      )}
      {state.pendingPackResult && (
        <PackOpenModal
          result={state.pendingPackResult}
          onConfirm={() => dispatch({ type: 'CONFIRM_PACK' })}
        />
      )}
      {showDeckViewer && (
        <DeckViewer
          deck={state.deck}
          hand={state.hand}
          community={state.communityCards}
          playedCardIds={state.playedCardIds}
          handLevels={state.handLevels}
          onClose={() => setShowDeckViewer(false)}
        />
      )}
    </div>
  );
}

export default App;
