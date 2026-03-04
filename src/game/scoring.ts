import type { HandResult, HandRankValue } from './hands';
import type { Card } from './deck';
import { CardModifier } from './deck';

interface ScoreConfig {
  base: number;     // level-1 base
  mult: number;     // multiplier (unchanged by upgrades)
  inc: number;      // chips added to base per upgrade level
}

// Base values at level 1. `inc` = how much base grows per additional level.
export const SCORE_TABLE: Record<HandRankValue, ScoreConfig> = {
  1:  { base: 5,   mult: 1, inc: 5  },   // High Card
  2:  { base: 10,  mult: 2, inc: 10 },   // One Pair
  3:  { base: 20,  mult: 2, inc: 15 },   // Two Pair
  4:  { base: 30,  mult: 3, inc: 20 },   // Three of a Kind
  5:  { base: 40,  mult: 4, inc: 25 },   // Straight
  6:  { base: 50,  mult: 4, inc: 30 },   // Flush
  7:  { base: 60,  mult: 4, inc: 40 },   // Full House
  8:  { base: 80,  mult: 7, inc: 50 },   // Four of a Kind
  9:  { base: 100, mult: 8, inc: 70 },   // Straight Flush
  10: { base: 120, mult: 8, inc: 120 },  // Royal Flush
};

// Base shop cost per hand rank (cost for level 1→2)
export const HAND_UPGRADE_BASE_COST: Record<HandRankValue, number> = {
  1:  20,
  2:  30,
  3:  40,
  4:  55,
  5:  70,
  6:  85,
  7:  100,
  8:  130,
  9:  160,
  10: 200,
};

/** Cost to upgrade a hand from its current level to level+1 */
export function handUpgradeCost(rank: HandRankValue, currentLevel: number): number {
  return Math.ceil(HAND_UPGRADE_BASE_COST[rank] * Math.pow(currentLevel, 1.5));
}

/** Effective base score for a hand at a given upgrade level */
export function handBaseAtLevel(rank: HandRankValue, level: number): number {
  const cfg = SCORE_TABLE[rank];
  return cfg.base + cfg.inc * (level - 1);
}

export interface ModifierResult {
  flatBonus: number;       // total flat chip bonus from modifiers
  multBonus: number;       // total mult factor from modifiers (1 = no change)
  cursedCardIds: string[]; // cards that need to be removed after scoring
}

/** Resolve all card modifier effects for scoring cards and selected-but-not-scoring cards */
export function resolveModifiers(
  scoringCards: Card[],   // cards participating in hand rank
  selectedCards: Card[],  // all selected cards (may be superset of scoring)
): ModifierResult {
  let flat = 0;
  let mult = 1;
  const cursedIds: string[] = [];

  // Find the effective modifier for Mimic — highest pip scoring card's modifier (excluding Mimic itself)
  const highestScoringCard = [...scoringCards].sort((a, b) => b.rank - a.rank)[0];
  const mimicTarget = highestScoringCard?.modifier !== CardModifier.MIMIC ? highestScoringCard?.modifier : undefined;

  const resolveCard = (card: Card, scoring: boolean) => {
    let mod = card.modifier;
    if (mod === CardModifier.MIMIC) mod = mimicTarget;
    if (!mod) return;

    if (scoring) {
      if (mod === CardModifier.POLISHED) flat += 10;
      if (mod === CardModifier.SCARRED)  flat += 15;
      if (mod === CardModifier.CHARGED)  flat += card.rank; // extra pip
      if (mod === CardModifier.HOT)      mult *= 1.5;
      if (mod === CardModifier.VOLATILE) flat += 50;
      if (mod === CardModifier.CURSED) { flat += 80; cursedIds.push(card.id); }
      // Ghost & Wild don't add chips, they affect evaluation upstream
    } else {
      // Selected but NOT in scoring hand
      if (mod === CardModifier.VOLATILE) flat -= 20;
    }
  };

  const scoringIds = new Set(scoringCards.map(c => c.id));
  for (const card of selectedCards) {
    resolveCard(card, scoringIds.has(card.id));
  }

  return { flatBonus: flat, multBonus: mult, cursedCardIds: cursedIds };
}

// Returns base score WITHOUT scratch multiplier — scratch is applied as a chain step
export function chipValue(
  hand: HandResult,
  _cards: Card[],
  handLevels?: Record<number, number>,
): number {
  const config = SCORE_TABLE[hand.rank];
  const level = handLevels?.[hand.rank] ?? 1;
  const base = handBaseAtLevel(hand.rank, level);
  // Only cards that participate in the hand contribute pip values (Balatro-style)
  // CHARGED cards get double pip value
  const cardSum = hand.cards.reduce((sum, c) => {
    const pip = c.modifier === CardModifier.CHARGED ? c.rank * 2 : c.rank;
    return sum + pip;
  }, 0);
  return Math.floor((base + cardSum) * config.mult);
}
