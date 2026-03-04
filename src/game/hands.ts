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
  const isFlush = cards.length === 5 && suits.every(s => s === suits[0]);
  // Straight: exactly 5 unique consecutive ranks. Guard ranks[4] against undefined (< 5 cards).
  const isStraight = cards.length === 5 &&
    ranks[0] - ranks[4] === 4 &&
    new Set(ranks).size === 5;
  const isAceLow = cards.length === 5 && JSON.stringify(ranks) === JSON.stringify([14,5,4,3,2]);

  const rankCounts: Record<number, number> = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const resolvedStraight = isStraight || isAceLow;

  // Sort cards by rank descending for hand-card extraction
  const sortedCards = [...cards].sort((a, b) => b.rank - a.rank);

  let handRank: HandRankValue;
  let handCards: Card[];

  if (isFlush && resolvedStraight) {
    handRank = ranks[0] === 14 && !isAceLow ? HandRank.ROYAL_FLUSH : HandRank.STRAIGHT_FLUSH;
    handCards = sortedCards; // all 5
  } else if (counts[0] === 4) {
    handRank = HandRank.FOUR_OF_A_KIND;
    const quadRank = Number(Object.entries(rankCounts).find(([, v]) => v === 4)![0]);
    handCards = sortedCards.filter(c => c.rank === quadRank);
  } else if (counts[0] === 3 && counts[1] === 2) {
    handRank = HandRank.FULL_HOUSE;
    handCards = sortedCards; // all 5
  } else if (isFlush) {
    handRank = HandRank.FLUSH;
    handCards = sortedCards; // all 5
  } else if (resolvedStraight) {
    handRank = HandRank.STRAIGHT;
    handCards = sortedCards; // all 5
  } else if (counts[0] === 3) {
    handRank = HandRank.THREE_OF_A_KIND;
    const tripRank = Number(Object.entries(rankCounts).find(([, v]) => v === 3)![0]);
    handCards = sortedCards.filter(c => c.rank === tripRank);
  } else if (counts[0] === 2 && counts[1] === 2) {
    handRank = HandRank.TWO_PAIR;
    const pairRanks = Object.entries(rankCounts).filter(([, v]) => v === 2).map(([r]) => Number(r));
    handCards = sortedCards.filter(c => pairRanks.includes(c.rank));
  } else if (counts[0] === 2) {
    handRank = HandRank.ONE_PAIR;
    const pairRank = Number(Object.entries(rankCounts).find(([, v]) => v === 2)![0]);
    handCards = sortedCards.filter(c => c.rank === pairRank);
  } else {
    handRank = HandRank.HIGH_CARD;
    handCards = [sortedCards[0]]; // only the highest card
  }

  return { rank: handRank, name: HAND_NAMES[handRank], cards: handCards };
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
