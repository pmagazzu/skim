// WebSocket hook for SKIM co-op multiplayer
import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = `ws://${window.location.hostname}:5174`;

export type ServerMsg =
  | { type: 'ROOM_CREATED'; code: string; playerIndex: 0 }
  | { type: 'ROOM_JOINED'; code: string; playerIndex: 1 }
  | { type: 'PLAYER_JOINED'; playerCount: number }
  | { type: 'PLAYER_READY'; playerIndex: 0 | 1 }
  | { type: 'ALL_READY' }
  | { type: 'GAME_ACTION'; action: object; fromPlayerIndex: 0 | 1 }
  | { type: 'STATE_SYNC'; state: object }
  | { type: 'PLAYER_LEFT'; playerIndex: 0 | 1 }
  | { type: 'EMOTE'; playerIndex: 0 | 1; emote: string }
  | { type: 'ERROR'; message: string };

interface UseMultiplayerOptions {
  onMessage: (msg: ServerMsg) => void;
}

export function useMultiplayer({ onMessage }: UseMultiplayerOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => { setConnected(true); setError(null); };
    socket.onclose = () => { setConnected(false); };
    socket.onerror = () => { setError('Connection failed'); setConnected(false); };
    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerMsg;
        onMessageRef.current(msg);
      } catch { /* ignore */ }
    };

    return () => { socket.close(); };
  }, []);

  const send = useCallback((msg: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  const createRoom = useCallback((playerId: string) => {
    send({ type: 'CREATE_ROOM', playerId });
  }, [send]);

  const joinRoom = useCallback((code: string, playerId: string) => {
    send({ type: 'JOIN_ROOM', code: code.toUpperCase(), playerId });
  }, [send]);

  const setReady = useCallback(() => {
    send({ type: 'PLAYER_READY' });
  }, [send]);

  const sendAction = useCallback((action: object) => {
    send({ type: 'GAME_ACTION', action });
  }, [send]);

  const syncState = useCallback((state: object) => {
    send({ type: 'STATE_SYNC', state });
  }, [send]);

  const sendEmote = useCallback((emote: string) => {
    send({ type: 'EMOTE', emote });
  }, [send]);

  return { connected, error, createRoom, joinRoom, setReady, sendAction, syncState, sendEmote };
}
