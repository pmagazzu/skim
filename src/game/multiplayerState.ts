// Multiplayer state types for SKIM co-op mode
// Shared vault/deck/community; private hand/chips/chipStack/handLevels

import type { Card } from './deck';
import type { ChipTypeValue } from './chips';
import type { HandRankValue } from './hands';
import type { ConsumableTypeValue } from './consumables';
import type { Bounty } from './bounties';
import type { ShopItem } from './gameState';
import type { ScoreStep } from './chips';

// ── Per-player state ─────────────────────────────────────────────────────────
export interface PlayerState {
  playerId: string;
  playerIndex: 0 | 1;
  hand: Card[];
  personalChips: number;
  skimRate: number;
  chipStack: ChipTypeValue[];
  handLevels: Record<HandRankValue, number>;
  consumables: (ConsumableTypeValue | null)[];
  consumableSlots: number;
  discardedThisRound: number;
  maxFreeDiscards: number;
  extraDiscardCost: number;
  handsPlayedByMe: number;     // this player's hands this round
  scratchMultiplier: number;
  lastScoreChain: ScoreStep[];
  lastScore: number | null;
  lastHandName: string | null;
}

export function makeInitialPlayerState(playerIndex: 0 | 1, playerId: string): PlayerState {
  return {
    playerId,
    playerIndex,
    hand: [],
    personalChips: 100,
    skimRate: 0.3,
    chipStack: [],
    handLevels: { 1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1 },
    consumables: [null, null],
    consumableSlots: 2,
    discardedThisRound: 0,
    maxFreeDiscards: 2,
    extraDiscardCost: 15,
    handsPlayedByMe: 0,
    scratchMultiplier: 1,
    lastScoreChain: [],
    lastScore: null,
    lastHandName: null,
  };
}

// ── Shared game state ────────────────────────────────────────────────────────
export interface CoopGameState {
  // Room
  roomCode: string;
  myPlayerIndex: 0 | 1;
  activePlayerIndex: 0 | 1;

  // Shared resources
  vault: number;
  vaultTarget: number;
  deck: Card[];
  ownedDeck: Card[];
  communityCards: Card[];
  newCommunityIds: string[];
  ante: number;
  round: number;
  roundInAnte: number;
  handsPlayedThisRound: number;   // total across both players
  maxHandsPerRound: number;       // total budget (e.g. 8 = 4 each)
  bounties: Bounty[];
  shopItems: ShopItem[];

  // Phase
  phase: 'lobby' | 'dealing' | 'selecting' | 'score-review' | 'shop' | 'ante-complete' | 'game-over';

  // Per-player (indexed by playerIndex)
  players: [PlayerState, PlayerState | null];   // null until P2 joins

  // Score review
  lastRoundWon: boolean;

  // Connection
  connected: boolean;
  opponentConnected: boolean;
}
