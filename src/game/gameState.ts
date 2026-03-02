import { createDeck, shuffle, rankName, suitSymbol } from './deck';
import type { Card } from './deck';
import { evaluateHand } from './hands';
import { chipValue } from './scoring';
import { ConsumableType, rollScratchMultiplier } from './consumables';
import type { ConsumableTypeValue } from './consumables';
import { ChipType, applyChipsSequential, bonusHandsFromChips, CHIPS } from './chips';
import type { ChipTypeValue, ScoreStep } from './chips';
import { generateBounties, checkBountyCondition, BountyReward } from './bounties';
import type { Bounty } from './bounties';

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
  rarity?: string;
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
  lastBaseScore: number | null;
  lastHandName: string | null;
  lastBonusDetail: string | null;
  consumableResult: { title: string; message: string } | null;
  roundHistory: RoundResult[];
  rouletteWins: number;
  handSize: number;
  difficulty: Difficulty;
  availableBounties: Bounty[];
  activeBounties: Bounty[];
  usedConsumableThisRound: boolean;
  discardedThisRound: boolean;
  bestHandScoreThisRound: number;
  bestHandRankThisRound: number;
  newCommunityIds: string[];
  lastScoreChain: ScoreStep[];  // sequential chip scoring steps for display
}

export type GameAction =
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'ACCEPT_BOUNTY'; bountyId: string }
  | { type: 'REORDER_CHIPS'; fromIndex: number; toIndex: number }
  | { type: 'CLEAR_NEW_COMMUNITY' }
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

function generateShop(_held: ConsumableTypeValue[], chipStack: ChipTypeValue[], round = 1): ShopItem[] {
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

  // Rarity-weighted chip offers (3 chips)
  const allChips = Object.values(ChipType);
  const unowned = allChips.filter(ch => !chipStack.includes(ch));
  const rarityWeight: Record<string, number> = { common: 4, uncommon: 2, rare: 1.2, legendary: round < 2 ? 0 : 0.3 };
  const weightedPool = (unowned.length >= 2 ? unowned : allChips).map(ch => ({ ch, weight: rarityWeight[CHIPS[ch].rarity] ?? 1 }));
  const pickedChips: ChipTypeValue[] = [];
  for (let i = 0; i < 3 && weightedPool.length > 0; i++) {
    const totalW = weightedPool.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * totalW;
    const idx = Math.max(0, weightedPool.findIndex(x => { r -= x.weight; return r <= 0; }));
    const pick = weightedPool.splice(idx, 1)[0];
    pickedChips.push(pick.ch);
  }
  for (const ch of pickedChips) {
    const chip = CHIPS[ch];
    items.push({ id: `shop-ch-${ch}-${Date.now()}-${Math.random()}`, label: chip.name, description: chip.description, cost: chip.cost, type: 'chip', chipType: ch });
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
  lastBaseScore: null,
  lastHandName: null,
  lastBonusDetail: null,
  roundHistory: [],
  rouletteWins: 0,
  handSize: HAND_SIZE,
  consumableResult: null,
  difficulty: 'normal',
  availableBounties: [],
  activeBounties: [],
  usedConsumableThisRound: false,
  discardedThisRound: false,
  bestHandScoreThisRound: 0,
  bestHandRankThisRound: 0,
  newCommunityIds: [],
  lastScoreChain: [],
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_DIFFICULTY': {
      const base = HANDS_BY_DIFFICULTY[action.difficulty];
      return {
        ...state,
        difficulty: action.difficulty,
        maxHandsPerRound: base,
        availableBounties: generateBounties(1),
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
        usedConsumableThisRound: false,
        discardedThisRound: false,
        bestHandScoreThisRound: 0,
        bestHandRankThisRound: 0,
        lastScore: null,
        lastBaseScore: null,
        lastHandName: null,
        lastBonusDetail: null,
        scratchMultiplier: 1,
        maxHandsPerRound: base + bonus,
        newCommunityIds: [],
        lastScoreChain: [],
        activeBounties: state.availableBounties.filter(b => b.accepted),
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
      // Discard entire private hand + leftmost community card, redraw both
      const newHand = state.deck.slice(0, state.handSize);
      let deckAfterDiscard = state.deck.slice(state.handSize);
      // Cycle leftmost community card
      const newCommunityCard = deckAfterDiscard[0] ? [deckAfterDiscard[0]] : [];
      deckAfterDiscard = deckAfterDiscard.slice(1);
      const newCommunity = [...state.communityCards.slice(1), ...newCommunityCard];
      const newHandsPlayed = state.handsPlayedThisRound + 1;
      const outOfHands = newHandsPlayed >= state.maxHandsPerRound;
      return {
        ...state,
        hand: newHand,
        communityCards: newCommunity,
        deck: deckAfterDiscard,
        selectedIds: [],
        handsPlayedThisRound: newHandsPlayed,
        discardedThisRound: true,
        newCommunityIds: newCommunityCard.map(c => c.id),
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

      // Apply chips SEQUENTIALLY — order matters!
      const chain = applyChipsSequential(
        state.chipStack,
        baseChips,
        handResult.rank,
        state.handsPlayedThisRound,
        state.blackChipUsedThisRound,
      );

      const total = chain.finalScore;

      // Skim split
      const effectiveSkimRate = chain.skimDoubled ? Math.min(0.9, state.skimRate * 2) : state.skimRate;
      const skimmed = Math.floor(total * effectiveSkimRate);
      const diamondBonus = chain.diamondActive ? Math.floor(skimmed * 0.5) : 0;
      const vaultChips = total - skimmed + chain.vaultBonus + diamondBonus;

      const newVault = state.vault + vaultChips;
      const newPersonal = state.personalChips + skimmed;
      const newRoundChips = state.roundChips + skimmed;

      const bonusParts: string[] = [];
      if (chain.skimDoubled) bonusParts.push('skim ×2!');
      if (chain.vaultBonus > 0) bonusParts.push(`+${chain.vaultBonus} vault!`);
      if (chain.diamondActive && diamondBonus > 0) bonusParts.push(`💎 +${diamondBonus} vault`);

      // Check per-hand bounties
      const updatedBounties = state.activeBounties.map(b => {
        if (b.completed) return b;
        const done = checkBountyCondition(b, { handRank: handResult.rank, handScore: total });
        return done ? { ...b, completed: true } : b;
      });

      // Refill hand (only private hand cards get replaced, not community)
      const playedFromHand = state.hand.filter(c => state.selectedIds.includes(c.id));
      const remainingHand = state.hand.filter(c => !state.selectedIds.includes(c.id));
      const handNeeded = playedFromHand.length;
      const drawnForHand = state.deck.slice(0, handNeeded);
      let deckAfterHand = state.deck.slice(handNeeded);
      const newHand = [...remainingHand, ...drawnForHand];

      // Replace used community cards
      const usedCommunityCards = state.communityCards.filter(c => state.selectedIds.includes(c.id));
      const remainingCommunity = state.communityCards.filter(c => !state.selectedIds.includes(c.id));
      const communityReplacements = deckAfterHand.slice(0, usedCommunityCards.length);
      deckAfterHand = deckAfterHand.slice(usedCommunityCards.length);
      const newCommunity = [...remainingCommunity, ...communityReplacements];
      const newCommunityIds = communityReplacements.map(c => c.id);

      const newDeck = deckAfterHand;

      const newHandsPlayed = state.handsPlayedThisRound + 1;
      const vaultFilled = newVault >= state.vaultTarget;
      const outOfHands = newHandsPlayed >= state.maxHandsPerRound;
      const deckEmpty = newDeck.length === 0 && newHand.length === 0;
      let phase: GamePhase = 'selecting';
      if (vaultFilled || deckEmpty || outOfHands) phase = 'round-end';

      return {
        ...state,
        phase,
        vault: Math.min(newVault, state.vaultTarget + 9999),
        personalChips: newPersonal,
        roundChips: newRoundChips,
        hand: newHand,
        communityCards: newCommunity,
        deck: newDeck,
        selectedIds: [],
        scratchMultiplier: 1,
        newCommunityIds,
        blackChipUsedThisRound: chain.skimDoubled ? true : state.blackChipUsedThisRound,
        handsPlayedThisRound: newHandsPlayed,
        bestHandScoreThisRound: Math.max(state.bestHandScoreThisRound, total),
        bestHandRankThisRound: Math.max(state.bestHandRankThisRound, handResult.rank),
        activeBounties: updatedBounties,
        lastScore: total,
        lastBaseScore: baseChips,
        lastHandName: handResult.name,
        lastBonusDetail: bonusParts.length > 0 ? bonusParts.join(' · ') : null,
        lastScoreChain: chain.steps,
      };
    }

    case 'USE_CONSUMABLE': {
      const { consumable } = action;
      if (!state.consumables.includes(consumable)) return state;
      const newConsumables = [...state.consumables];
      newConsumables.splice(newConsumables.indexOf(consumable), 1);
      // Check use-consumable bounties
      const bountiesAfterConsumable = state.activeBounties.map(b =>
        !b.completed && checkBountyCondition(b, { usedConsumable: true })
          ? { ...b, completed: true } : b
      );

      if (consumable === ConsumableType.SCRATCH_TICKET) {
        const mult = rollScratchMultiplier();
        return {
          ...state,
          consumables: newConsumables,
          scratchMultiplier: mult,
          usedConsumableThisRound: true,
          activeBounties: bountiesAfterConsumable,
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
          usedConsumableThisRound: true,
          activeBounties: bountiesAfterConsumable,
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
          usedConsumableThisRound: true,
          activeBounties: bountiesAfterConsumable,
          consumableResult: {
            title: '🔥 Burned Hand',
            message: 'One hand sacrificed to the fire. Your next hand scores ×3.',
          },
        };
      }
      return { ...state, consumables: newConsumables, usedConsumableThisRound: true, activeBounties: bountiesAfterConsumable };
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
      const handsRemaining = state.maxHandsPerRound - state.handsPlayedThisRound;
      const result: RoundResult = { round: state.round, vaultFilled, vaultPct, personalChips: state.roundChips, skimRate: state.skimRate };

      // Check end-of-round bounties and apply rewards
      const endCtx = {
        vaultFilled,
        skimRate: state.skimRate,
        handsRemaining,
        discarded: state.discardedThisRound,
      };
      let bonusChips = 0;
      let vaultReduction = 0;
      let skimBoost = 0;
      let extraHand = 0;
      const resolvedBounties = state.activeBounties.map(b => {
        const done = b.completed || checkBountyCondition(b, endCtx);
        if (done && !b.completed) {
          if (b.reward === BountyReward.CHIPS) bonusChips += b.rewardValue;
          if (b.reward === BountyReward.VAULT_REDUCE) vaultReduction += b.rewardValue;
          if (b.reward === BountyReward.SKIM_BOOST) skimBoost += b.rewardValue / 100;
          if (b.reward === BountyReward.EXTRA_HAND) extraHand += b.rewardValue;
        }
        return done ? { ...b, completed: true } : b;
      });

      if (!vaultFilled) {
        return { ...state, phase: 'game-over', roundHistory: [...state.roundHistory, result], activeBounties: resolvedBounties };
      }

      const newBounties = generateBounties(state.round + 1);
      return {
        ...state,
        phase: 'shop',
        shopItems: generateShop(state.consumables, state.chipStack, state.round),
        roundHistory: [...state.roundHistory, result],
        activeBounties: resolvedBounties,
        availableBounties: newBounties,
        personalChips: state.personalChips + bonusChips,
        skimRate: Math.min(0.40, state.skimRate + skimBoost),
      };
    }

    case 'ACCEPT_BOUNTY': {
      const updated = state.availableBounties.map(b =>
        b.id === action.bountyId ? { ...b, accepted: !b.accepted } : b
      );
      return { ...state, availableBounties: updated };
    }

    case 'REORDER_CHIPS': {
      const { fromIndex, toIndex } = action;
      const chips = [...state.chipStack];
      const [moved] = chips.splice(fromIndex, 1);
      chips.splice(toIndex, 0, moved);
      return { ...state, chipStack: chips };
    }

    case 'CLEAR_NEW_COMMUNITY':
      return { ...state, newCommunityIds: [] };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
