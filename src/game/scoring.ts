import type { HandResult, HandRankValue } from './hands';
import type { Card } from './deck';

interface ScoreConfig {
  base: number;
  mult: number;
}

const SCORE_TABLE: Record<HandRankValue, ScoreConfig> = {
  1:  { base: 5,   mult: 1 },
  2:  { base: 10,  mult: 2 },
  3:  { base: 20,  mult: 2 },
  4:  { base: 30,  mult: 3 },
  5:  { base: 40,  mult: 4 },
  6:  { base: 50,  mult: 4 },
  7:  { base: 60,  mult: 4 },
  8:  { base: 80,  mult: 7 },
  9:  { base: 100, mult: 8 },
  10: { base: 120, mult: 8 },
};

export function chipValue(hand: HandResult, cards: Card[], multiplier = 1): number {
  const config = SCORE_TABLE[hand.rank];
  const cardSum = cards.reduce((sum, c) => sum + c.rank, 0);
  return Math.floor((config.base + cardSum) * config.mult * multiplier);
}
