import { useState, useEffect } from 'react';
import { useMultiplayer } from '../hooks/useMultiplayer';
import type { ServerMsg } from '../hooks/useMultiplayer';

interface LobbyProps {
  onGameStart: (roomCode: string, playerIndex: 0 | 1) => void;
  onBack: () => void;
}

export function Lobby({ onGameStart, onBack }: LobbyProps) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerIndex, setPlayerIndex] = useState<0 | 1 | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerId = useState(() => `player-${Math.random().toString(36).slice(2, 8)}`)[0];

  const { connected, error: wsError, createRoom, joinRoom, setReady } = useMultiplayer({
    onMessage: (msg: ServerMsg) => {
      if (msg.type === 'ROOM_CREATED') {
        setRoomCode(msg.code);
        setPlayerIndex(0);
        setMode('create');
      }
      if (msg.type === 'ROOM_JOINED') {
        setRoomCode(msg.code);
        setPlayerIndex(1);
        setOpponentJoined(true); // host is already there
      }
      if (msg.type === 'PLAYER_JOINED') {
        setOpponentJoined(true);
      }
      if (msg.type === 'PLAYER_READY') {
        if (msg.playerIndex !== playerIndex) setOpponentReady(true);
        else setMyReady(true);
      }
      if (msg.type === 'ALL_READY') {
        if (roomCode && playerIndex !== null) {
          onGameStart(roomCode, playerIndex as 0 | 1);
        }
      }
      if (msg.type === 'ERROR') {
        setError(msg.message);
      }
    },
  });

  const handleCreate = () => { createRoom(playerId); };
  const handleJoin = () => {
    if (joinCode.length < 4) { setError('Enter a valid room code'); return; }
    joinRoom(joinCode, playerId);
  };
  const handleReady = () => { setReady(); setMyReady(true); };

  const styles = {
    container: {
      minHeight: '100vh', display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0804', gap: 24,
    },
    title: { fontFamily: "'Press Start 2P',monospace", fontSize: 28, color: '#ca8a04', letterSpacing: '0.1em' },
    card: {
      background: '#111008', border: '1px solid #3a2e1e', borderRadius: 12,
      padding: '32px 40px', width: 380, display: 'flex', flexDirection: 'column' as const, gap: 16,
    },
    btn: (primary: boolean) => ({
      fontFamily: "'Press Start 2P',monospace", fontSize: 10,
      padding: '12px 24px', borderRadius: 6, cursor: 'pointer',
      background: primary ? '#92400e' : 'transparent',
      border: `1px solid ${primary ? '#ca8a04' : '#3a2e1e'}`,
      color: primary ? '#fde68a' : '#6b5a3e',
      width: '100%',
    }),
    label: { fontFamily: "'VT323',monospace", fontSize: 16, color: '#6b5a3e' },
    input: {
      fontFamily: "'VT323',monospace", fontSize: 22,
      background: '#0a0804', border: '1px solid #3a2e1e', borderRadius: 6,
      color: '#fde68a', padding: '8px 12px', width: '100%',
      textAlign: 'center' as const, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
      outline: 'none',
    },
    code: {
      fontFamily: "'Press Start 2P',monospace", fontSize: 32, color: '#fbbf24',
      letterSpacing: '0.3em', textAlign: 'center' as const,
      border: '1px solid #3a2e1e', borderRadius: 8, padding: '16px',
      background: '#0a0804',
    },
    pip: (on: boolean) => ({
      width: 12, height: 12, borderRadius: '50%',
      background: on ? '#22c55e' : '#1a1a1a',
      boxShadow: on ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
      border: '1.5px solid #333',
    }),
  };

  if (!connected) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>CONNECTING...</div>
        {wsError && <div style={{ color: '#ef4444', fontFamily: "'VT323',monospace", fontSize: 16 }}>{wsError}</div>}
        <button style={styles.btn(false)} onClick={onBack}>← BACK</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>CO-OP MODE</div>

      {error && (
        <div style={{ color: '#ef4444', fontFamily: "'VT323',monospace", fontSize: 16, letterSpacing: '0.05em' }}>
          ⚠ {error}
        </div>
      )}

      {/* Choose action */}
      {mode === 'choose' && (
        <div style={styles.card}>
          <div style={{ ...styles.label, textAlign: 'center', marginBottom: 8 }}>
            Share the vault. Split the skim.
          </div>
          <button style={styles.btn(true)} onClick={handleCreate}>CREATE ROOM</button>
          <button style={styles.btn(false)} onClick={() => setMode('join')}>JOIN ROOM</button>
          <button style={styles.btn(false)} onClick={onBack}>← SOLO MODE</button>
        </div>
      )}

      {/* Join flow */}
      {mode === 'join' && !roomCode && (
        <div style={styles.card}>
          <div style={styles.label}>Enter room code:</div>
          <input
            style={styles.input}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="______"
            maxLength={6}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
          <button style={styles.btn(true)} onClick={handleJoin}>JOIN</button>
          <button style={styles.btn(false)} onClick={() => { setMode('choose'); setError(null); }}>← BACK</button>
        </div>
      )}

      {/* Lobby waiting room */}
      {roomCode && playerIndex !== null && (
        <div style={styles.card}>
          {playerIndex === 0 && (
            <>
              <div style={{ ...styles.label, textAlign: 'center' }}>Share this code:</div>
              <div style={styles.code}>{roomCode}</div>
            </>
          )}
          {playerIndex === 1 && (
            <div style={{ ...styles.label, textAlign: 'center', color: '#22c55e' }}>
              ✓ Joined room {roomCode}
            </div>
          )}

          {/* Player status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0' }}>
            {[0, 1].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.pip(i === 0 ? true : opponentJoined)} />
                <span style={{ ...styles.label, color: i === playerIndex ? '#fbbf24' : '#6b5a3e' }}>
                  Player {i + 1} {i === playerIndex ? '(you)' : ''}
                </span>
                <span style={{ ...styles.label, marginLeft: 'auto', color: i === 0 ? (myReady && i === playerIndex ? '#22c55e' : opponentReady && i !== playerIndex ? '#22c55e' : '#6b5a3e') : (opponentReady && i !== playerIndex ? '#22c55e' : myReady && i === playerIndex ? '#22c55e' : '#6b5a3e') }}>
                  {(i === playerIndex ? myReady : opponentReady) ? '✓ READY' : 'waiting...'}
                </span>
              </div>
            ))}
          </div>

          {!myReady && opponentJoined && (
            <button style={styles.btn(true)} onClick={handleReady}>READY UP ▶</button>
          )}
          {!opponentJoined && (
            <div style={{ ...styles.label, textAlign: 'center', animation: 'none', opacity: 0.6 }}>
              Waiting for partner...
            </div>
          )}
          {myReady && !opponentReady && (
            <div style={{ ...styles.label, textAlign: 'center', color: '#ca8a04' }}>
              Waiting for partner to ready up...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
