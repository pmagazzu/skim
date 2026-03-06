// Co-op game page — 2-player shared vault
import { useReducer, useEffect, useCallback, useState } from 'react';
import { coopReducer, makeInitialCoopState } from '../game/coopState';
import type { CoopAction } from '../game/coopState';
import { useMultiplayer } from '../hooks/useMultiplayer';
import type { ServerMsg } from '../hooks/useMultiplayer';
import { Hand } from '../components/Hand';
import { CommunityCards } from '../components/CommunityCards';
import { Vault } from '../components/Vault';
import type { CoopGameState } from '../game/multiplayerState';

const EMOTES = ['👍', '😬', '🔥', '💀', '🤑', '🫡'];

interface CoopGameProps {
  roomCode: string;
  playerIndex: 0 | 1;
  onExit: () => void;
}

export function CoopGame({ roomCode, playerIndex, onExit }: CoopGameProps) {
  const [state, dispatch] = useReducer(coopReducer, makeInitialCoopState(roomCode, playerIndex));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortMode] = useState<'rank' | 'suit'>('rank');
  const isMyTurn = state.activePlayerIndex === playerIndex;
  const me = state.players[playerIndex];
  const opponent = state.players[playerIndex === 0 ? 1 : 0];

  // Host (player 0) is the authority — they sync state to player 1
  const isHost = playerIndex === 0;

  const { connected, sendAction, syncState, sendEmote } = useMultiplayer({
    onMessage: useCallback((msg: ServerMsg) => {
      if (msg.type === 'PLAYER_JOINED') {
        dispatch({ type: 'OPPONENT_JOINED' });
      }
      if (msg.type === 'GAME_ACTION') {
        // Only apply if it came from the opponent
        if (msg.fromPlayerIndex !== playerIndex) {
          dispatch(msg.action as CoopAction);
        }
      }
      if (msg.type === 'STATE_SYNC') {
        // Non-host receives canonical state from host
        if (!isHost) {
          dispatch({ type: 'SET_STATE', state: msg.state as CoopGameState });
        }
      }
      if (msg.type === 'PLAYER_LEFT') {
        // TODO: show disconnect notice
      }
    }, [playerIndex, isHost]),
  });

  // Entering co-op means both players already readied in lobby.
  // Host starts the first deal once this screen mounts.
  useEffect(() => {
    if (isHost) {
      sendAction({ type: 'DEAL', myPlayerIndex: playerIndex });
      dispatch({ type: 'DEAL', myPlayerIndex: playerIndex });
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Host syncs state after every action
  useEffect(() => {
    if (isHost && state.phase !== 'lobby') {
      syncState(state);
    }
  }, [state, isHost, syncState]);

  // Broadcast an action and also apply locally
  function broadcastAction(action: CoopAction) {
    dispatch(action);
    sendAction(action);
  }

  function handlePlay() {
    if (!isMyTurn || selectedIds.length === 0) return;
    broadcastAction({ type: 'PLAY_HAND', playerIndex, selectedIds });
    setSelectedIds([]);
  }

  function handleDiscard() {
    if (!isMyTurn) return;
    broadcastAction({ type: 'DISCARD_HAND', playerIndex, selectedIds });
    setSelectedIds([]);
  }

  function handleSelect(id: string) {
    if (!isMyTurn) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleEndShop() {
    broadcastAction({ type: 'END_SHOP' });
  }

  if (!me) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#ca8a04', fontFamily: "'Press Start 2P',monospace", fontSize: 12 }}>
        Waiting for game to start...
      </div>
    );
  }

  const handsLeft = state.maxHandsPerRound - state.handsPlayedThisRound;
  const vaultPct = Math.min(1, state.vault / Math.max(1, state.vaultTarget));

  return (
    <div style={{ minHeight: '100vh', background: '#0a0804', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, gap: 12 }}>

      {/* Header strip */}
      <div style={{ width: '100%', maxWidth: 844, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: '#6b5a3e' }}>
          ROUND {state.ante} · LEVEL {state.roundInAnte}/3
        </div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: connected ? '#22c55e' : '#ef4444' }}>
          {connected ? '● CONNECTED' : '● DISCONNECTED'}
        </div>
        <button onClick={onExit} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 8, background: 'transparent', border: '1px solid #3a2e1e', borderRadius: 4, color: '#6b5a3e', padding: '4px 8px', cursor: 'pointer' }}>
          EXIT
        </button>
      </div>

      {/* Turn indicator */}
      <div style={{
        width: '100%', maxWidth: 844,
        padding: '8px 16px', borderRadius: 8,
        background: isMyTurn ? 'rgba(146,64,14,0.2)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isMyTurn ? '#ca8a04' : '#1a1a1a'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, color: isMyTurn ? '#fbbf24' : '#4b5563' }}>
          {isMyTurn ? '▶ YOUR TURN' : `⏳ PLAYER ${state.activePlayerIndex + 1}'S TURN`}
        </div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#6b5a3e' }}>
          {handsLeft} hands left (shared)
        </div>
        {/* Emotes */}
        <div style={{ display: 'flex', gap: 4 }}>
          {EMOTES.map(e => (
            <button key={e} onClick={() => sendEmote(e)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2,
            }}>{e}</button>
          ))}
        </div>
      </div>

      {/* Vault */}
      <div style={{ width: '100%', maxWidth: 844 }}>
        <Vault value={state.vault} target={state.vaultTarget} />
      </div>

      {/* Opponent status bar */}
      <div style={{
        width: '100%', maxWidth: 844, padding: '8px 16px', borderRadius: 8,
        background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: '#4b5563' }}>
          PARTNER
        </div>
        {opponent ? (
          <>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#6b5a3e' }}>
              💰 {opponent.personalChips}c
            </div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#6b5a3e' }}>
              🃏 {opponent.hand.length} cards
            </div>
            {opponent.lastHandName && (
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#fbbf24' }}>
                Last: {opponent.lastHandName} (+{opponent.lastScore})
              </div>
            )}
          </>
        ) : (
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#4b5563' }}>
            Waiting for partner...
          </div>
        )}
      </div>

      {/* Community cards */}
      <div style={{ width: '100%', maxWidth: 844 }}>
        <CommunityCards
          cards={state.communityCards}
          selectedIds={isMyTurn ? selectedIds : []}
          onSelect={isMyTurn ? handleSelect : () => {}}
          newCardIds={state.newCommunityIds}
          sortMode={sortMode}
        />
      </div>

      {/* Player hand */}
      {state.phase === 'selecting' && (
        <div style={{ width: '100%', maxWidth: 844 }}>
          <Hand
            hand={me.hand}
            selectedIds={selectedIds}
            onSelect={isMyTurn ? handleSelect : () => {}}
            onPlay={handlePlay}
            onDiscard={handleDiscard}
            handResult={null}
            chipPreview={0}
            disabled={!isMyTurn}
            scratchMultiplier={me.scratchMultiplier}
            handsLeft={handsLeft}
            handsPlayed={state.handsPlayedThisRound}
            maxHands={state.maxHandsPerRound}
            vault={state.vault}
            vaultTarget={state.vaultTarget}
            turnTimeRemaining={null}
            sortMode={sortMode}
            onSortChange={() => {}}
            discardsUsed={me.discardedThisRound}
            maxFreeDiscards={me.maxFreeDiscards}
            extraDiscardCost={me.extraDiscardCost}
            personalChips={me.personalChips}
            handLevels={me.handLevels}
          />
        </div>
      )}

      {/* Score review */}
      {state.phase === 'score-review' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32 }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 16, color: state.vault >= state.vaultTarget ? '#22c55e' : '#ef4444' }}>
            {state.vault >= state.vaultTarget ? '✦ VAULT FILLED ✦' : '✗ VAULT FAILED'}
          </div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#ca8a04' }}>
            {state.vault.toLocaleString()} / {state.vaultTarget.toLocaleString()} chips
          </div>
          {state.vault >= state.vaultTarget ? (
            <button onClick={() => broadcastAction({ type: 'OPEN_SHOP' })}
              style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, background: '#92400e', border: '1px solid #ca8a04', borderRadius: 6, color: '#fde68a', padding: '12px 24px', cursor: 'pointer' }}>
              OPEN SHOP →
            </button>
          ) : (
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#ef4444' }}>
              Game over. You both lose.
            </div>
          )}
        </div>
      )}

      {/* Shop — simplified for now */}
      {state.phase === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32 }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 14, color: '#ca8a04' }}>SHOP</div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#6b5a3e' }}>
            Full shop UI coming soon — each player shops with their own wallet
          </div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: '#fbbf24' }}>
            Your chips: {me.personalChips}c
          </div>
          <button onClick={handleEndShop}
            style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, background: '#92400e', border: '1px solid #ca8a04', borderRadius: 6, color: '#fde68a', padding: '12px 24px', cursor: 'pointer' }}>
            NEXT ROUND →
          </button>
        </div>
      )}
    </div>
  );
}
