// Co-op game state reducer for SKIM 2-player mode
// Shared: vault, deck, community cards, bounties, shop
// Private: hand, personalChips, chipStack, handLevels, consumables

import { createDeck, shuffle, CardModifier } from './deck';
import type { Card, CardModifierValue } from './deck';
import { evaluateHand } from './hands';
import { chipValue, resolveModifiers, SCORE_TABLE } from './scoring';
import { applyChipsSequential } from './chips';
import type { ChipTypeValue, ScoreStep } from './chips';
import { calcVaultTarget } from './gameState';
import { generateBounties } from './bounties';
import type { CoopGameState, PlayerState } from './multiplayerState';
import { makeInitialPlayerState } from './multiplayerState';

const COMMUNITY_COUNT = 3;
const HANDS_PER_PLAYER = 4; // each player gets 4 hands = 8 total per round

// ── Actions ──────────────────────────────────────────────────────────────────
export type CoopAction =
  | { type: 'DEAL'; myPlayerIndex: 0 | 1 }
  | { type: 'SELECT_CARD'; id: string; playerIndex: 0 | 1 }
  | { type: 'PLAY_HAND'; playerIndex: 0 | 1; selectedIds: string[] }
  | { type: 'DISCARD_HAND'; playerIndex: 0 | 1; selectedIds: string[] }
  | { type: 'END_TURN'; playerIndex: 0 | 1 }
  | { type: 'OPEN_SHOP' }
  | { type: 'END_SHOP' }
  | { type: 'OPPONENT_JOINED' }
  | { type: 'SET_STATE'; state: CoopGameState };

// ── Initial state ─────────────────────────────────────────────────────────────
export function makeInitialCoopState(roomCode: string, myPlayerIndex: 0 | 1): CoopGameState {
  const player0 = makeInitialPlayerState(0, 'p0');
  return {
    roomCode,
    myPlayerIndex,
    activePlayerIndex: 0,
    vault: 0,
    vaultTarget: calcVaultTarget(1, 1),
    deck: [],
    ownedDeck: createDeck(),
    communityCards: [],
    newCommunityIds: [],
    ante: 1,
    round: 1,
    roundInAnte: 1,
    handsPlayedThisRound: 0,
    maxHandsPerRound: HANDS_PER_PLAYER * 2,
    bounties: generateBounties(1),
    shopItems: [],
    phase: 'lobby',
    players: [player0, null],
    lastRoundWon: false,
    connected: true,
    opponentConnected: false,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function updatePlayer(state: CoopGameState, index: 0 | 1, patch: Partial<PlayerState>): CoopGameState {
  const players = [...state.players] as CoopGameState['players'];
  if (players[index]) {
    players[index] = { ...players[index]!, ...patch };
  }
  return { ...state, players };
}

function nextActivePlayer(state: CoopGameState): 0 | 1 {
  return state.activePlayerIndex === 0 ? 1 : 0;
}

// Refresh community cards — replace used slots from deck
function refreshCommunity(
  community: Card[],
  usedIds: Set<string>,
  deck: Card[],
): { community: Card[]; deck: Card[]; newIds: string[] } {
  const newCommunity = [...community];
  const newDeck = [...deck];
  const newIds: string[] = [];
  for (let i = 0; i < newCommunity.length; i++) {
    if (usedIds.has(newCommunity[i].id)) {
      if (newDeck.length > 0) {
        const replacement = newDeck.shift()!;
        newCommunity[i] = replacement;
        newIds.push(replacement.id);
      }
    }
  }
  return { community: newCommunity, deck: newDeck, newIds };
}

// ── Reducer ───────────────────────────────────────────────────────────────────
export function coopReducer(state: CoopGameState, action: CoopAction): CoopGameState {

  if (action.type === 'SET_STATE') return action.state;

  if (action.type === 'OPPONENT_JOINED') {
    const p1 = makeInitialPlayerState(1, 'p1');
    const players: CoopGameState['players'] = [state.players[0]!, p1];
    return { ...state, players, opponentConnected: true };
  }

  if (action.type === 'DEAL') {
    const deck = shuffle([...state.ownedDeck]);
    const community = deck.slice(0, COMMUNITY_COUNT);
    const remaining = deck.slice(COMMUNITY_COUNT);

    // Deal private hand to each player
    const handSize = 5;
    const p0Hand = remaining.slice(0, handSize);
    const p1Hand = remaining.slice(handSize, handSize * 2);
    const deckAfterDeal = remaining.slice(handSize * 2);

    const p0 = state.players[0]!;
    const p1 = state.players[1];
    const newPlayers: CoopGameState['players'] = [
      { ...p0, hand: p0Hand, discardedThisRound: 0, extraDiscardCost: 15, handsPlayedByMe: 0, lastScore: null, lastHandName: null },
      p1 ? { ...p1, hand: p1Hand, discardedThisRound: 0, extraDiscardCost: 15, handsPlayedByMe: 0, lastScore: null, lastHandName: null } : null,
    ];

    return {
      ...state,
      deck: deckAfterDeal,
      communityCards: community,
      newCommunityIds: community.map(c => c.id),
      handsPlayedThisRound: 0,
      activePlayerIndex: 0,
      vault: 0,
      phase: 'selecting',
      players: newPlayers,
    };
  }

  if (action.type === 'PLAY_HAND') {
    const { playerIndex, selectedIds } = action;
    const player = state.players[playerIndex];
    if (!player) return state;
    if (state.activePlayerIndex !== playerIndex) return state;

    const allAvailable = [...player.hand, ...state.communityCards];
    const selectedCards = allAvailable.filter(c => selectedIds.includes(c.id));

    // Ghost filtering
    const nonGhost = selectedCards.filter(c => c.modifier !== CardModifier.GHOST);
    const evalCards = nonGhost.map(c => {
      if (c.modifier !== CardModifier.WILD) return c;
      const suitCounts: Record<string, number> = {};
      for (const sc of nonGhost) if (sc.modifier !== CardModifier.WILD) suitCounts[sc.suit] = (suitCounts[sc.suit] ?? 0) + 1;
      const dominantSuit = (Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? c.suit) as Card['suit'];
      return { ...c, suit: dominantSuit };
    });

    const handResult = evaluateHand(evalCards.length > 0 ? evalCards : selectedCards);
    const handResultWithGhosts = { ...handResult, cards: [...handResult.cards, ...selectedCards.filter(c => c.modifier === CardModifier.GHOST)] };
    const baseChips = chipValue(handResultWithGhosts, selectedCards, player.handLevels);

    // Chip chain (using this player's chip stack)
    const suitBuckets: Record<string, number> = {};
    for (const c of selectedCards) suitBuckets[c.suit] = (suitBuckets[c.suit] ?? 0) + 1;
    const maxSuitCount = Math.max(0, ...Object.values(suitBuckets));
    const communityUsed = selectedCards.filter(c => state.communityCards.some(cc => cc.id === c.id));
    const isLastHand = state.handsPlayedThisRound + 1 >= state.maxHandsPerRound;
    const chain = applyChipsSequential(
      player.chipStack, baseChips, handResult.rank,
      player.handsPlayedByMe,
      false, // blackChipUsedThisRound — TODO: track per player
      selectedCards.length, maxSuitCount,
      selectedCards.some(c => c.suit === 'hearts'),
      communityUsed.length,
      player.discardedThisRound, isLastHand,
      selectedCards.every(c => c.suit === 'spades' || c.suit === 'clubs'),
      selectedCards.every(c => c.suit === 'hearts' || c.suit === 'diamonds'),
      state.maxHandsPerRound,
      player.scratchMultiplier,
      new Set(selectedCards.map(c => c.suit)).size,
    );

    // Modifier resolution
    const modResult = resolveModifiers(handResult.cards, selectedCards);
    const modSteps: ScoreStep[] = [];
    if (modResult.flatBonus !== 0) {
      const before = chain.finalScore;
      const after = before + modResult.flatBonus;
      modSteps.push({ chipType: null as unknown as ChipTypeValue, label: '✨ Card Modifiers', delta: modResult.flatBonus > 0 ? `+${modResult.flatBonus}` : `${modResult.flatBonus}`, before, after });
      chain.finalScore = after;
    }
    if (modResult.multBonus > 1) {
      const before = chain.finalScore;
      const after = Math.floor(before * modResult.multBonus);
      modSteps.push({ chipType: null as unknown as ChipTypeValue, label: '🔥 Card Mult', delta: `×${modResult.multBonus.toFixed(1)}`, before, after });
      chain.finalScore = after;
    }

    const total = chain.finalScore;
    const skimmed = Math.floor(total * player.skimRate);
    const vaultChips = total - skimmed + (chain.vaultBonus ?? 0);

    // Remove used community cards, refresh from deck
    const usedCommunityIds = new Set(communityUsed.map(c => c.id));
    const { community: newCommunity, deck: newDeck, newIds } = refreshCommunity(
      state.communityCards, usedCommunityIds, state.deck
    );

    // Remove used + played cards from player's hand
    const usedHandIds = new Set(selectedCards.filter(c => player.hand.some(h => h.id === c.id)).map(c => c.id));
    const newHand = player.hand.filter(c => !usedHandIds.has(c.id));

    // Handle Cursed card removal from ownedDeck
    const newOwnedDeck = modResult.cursedCardIds.length > 0
      ? state.ownedDeck.filter(c => !modResult.cursedCardIds.includes(c.id))
      : state.ownedDeck;

    const newHandsTotal = state.handsPlayedThisRound + 1;
    const roundDone = newHandsTotal >= state.maxHandsPerRound;

    let nextState = updatePlayer(state, playerIndex, {
      hand: newHand,
      personalChips: player.personalChips + skimmed,
      handsPlayedByMe: player.handsPlayedByMe + 1,
      scratchMultiplier: 1,
      lastScoreChain: [...chain.steps, ...modSteps],
      lastScore: total,
      lastHandName: handResult.name,
    });

    return {
      ...nextState,
      vault: state.vault + vaultChips,
      deck: newDeck,
      ownedDeck: newOwnedDeck,
      communityCards: newCommunity,
      newCommunityIds: newIds,
      handsPlayedThisRound: newHandsTotal,
      activePlayerIndex: roundDone ? state.activePlayerIndex : nextActivePlayer(state),
      phase: roundDone ? 'score-review' : 'selecting',
    };
  }

  if (action.type === 'DISCARD_HAND') {
    const { playerIndex } = action;
    const player = state.players[playerIndex];
    if (!player) return state;
    if (state.activePlayerIndex !== playerIndex) return state;

    const isFree = player.discardedThisRound < player.maxFreeDiscards;
    const cost = isFree ? 0 : player.extraDiscardCost;
    if (!isFree && player.personalChips < cost) return state;

    // Draw new private hand
    const newHand = state.deck.slice(0, 5);
    let deckAfterDraw = state.deck.slice(5);

    // Replace all 3 community cards (full discard burns the board)
    const newCommunity: Card[] = [];
    const newIds: string[] = [];
    for (let i = 0; i < COMMUNITY_COUNT; i++) {
      if (deckAfterDraw.length > 0) {
        const c = deckAfterDraw.shift()!;
        newCommunity.push(c);
        newIds.push(c.id);
      }
    }

    const newHandsTotal = state.handsPlayedThisRound + 1;
    const roundDone = newHandsTotal >= state.maxHandsPerRound;
    const newExtraCost = isFree ? player.extraDiscardCost : player.extraDiscardCost + 5;

    let nextState = updatePlayer(state, playerIndex, {
      hand: newHand,
      personalChips: player.personalChips - cost,
      discardedThisRound: player.discardedThisRound + 1,
      extraDiscardCost: newExtraCost,
      handsPlayedByMe: player.handsPlayedByMe + 1,
    });

    return {
      ...nextState,
      deck: deckAfterDraw,
      communityCards: newCommunity.length > 0 ? newCommunity : state.communityCards,
      newCommunityIds: newIds,
      handsPlayedThisRound: newHandsTotal,
      activePlayerIndex: roundDone ? state.activePlayerIndex : nextActivePlayer(state),
      phase: roundDone ? 'score-review' : 'selecting',
    };
  }

  if (action.type === 'OPEN_SHOP') {
    return { ...state, phase: 'shop' };
  }

  if (action.type === 'END_SHOP') {
    const nextRound = state.round + 1;
    const nextRoundInAnte = state.roundInAnte + 1;
    if (nextRoundInAnte > 3) {
      const nextAnte = state.ante + 1;
      return {
        ...state,
        phase: 'ante-complete',
        ante: nextAnte,
        roundInAnte: 1,
        round: nextRound,
        vaultTarget: calcVaultTarget(nextAnte, 1),
        bounties: generateBounties(nextRound),
      };
    }
    return {
      ...state,
      phase: 'dealing',
      round: nextRound,
      roundInAnte: nextRoundInAnte,
      vaultTarget: calcVaultTarget(state.ante, nextRoundInAnte),
      bounties: generateBounties(nextRound),
    };
  }

  return state;
}
