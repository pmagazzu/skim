import type { Card } from './deck';

export const HandRank = {
  HIGH_CARD: 1,
  ONE_PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10,
} as const;

export type HandRankValue = typeof HandRank[keyof typeof HandRank];

export const HAND_NAMES: Record<HandRankValue, string> = {
  1: 'High Card',
  2: 'One Pair',
  3: 'Two Pair',
  4: 'Three of a Kind',
  5: 'Straight',
  6: 'Flush',
  7: 'Full House',
  8: 'Four of a Kind',
  9: 'Straight Flush',
  10: 'Royal Flush',
};

export interface HandResult {
  rank: HandRankValue;
  name: string;
  cards: Card[];
}

function getCombinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (cards.length < k) return [];
  const [first, ...rest] = cards;
  const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function evaluate5(cards: Card[]): HandResult {
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5;
  const isAceLow = JSON.stringify(ranks) === JSON.stringify([14,5,4,3,2]);

  const rankCounts: Record<number, number> = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const resolvedStraight = isStraight || isAceLow;

  let handRank: HandRankValue;
  if (isFlush && resolvedStraight) {
    handRank = ranks[0] === 14 && !isAceLow ? HandRank.ROYAL_FLUSH : HandRank.STRAIGHT_FLUSH;
  } else if (counts[0] === 4) {
    handRank = HandRank.FOUR_OF_A_KIND;
  } else if (counts[0] === 3 && counts[1] === 2) {
    handRank = HandRank.FULL_HOUSE;
  } else if (isFlush) {
    handRank = HandRank.FLUSH;
  } else if (resolvedStraight) {
    handRank = HandRank.STRAIGHT;
  } else if (counts[0] === 3) {
    handRank = HandRank.THREE_OF_A_KIND;
  } else if (counts[0] === 2 && counts[1] === 2) {
    handRank = HandRank.TWO_PAIR;
  } else if (counts[0] === 2) {
    handRank = HandRank.ONE_PAIR;
  } else {
    handRank = HandRank.HIGH_CARD;
  }

  return { rank: handRank, name: HAND_NAMES[handRank], cards };
}

export function evaluateHand(cards: Card[]): HandResult {
  if (cards.length === 0) {
    return { rank: HandRank.HIGH_CARD, name: HAND_NAMES[HandRank.HIGH_CARD], cards: [] };
  }
  if (cards.length <= 5) {
    return evaluate5(cards);
  }
  const combos = getCombinations(cards, 5);
  let best: HandResult | null = null;
  for (const combo of combos) {
    const result = evaluate5(combo);
    if (!best || result.rank > best.rank) {
      best = result;
    }
  }
  return best!;
}
