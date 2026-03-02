import { createDeck, shuffle, rankName, suitSymbol } from './deck';
import type { Card } from './deck';
import { evaluateHand } from './hands';
import { chipValue } from './scoring';
import { ConsumableType, rollScratchMultiplier } from './consumables';
import type { ConsumableTypeValue } from './consumables';
import { ChipType, applyChips, bonusHandsFromChips } from './chips';
import type { ChipTypeValue } from './chips';

export type Difficulty = 'easy' | 'normal' | 'hard';

const HANDS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy:   10,
  normal:  8,
  hard:    6,
};

export type GamePhase =
  | 'difficulty'
  | 'dealing'
  | 'selecting'
  | 'shop'
  | 'round-end'
  | 'game-over'
  | 'victory';

export interface ShopItem {
  id: string;
  label: string;
  description: string;
  cost: number;
  type: 'consumable' | 'skim-upgrade' | 'chip';
  consumableType?: ConsumableTypeValue;
  chipType?: ChipTypeValue;
}

export interface RoundResult {
  round: number;
  vaultFilled: boolean;
  vaultPct: number;
  personalChips: number;
  skimRate: number;
}

export interface GameState {
  phase: GamePhase;
  deck: Card[];
  hand: Card[];
  communityCards: Card[];
  selectedIds: string[];
  maxHandsPerRound: number;
  vault: number;
  vaultTarget: number;
  skimRate: number;
  personalChips: number;
  roundChips: number;
  consumables: ConsumableTypeValue[];
  chipStack: ChipTypeValue[];
  scratchMultiplier: number;
  blackChipUsedThisRound: boolean;
  handsPlayedThisRound: number;
  shopItems: ShopItem[];
  round: number;
  totalRounds: number;
  lastScore: number | null;
  lastHandName: string | null;
  lastBonusDetail: string | null;
  consumableResult: { title: string; message: string } | null;
  roundHistory: RoundResult[];
  rouletteWins: number;
  handSize: number;
  difficulty: Difficulty;
}

export type GameAction =
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'DEAL' }
  | { type: 'SELECT_CARD'; id: string }
  | { type: 'PLAY_HAND' }
  | { type: 'DISCARD_HAND' }
  | { type: 'USE_CONSUMABLE'; consumable: ConsumableTypeValue }
  | { type: 'ROULETTE_BET'; amount: number }
  | { type: 'DISMISS_RESULT' }
  | { type: 'BUY_ITEM'; itemId: string }
  | { type: 'END_SHOP' }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET' };

const HAND_SIZE = 5;
const MAX_HANDS_PER_ROUND = 8;
const MAX_CONSUMABLES = 4;
const MAX_CHIPS = 5;
const COMMUNITY_COUNT = 3;

function generateShop(_held: ConsumableTypeValue[], chipStack: ChipTypeValue[]): ShopItem[] {
  const items: ShopItem[] = [];

  // 2 random consumables
  const allC = Object.values(ConsumableType);
  const shuffledC = [...allC].sort(() => Math.random() - 0.5).slice(0, 2);
  for (const ct of shuffledC) {
    const names: Record<ConsumableTypeValue, string> = {
      SCRATCH_TICKET: 'Scratch Ticket',
      HIGH_CARD_DRAW: 'High Card Draw',
      ROULETTE: 'Roulette',
      BURNED_HAND: 'Burned Hand',
    };
    const descs: Record<ConsumableTypeValue, string> = {
      SCRATCH_TICKET: 'x1–x5 multiplier on next hand',
      HIGH_CARD_DRAW: 'Draw 2 extra cards',
      ROULETTE: 'Bet up to 50 chips — double or nothing',
      BURNED_HAND: 'Sacrifice 1 hand → next scores ×3',
    };
    items.push({
      id: `shop-c-${ct}-${Date.now()}-${Math.random()}`,
      label: names[ct],
      description: descs[ct],
      cost: 30,
      type: 'consumable',
      consumableType: ct,
    });
  }

  // 2 random chips (prefer ones not yet owned)
  const allChips = Object.values(ChipType);
  const unowned = allChips.filter(ch => !chipStack.includes(ch));
  const chipPool = unowned.length >= 2 ? unowned : allChips;
  const shuffledCh = [...chipPool].sort(() => Math.random() - 0.5).slice(0, 2);
  for (const ch of shuffledCh) {
    const costs: Record<ChipTypeValue, number> = {
      RED: 40, BLUE: 60, BLACK: 80, GOLD: 100, LUCKY: 50, SILVER: 70,
    };
    const names: Record<ChipTypeValue, string> = {
      RED: 'Red Chip', BLUE: 'Blue Chip', BLACK: 'Black Chip', GOLD: 'Gold Chip', LUCKY: 'Lucky Chip', SILVER: 'Silver Chip',
    };
    const descs: Record<ChipTypeValue, string> = {
      RED: '+15 to every hand',
      BLUE: 'Pairs+ score ×1.2',
      BLACK: 'Once/round: double your skim',
      GOLD: 'Every 5th hand: +80 vault bonus',
      LUCKY: 'Random +10–50 per hand',
      SILVER: '+1 hand per round',
    };
    items.push({
      id: `shop-ch-${ch}-${Date.now()}-${Math.random()}`,
      label: names[ch],
      description: descs[ch],
      cost: costs[ch],
      type: 'chip',
      chipType: ch,
    });
  }

  // Skim upgrade
  items.push({
    id: `shop-skim-${Date.now()}`,
    label: 'Skim Rate +5%',
    description: 'Take a bigger personal cut from each hand',
    cost: 50,
    type: 'skim-upgrade',
  });

  return items;
}

export const initialState: GameState = {
  phase: 'difficulty',
  deck: [],
  hand: [],
  communityCards: [],
  selectedIds: [],
  vault: 0,
  vaultTarget: 300,
  skimRate: 0.10,
  personalChips: 200,
  roundChips: 0,
  consumables: [ConsumableType.SCRATCH_TICKET],
  chipStack: [],
  scratchMultiplier: 1,
  blackChipUsedThisRound: false,
  handsPlayedThisRound: 0,
  shopItems: [],
  round: 1,
  totalRounds: 3,
  maxHandsPerRound: MAX_HANDS_PER_ROUND,
  lastScore: null,
  lastHandName: null,
  lastBonusDetail: null,
  roundHistory: [],
  rouletteWins: 0,
  handSize: HAND_SIZE,
  consumableResult: null,
  difficulty: 'normal',
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_DIFFICULTY': {
      const base = HANDS_BY_DIFFICULTY[action.difficulty];
      return {
        ...state,
        difficulty: action.difficulty,
        maxHandsPerRound: base,
        phase: 'dealing',
      };
    }

    case 'DEAL': {
      const deck = shuffle(createDeck());
      const community = deck.slice(0, COMMUNITY_COUNT);
      const hand = deck.slice(COMMUNITY_COUNT, COMMUNITY_COUNT + state.handSize);
      const remaining = deck.slice(COMMUNITY_COUNT + state.handSize);
      const base = HANDS_BY_DIFFICULTY[state.difficulty];
      const bonus = bonusHandsFromChips(state.chipStack);
      return {
        ...state,
        phase: 'selecting',
        deck: remaining,
        hand,
        communityCards: community,
        selectedIds: [],
        vault: 0,
        roundChips: 0,
        handsPlayedThisRound: 0,
        blackChipUsedThisRound: false,
        lastScore: null,
        lastHandName: null,
        lastBonusDetail: null,
        scratchMultiplier: 1,
        maxHandsPerRound: base + bonus,
      };
    }

    case 'SELECT_CARD': {
      const { id } = action;
      const already = state.selectedIds.includes(id);
      if (already) {
        return { ...state, selectedIds: state.selectedIds.filter(x => x !== id) };
      }
      if (state.selectedIds.length >= 5) return state;
      return { ...state, selectedIds: [...state.selectedIds, id] };
    }

    case 'DISCARD_HAND': {
      if (state.handsPlayedThisRound >= state.maxHandsPerRound) return state;
      // Discard entire private hand and redraw, costs 1 hand
      const newHand = state.deck.slice(0, state.handSize);
      const newDeck = state.deck.slice(state.handSize);
      const newHandsPlayed = state.handsPlayedThisRound + 1;
      const outOfHands = newHandsPlayed >= state.maxHandsPerRound;
      return {
        ...state,
        hand: newHand,
        deck: newDeck,
        selectedIds: [],
        handsPlayedThisRound: newHandsPlayed,
        phase: outOfHands ? 'round-end' : 'selecting',
      };
    }

    case 'PLAY_HAND': {
      if (state.selectedIds.length === 0) return state;

      // Selected cards can come from hand OR community
      const allAvailable = [...state.hand, ...state.communityCards];
      const selectedCards = allAvailable.filter(c => state.selectedIds.includes(c.id));
      const handResult = evaluateHand(selectedCards);
      const baseChips = chipValue(handResult, selectedCards, state.scratchMultiplier);

      // Apply chip stack bonuses
      const bonuses = applyChips(
        state.chipStack,
        handResult.rank,
        state.handsPlayedThisRound,
        state.blackChipUsedThisRound,
      );

      const afterFlat = baseChips + bonuses.flatBonus;
      const total = Math.floor(afterFlat * bonuses.multiplier);

      // Skim split
      const effectiveSkimRate = bonuses.skimDoubled ? Math.min(0.9, state.skimRate * 2) : state.skimRate;
      const skimmed = Math.floor(total * effectiveSkimRate);
      const vaultChips = total - skimmed + bonuses.vaultBonus;

      const newVault = state.vault + vaultChips;
      const newPersonal = state.personalChips + skimmed;
      const newRoundChips = state.roundChips + skimmed;

      // Build bonus detail string
      const bonusParts: string[] = [];
      if (bonuses.flatBonus > 0) bonusParts.push(`+${bonuses.flatBonus} chips`);
      if (bonuses.multiplier > 1) bonusParts.push(`×${bonuses.multiplier.toFixed(1)}`);
      if (bonuses.skimDoubled) bonusParts.push('skim ×2!');
      if (bonuses.vaultBonus > 0) bonusParts.push(`+${bonuses.vaultBonus} vault bonus!`);

      // Refill hand (only private hand cards get replaced, not community)
      const playedFromHand = state.hand.filter(c => state.selectedIds.includes(c.id));
      const remainingHand = state.hand.filter(c => !state.selectedIds.includes(c.id));
      const needed = playedFromHand.length;
      const drawn = state.deck.slice(0, needed);
      const newDeck = state.deck.slice(needed);
      const newHand = [...remainingHand, ...drawn];

      const newHandsPlayed = state.handsPlayedThisRound + 1;
      const vaultFilled = newVault >= state.vaultTarget;
      const outOfHands = newHandsPlayed >= state.maxHandsPerRound;
      const deckEmpty = newDeck.length === 0 && newHand.length < state.handSize;
      let phase: GamePhase = 'selecting';
      if (vaultFilled || deckEmpty || outOfHands) phase = 'round-end';

      return {
        ...state,
        phase,
        vault: Math.min(newVault, state.vaultTarget + 9999),
        personalChips: newPersonal,
        roundChips: newRoundChips,
        hand: newHand,
        deck: newDeck,
        selectedIds: [],
        scratchMultiplier: 1,
        blackChipUsedThisRound: bonuses.skimDoubled ? true : state.blackChipUsedThisRound,
        handsPlayedThisRound: newHandsPlayed,
        lastScore: total,
        lastHandName: handResult.name,
        lastBonusDetail: bonusParts.length > 0 ? bonusParts.join(' · ') : null,
      };
    }

    case 'USE_CONSUMABLE': {
      const { consumable } = action;
      if (!state.consumables.includes(consumable)) return state;
      const newConsumables = [...state.consumables];
      newConsumables.splice(newConsumables.indexOf(consumable), 1);

      if (consumable === ConsumableType.SCRATCH_TICKET) {
        const mult = rollScratchMultiplier();
        return {
          ...state,
          consumables: newConsumables,
          scratchMultiplier: mult,
          consumableResult: {
            title: '🎫 Scratch Ticket',
            message: mult === 1
              ? 'No luck — ×1 multiplier this time.'
              : `You scratched ×${mult}! Your next hand scores ${mult}× chips.`,
          },
        };
      }
      if (consumable === ConsumableType.HIGH_CARD_DRAW) {
        const drawn = state.deck.slice(0, 2);
        const newDeck = state.deck.slice(2);
        const cardNames = drawn.map((c: Card) => `${rankName(c.rank)}${suitSymbol(c.suit)}`).join(' and ');
        return {
          ...state,
          consumables: newConsumables,
          hand: [...state.hand, ...drawn],
          deck: newDeck,
          consumableResult: {
            title: '🃏 High Card Draw',
            message: drawn.length === 0
              ? 'Deck is empty — no cards to draw.'
              : `Drew ${cardNames} into your hand.`,
          },
        };
      }
      if (consumable === ConsumableType.BURNED_HAND) {
        const handsLeft = state.maxHandsPerRound - state.handsPlayedThisRound;
        if (handsLeft <= 1) {
          return {
            ...state,
            consumableResult: { title: '🔥 Burned Hand', message: "Can't burn your last hand!" },
          };
        }
        return {
          ...state,
          consumables: newConsumables,
          handsPlayedThisRound: state.handsPlayedThisRound + 1,
          scratchMultiplier: 3,
          consumableResult: {
            title: '🔥 Burned Hand',
            message: 'One hand sacrificed to the fire. Your next hand scores ×3.',
          },
        };
      }
      return { ...state, consumables: newConsumables };
    }

    case 'ROULETTE_BET': {
      const bet = Math.min(action.amount, 50, state.personalChips);
      const win = Math.random() < 0.5;
      return {
        ...state,
        personalChips: Math.max(0, state.personalChips + (win ? bet : -bet)),
        rouletteWins: win ? state.rouletteWins + 1 : state.rouletteWins,
        consumableResult: {
          title: win ? '🎰 You Won!' : '🎰 The House Wins',
          message: win
            ? `The wheel hit your number. +${bet} chips added to your bank.`
            : `Better luck next time. -${bet} chips.`,
        },
      };
    }

    case 'DISMISS_RESULT':
      return { ...state, consumableResult: null };

    case 'BUY_ITEM': {
      const item = state.shopItems.find(i => i.id === action.itemId);
      if (!item || state.personalChips < item.cost) return state;
      const newPersonal = state.personalChips - item.cost;
      const newShop = state.shopItems.filter(i => i.id !== action.itemId);

      if (item.type === 'skim-upgrade') {
        return { ...state, personalChips: newPersonal, shopItems: newShop, skimRate: Math.min(0.40, state.skimRate + 0.05) };
      }
      if (item.type === 'consumable' && item.consumableType && state.consumables.length < MAX_CONSUMABLES) {
        return { ...state, personalChips: newPersonal, shopItems: newShop, consumables: [...state.consumables, item.consumableType] };
      }
      if (item.type === 'chip' && item.chipType && state.chipStack.length < MAX_CHIPS) {
        return { ...state, personalChips: newPersonal, shopItems: newShop, chipStack: [...state.chipStack, item.chipType] };
      }
      return state;
    }

    case 'END_SHOP': {
      const nextRound = state.round + 1;
      if (nextRound > state.totalRounds) return { ...state, phase: 'victory' };
      return { ...state, phase: 'dealing', round: nextRound, vaultTarget: Math.floor(state.vaultTarget * 1.5) };
    }

    case 'NEXT_ROUND': {
      const vaultFilled = state.vault >= state.vaultTarget;
      const vaultPct = Math.min(100, Math.floor((state.vault / state.vaultTarget) * 100));
      const result: RoundResult = { round: state.round, vaultFilled, vaultPct, personalChips: state.roundChips, skimRate: state.skimRate };
      if (!vaultFilled) {
        return { ...state, phase: 'game-over', roundHistory: [...state.roundHistory, result] };
      }
      return {
        ...state,
        phase: 'shop',
        shopItems: generateShop(state.consumables, state.chipStack),
        roundHistory: [...state.roundHistory, result],
      };
    }

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
