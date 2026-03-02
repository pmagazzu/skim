import { createDeck, shuffle } from './deck';
import type { Card } from './deck';
import { evaluateHand } from './hands';
import { chipValue } from './scoring';
import { ConsumableType, rollScratchMultiplier } from './consumables';
import type { ConsumableTypeValue } from './consumables';
import { ChipType, applyChips } from './chips';
import type { ChipTypeValue } from './chips';

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

const HAND_SIZE = 5;
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
    };
    const descs: Record<ConsumableTypeValue, string> = {
      SCRATCH_TICKET: 'x1–x5 multiplier on next hand',
      HIGH_CARD_DRAW: 'Draw 2 extra cards',
      ROULETTE: 'Bet up to 50 chips — double or nothing',
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
      RED: 40, BLUE: 60, BLACK: 80, GOLD: 100, LUCKY: 50,
    };
    const names: Record<ChipTypeValue, string> = {
      RED: 'Red Chip', BLUE: 'Blue Chip', BLACK: 'Black Chip', GOLD: 'Gold Chip', LUCKY: 'Lucky Chip',
    };
    const descs: Record<ChipTypeValue, string> = {
      RED: '+15 to every hand',
      BLUE: 'Pairs+ score ×1.2',
      BLACK: 'Once/round: double your skim',
      GOLD: 'Every 5th hand: +80 vault bonus',
      LUCKY: 'Random +10–50 per hand',
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
  phase: 'dealing',
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
  lastScore: null,
  lastHandName: null,
  lastBonusDetail: null,
  roundHistory: [],
  rouletteWins: 0,
  handSize: HAND_SIZE,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'DEAL': {
      const deck = shuffle(createDeck());
      const community = deck.slice(0, COMMUNITY_COUNT);
      const hand = deck.slice(COMMUNITY_COUNT, COMMUNITY_COUNT + state.handSize);
      const remaining = deck.slice(COMMUNITY_COUNT + state.handSize);
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

      const vaultFilled = newVault >= state.vaultTarget;
      const deckEmpty = newDeck.length === 0 && newHand.length < state.handSize;
      let phase: GamePhase = 'selecting';
      if (vaultFilled || deckEmpty) phase = 'round-end';

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
        handsPlayedThisRound: state.handsPlayedThisRound + 1,
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
        return { ...state, consumables: newConsumables, scratchMultiplier: rollScratchMultiplier() };
      }
      if (consumable === ConsumableType.HIGH_CARD_DRAW) {
        const drawn = state.deck.slice(0, 2);
        const newDeck = state.deck.slice(2);
        return { ...state, consumables: newConsumables, hand: [...state.hand, ...drawn], deck: newDeck };
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
      };
    }

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
