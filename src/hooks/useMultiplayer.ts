// WebSocket hook for SKIM co-op multiplayer
import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = (() => {
  const secure = window.location.protocol === 'https:';
  return `${secure ? 'wss' : 'ws'}://${window.location.hostname}:5174`;
})();

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

// Keep one socket alive across Lobby -> Coop transitions.
let sharedSocket: WebSocket | null = null;
const listeners = new Set<(msg: ServerMsg) => void>();
const connListeners = new Set<(connected: boolean) => void>();
const errListeners = new Set<(error: string | null) => void>();

function emitConnected(next: boolean) {
  for (const fn of connListeners) fn(next);
}

function emitError(next: string | null) {
  for (const fn of errListeners) fn(next);
}

function ensureSocket() {
  if (sharedSocket && (sharedSocket.readyState === WebSocket.OPEN || sharedSocket.readyState === WebSocket.CONNECTING)) {
    return sharedSocket;
  }

  try {
    sharedSocket = new WebSocket(WS_URL);
  } catch {
    emitError('Multiplayer socket failed to initialize');
    emitConnected(false);
    // Return a closed-ish placeholder to avoid crashing callers.
    // Next interaction can retry ensureSocket().
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ readyState: WebSocket.CLOSED } as any) as WebSocket;
  }

  sharedSocket.onopen = () => {
    emitConnected(true);
    emitError(null);
  };

  sharedSocket.onclose = () => {
    emitConnected(false);
  };

  sharedSocket.onerror = () => {
    emitError('Connection failed');
    emitConnected(false);
  };

  sharedSocket.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data) as ServerMsg;
      for (const listener of listeners) listener(msg);
    } catch {
      // ignore malformed payloads
    }
  };

  return sharedSocket;
}

export function useMultiplayer({ onMessage }: UseMultiplayerOptions) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    ensureSocket();

    const msgHandler = (msg: ServerMsg) => onMessageRef.current(msg);
    listeners.add(msgHandler);
    connListeners.add(setConnected);
    errListeners.add(setError);

    const socket = sharedSocket;
    if (socket?.readyState === WebSocket.OPEN) {
      setConnected(true);
      setError(null);
    } else if (socket?.readyState === WebSocket.CONNECTING) {
      setConnected(false);
    } else {
      setConnected(false);
    }

    return () => {
      listeners.delete(msgHandler);
      connListeners.delete(setConnected);
      errListeners.delete(setError);
      // Intentionally keep the socket alive between screens.
    };
  }, []);

  const send = useCallback((msg: object) => {
    const socket = ensureSocket();
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
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
