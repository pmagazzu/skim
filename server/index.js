// SKIM multiplayer server — port 5174
// Rooms: 2-player co-op, shared vault/deck/community, private hands/chips

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { randomBytes } from 'crypto';

const PORT = 5174;
const server = createServer();
const wss = new WebSocketServer({ server });

/** @type {Map<string, Room>} */
const rooms = new Map();

/**
 * @typedef {{ ws: WebSocket, playerId: string, playerIndex: number }} Player
 * @typedef {{ code: string, players: Player[], state: object|null, phase: string }} Room
 */

function genCode() {
  return randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F2C1"
}

function broadcast(room, msg) {
  const data = JSON.stringify(msg);
  for (const p of room.players) {
    if (p.ws.readyState === 1) p.ws.send(data);
  }
}

function sendTo(player, msg) {
  if (player.ws.readyState === 1) player.ws.send(JSON.stringify(msg));
}

wss.on('connection', (ws) => {
  let myRoom = null;
  let myPlayer = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (msg.type === 'CREATE_ROOM') {
      const code = genCode();
      const player = { ws, playerId: msg.playerId ?? randomBytes(4).toString('hex'), playerIndex: 0 };
      const room = { code, players: [player], state: null, phase: 'lobby' };
      rooms.set(code, room);
      myRoom = room;
      myPlayer = player;
      sendTo(player, { type: 'ROOM_CREATED', code, playerIndex: 0 });
      console.log(`Room ${code} created`);
      return;
    }

    // ── JOIN ─────────────────────────────────────────────────────────────────
    if (msg.type === 'JOIN_ROOM') {
      const room = rooms.get(msg.code?.toUpperCase());
      if (!room) { sendTo({ ws }, { type: 'ERROR', message: 'Room not found' }); return; }
      if (room.players.length >= 2) { sendTo({ ws }, { type: 'ERROR', message: 'Room full' }); return; }
      const player = { ws, playerId: msg.playerId ?? randomBytes(4).toString('hex'), playerIndex: 1 };
      room.players.push(player);
      myRoom = room;
      myPlayer = player;
      sendTo(player, { type: 'ROOM_JOINED', code: room.code, playerIndex: 1 });
      broadcast(room, { type: 'PLAYER_JOINED', playerCount: room.players.length });
      console.log(`Player joined room ${room.code}`);
      return;
    }

    // ── READY ────────────────────────────────────────────────────────────────
    if (msg.type === 'PLAYER_READY') {
      if (!myRoom) return;
      if (!myPlayer.ready) {
        myPlayer.ready = true;
        broadcast(myRoom, { type: 'PLAYER_READY', playerIndex: myPlayer.playerIndex });
      }
      const allReady = myRoom.players.length === 2 && myRoom.players.every(p => p.ready);
      if (allReady) {
        myRoom.phase = 'playing';
        broadcast(myRoom, { type: 'ALL_READY' });
        console.log(`Room ${myRoom.code} — game starting`);
      }
      return;
    }

    // ── GAME ACTION ──────────────────────────────────────────────────────────
    if (msg.type === 'GAME_ACTION') {
      if (!myRoom) return;
      // Relay action to both players (including sender so they can confirm)
      // The action includes who sent it — clients apply it to shared state
      broadcast(myRoom, {
        type: 'GAME_ACTION',
        action: msg.action,
        fromPlayerIndex: myPlayer.playerIndex,
      });
      return;
    }

    // ── STATE SYNC (host broadcasts canonical state) ──────────────────────
    if (msg.type === 'STATE_SYNC') {
      if (!myRoom) return;
      // Only player 0 (host) can push canonical state
      if (myPlayer.playerIndex !== 0) return;
      myRoom.state = msg.state;
      // Relay to player 1 only (player 0 already has it)
      const p1 = myRoom.players[1];
      if (p1) sendTo(p1, { type: 'STATE_SYNC', state: msg.state });
      return;
    }

    // ── CHAT / EMOTE ─────────────────────────────────────────────────────────
    if (msg.type === 'EMOTE') {
      if (!myRoom) return;
      broadcast(myRoom, { type: 'EMOTE', playerIndex: myPlayer.playerIndex, emote: msg.emote });
      return;
    }
  });

  ws.on('close', () => {
    if (!myRoom) return;
    myRoom.players = myRoom.players.filter(p => p !== myPlayer);
    broadcast(myRoom, { type: 'PLAYER_LEFT', playerIndex: myPlayer?.playerIndex });
    if (myRoom.players.length === 0) {
      rooms.delete(myRoom.code);
      console.log(`Room ${myRoom.code} deleted (empty)`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`SKIM multiplayer server running on ws://localhost:${PORT}`);
});
