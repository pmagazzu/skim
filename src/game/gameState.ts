import { createDeck, shuffle } from './deck';
import type { Card } from './deck';
import { evaluateHand } from './hands';
import { chipValue } from './scoring';
import { ConsumableType, rollScratchMultiplier } from './consumables';
import type { ConsumableTypeValue } from './consumables';

export type GamePhase =
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
  type: 'consumable' | 'skim-upgrade';
  consumableType?: ConsumableTypeValue;
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
  selectedIds: string[];
  vault: number;
  vaultTarget: number;
  skimRate: number;
  personalChips: number;
  roundChips: number; // chips skimmed this round
  consumables: ConsumableTypeValue[];
  scratchMultiplier: number;
  shopItems: ShopItem[];
  round: number;
  totalRounds: number;
  lastScore: number | null;
  lastHandName: string | null;
  roundHistory: RoundResult[];
  rouletteWins: number;
  handSize: number;
}

export type GameAction =
  | { type: 'DEAL' }
  | { type: 'SELECT_CARD'; id: string }
  | { type: 'PLAY_HAND' }
  | { type: 'USE_CONSUMABLE'; consumable: ConsumableTypeValue }
  | { type: 'ROULETTE_BET'; amount: number }
  | { type: 'BUY_ITEM'; itemId: string }
  | { type: 'END_SHOP' }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET' };

const HAND_SIZE = 7;
const MAX_CONSUMABLES = 4;

function generateShop(_currentConsumables: ConsumableTypeValue[]): ShopItem[] {
  const allConsumables = Object.values(ConsumableType);
  // Shuffle and pick up to 3 consumable options
  const shuffled = [...allConsumables].sort(() => Math.random() - 0.5);
  const items: ShopItem[] = shuffled.slice(0, 3).map(ct => ({
    id: `shop-${ct}-${Date.now()}`,
    label: ct === ConsumableType.SCRATCH_TICKET ? 'Scratch Ticket' :
           ct === ConsumableType.HIGH_CARD_DRAW ? 'High Card Draw' : 'Roulette',
    description: ct === ConsumableType.SCRATCH_TICKET ? 'x1–x5 multiplier on next hand' :
                 ct === ConsumableType.HIGH_CARD_DRAW ? 'Draw 2 extra cards' : 'Double or nothing bet',
    cost: 30,
    type: 'consumable' as const,
    consumableType: ct,
  }));
  // Add skim upgrade
  items.push({
    id: `shop-skim-${Date.now()}`,
    label: 'Skim Rate +5%',
    description: 'Take a bigger cut from each hand played',
    cost: 50,
    type: 'skim-upgrade' as const,
  });
  return items;
}

export const initialState: GameState = {
  phase: 'dealing',
  deck: [],
  hand: [],
  selectedIds: [],
  vault: 0,
  vaultTarget: 300,
  skimRate: 0.10,
  personalChips: 200,
  roundChips: 0,
  consumables: [ConsumableType.SCRATCH_TICKET],
  scratchMultiplier: 1,
  shopItems: [],
  round: 1,
  totalRounds: 3,
  lastScore: null,
  lastHandName: null,
  roundHistory: [],
  rouletteWins: 0,
  handSize: HAND_SIZE,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'DEAL': {
      const deck = shuffle(createDeck());
      const hand = deck.slice(0, state.handSize);
      const remaining = deck.slice(state.handSize);
      return {
        ...state,
        phase: 'selecting',
        deck: remaining,
        hand,
        selectedIds: [],
        vault: 0,
        roundChips: 0,
        lastScore: null,
        lastHandName: null,
        scratchMultiplier: 1,
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

    case 'PLAY_HAND': {
      if (state.selectedIds.length === 0) return state;
      const selectedCards = state.hand.filter(c => state.selectedIds.includes(c.id));
      const handResult = evaluateHand(selectedCards);
      const total = chipValue(handResult, selectedCards, state.scratchMultiplier);
      const skimmed = Math.floor(total * state.skimRate);
      const vaultChips = total - skimmed;

      const newVault = state.vault + vaultChips;
      const newPersonal = state.personalChips + skimmed;
      const newRoundChips = state.roundChips + skimmed;

      // Remove played cards, refill from deck
      const remainingHand = state.hand.filter(c => !state.selectedIds.includes(c.id));
      const needed = state.handSize - remainingHand.length;
      const drawn = state.deck.slice(0, needed);
      const newDeck = state.deck.slice(needed);
      const newHand = [...remainingHand, ...drawn];

      const vaultFilled = newVault >= state.vaultTarget;
      const deckEmpty = newDeck.length === 0 && drawn.length < needed;

      let phase: GamePhase = 'selecting';
      if (vaultFilled || (deckEmpty && newVault < state.vaultTarget)) {
        phase = 'round-end';
      }

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
        lastScore: total,
        lastHandName: handResult.name,
      };
    }

    case 'USE_CONSUMABLE': {
      const { consumable } = action;
      if (!state.consumables.includes(consumable)) return state;
      const newConsumables = [...state.consumables];
      newConsumables.splice(newConsumables.indexOf(consumable), 1);

      if (consumable === ConsumableType.SCRATCH_TICKET) {
        const mult = rollScratchMultiplier();
        return { ...state, consumables: newConsumables, scratchMultiplier: mult };
      }

      if (consumable === ConsumableType.HIGH_CARD_DRAW) {
        const drawn = state.deck.slice(0, 2);
        const newDeck = state.deck.slice(2);
        const newHand = [...state.hand, ...drawn];
        return { ...state, consumables: newConsumables, hand: newHand, deck: newDeck };
      }

      // ROULETTE handled separately via ROULETTE_BET
      return { ...state, consumables: newConsumables };
    }

    case 'ROULETTE_BET': {
      const { amount } = action;
      const bet = Math.min(amount, 50, state.personalChips);
      const win = Math.random() < 0.5;
      const delta = win ? bet : -bet;
      return {
        ...state,
        personalChips: Math.max(0, state.personalChips + delta),
        rouletteWins: win ? state.rouletteWins + 1 : state.rouletteWins,
      };
    }

    case 'BUY_ITEM': {
      const item = state.shopItems.find(i => i.id === action.itemId);
      if (!item || state.personalChips < item.cost) return state;
      const newPersonal = state.personalChips - item.cost;
      const newShop = state.shopItems.filter(i => i.id !== action.itemId);

      if (item.type === 'skim-upgrade') {
        return {
          ...state,
          personalChips: newPersonal,
          shopItems: newShop,
          skimRate: Math.min(0.40, state.skimRate + 0.05),
        };
      }

      if (item.consumableType && state.consumables.length < MAX_CONSUMABLES) {
        return {
          ...state,
          personalChips: newPersonal,
          shopItems: newShop,
          consumables: [...state.consumables, item.consumableType],
        };
      }
      return state;
    }

    case 'END_SHOP': {
      const nextRound = state.round + 1;
      if (nextRound > state.totalRounds) {
        return { ...state, phase: 'victory' };
      }
      return {
        ...state,
        phase: 'dealing',
        round: nextRound,
        vaultTarget: Math.floor(state.vaultTarget * 1.5),
      };
    }

    case 'NEXT_ROUND': {
      const vaultFilled = state.vault >= state.vaultTarget;
      const vaultPct = Math.min(100, Math.floor((state.vault / state.vaultTarget) * 100));
      const result: RoundResult = {
        round: state.round,
        vaultFilled,
        vaultPct,
        personalChips: state.roundChips,
        skimRate: state.skimRate,
      };

      if (!vaultFilled) {
        return {
          ...state,
          phase: 'game-over',
          roundHistory: [...state.roundHistory, result],
        };
      }

      const shopItems = generateShop(state.consumables);
      return {
        ...state,
        phase: 'shop',
        shopItems,
        roundHistory: [...state.roundHistory, result],
      };
    }

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
