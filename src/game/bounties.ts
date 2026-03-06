import type { HandRankValue } from './hands';
import { HandRank } from './hands';
import { nextInt, shuffleWithRng } from './rng';

export const BountyCondition = {
  PLAY_HAND_RANK:     'PLAY_HAND_RANK',     // play a hand of X rank or better
  KEEP_SKIM_UNDER:    'KEEP_SKIM_UNDER',    // end round with skim rate under X%
  HANDS_REMAINING:    'HANDS_REMAINING',    // fill vault with X+ hands remaining
  USE_CONSUMABLE:     'USE_CONSUMABLE',     // use any consumable this round
  NO_DISCARD:         'NO_DISCARD',         // don't discard any hands
  SCORE_IN_ONE:       'SCORE_IN_ONE',       // score 200+ chips in a single hand
} as const;

export type BountyConditionType = typeof BountyCondition[keyof typeof BountyCondition];

export const BountyReward = {
  CHIPS:          'CHIPS',          // flat chip reward
  VAULT_REDUCE:   'VAULT_REDUCE',   // reduce vault target by flat amount
  SKIM_BOOST:     'SKIM_BOOST',     // permanent +5% skim rate
  EXTRA_HAND:     'EXTRA_HAND',     // +1 hand next round
} as const;

export type BountyRewardType = typeof BountyReward[keyof typeof BountyReward];

export interface Bounty {
  id: string;
  title: string;
  description: string;
  condition: BountyConditionType;
  conditionValue: number;  // rank threshold, skim %, hands remaining, chip threshold
  reward: BountyRewardType;
  rewardValue: number;
  rewardLabel: string;
  fee: number;            // chips to accept this bounty
  accepted: boolean;
  completed: boolean;
}

export const BOUNTY_POOL: Omit<Bounty, 'id' | 'accepted' | 'completed'>[] = [
  {
    title: 'High Roller',
    description: 'Goal: Play at least a Flush this round (any hand ≥ Flush counts).',
    condition: BountyCondition.PLAY_HAND_RANK,
    conditionValue: HandRank.FLUSH,
    reward: BountyReward.CHIPS,
    rewardValue: 80,
    rewardLabel: '+80 chips',
    fee: 15,
  },
  {
    title: 'Full Send',
    description: 'Goal: Play at least a Full House this round.',
    condition: BountyCondition.PLAY_HAND_RANK,
    conditionValue: HandRank.FULL_HOUSE,
    reward: BountyReward.CHIPS,
    rewardValue: 120,
    rewardLabel: '+120 chips',
    fee: 20,
  },
  {
    title: 'Royal Treatment',
    description: 'Goal: Play at least Four of a Kind this round.',
    condition: BountyCondition.PLAY_HAND_RANK,
    conditionValue: HandRank.FOUR_OF_A_KIND,
    reward: BountyReward.CHIPS,
    rewardValue: 200,
    rewardLabel: '+200 chips',
    fee: 35,
  },
  {
    title: 'The Straight',
    description: 'Goal: Play at least a Straight this round.',
    condition: BountyCondition.PLAY_HAND_RANK,
    conditionValue: HandRank.STRAIGHT,
    reward: BountyReward.VAULT_REDUCE,
    rewardValue: 40,
    rewardLabel: 'Vault −40',
    fee: 10,
  },
  {
    title: 'Honest Work',
    description: 'Goal: End round with vault filled and skim strictly under 15%.',
    condition: BountyCondition.KEEP_SKIM_UNDER,
    conditionValue: 15,
    reward: BountyReward.CHIPS,
    rewardValue: 100,
    rewardLabel: '+100 chips',
    fee: 5,
  },
  {
    title: 'Efficient',
    description: 'Goal: Fill vault with at least 3 hands left this round.',
    condition: BountyCondition.HANDS_REMAINING,
    conditionValue: 3,
    reward: BountyReward.EXTRA_HAND,
    rewardValue: 1,
    rewardLabel: '+1 hand next round',
    fee: 15,
  },
  {
    title: 'Speed Run',
    description: 'Goal: Fill vault with at least 5 hands left this round.',
    condition: BountyCondition.HANDS_REMAINING,
    conditionValue: 5,
    reward: BountyReward.CHIPS,
    rewardValue: 150,
    rewardLabel: '+150 chips',
    fee: 30,
  },
  {
    title: 'Lucky Break',
    description: 'Goal: Use any consumable at least once this round.',
    condition: BountyCondition.USE_CONSUMABLE,
    conditionValue: 1,
    reward: BountyReward.CHIPS,
    rewardValue: 50,
    rewardLabel: '+50 chips',
    fee: 5,
  },
  {
    title: 'Steady Hands',
    description: 'Goal: Fill vault this round without discarding even once.',
    condition: BountyCondition.NO_DISCARD,
    conditionValue: 0,
    reward: BountyReward.VAULT_REDUCE,
    rewardValue: 30,
    rewardLabel: 'Vault −30',
    fee: 10,
  },
  {
    title: 'Big Hand',
    description: 'Goal: Score at least 250 chips in one hand this round.',
    condition: BountyCondition.SCORE_IN_ONE,
    conditionValue: 250,
    reward: BountyReward.SKIM_BOOST,
    rewardValue: 5,
    rewardLabel: 'Skim +5%',
    fee: 20,
  },
];

export function generateBounties(round: number, rngState?: number): Bounty[] | { bounties: Bounty[]; rngState: number } {
  const pool = round === 1
    ? BOUNTY_POOL.filter(b => b.condition !== BountyCondition.PLAY_HAND_RANK || b.conditionValue <= HandRank.FLUSH)
    : BOUNTY_POOL;

  if (rngState === undefined) {
    const fallback = shuffleWithRng(Date.now() >>> 0, pool).value;
    return fallback.slice(0, 3).map((b, i) => ({ ...b, id: `bounty-${round}-${i}-${Date.now()}-${i}`, accepted: false, completed: false }));
  }

  const shuffled = shuffleWithRng(rngState, pool);
  let s = shuffled.state;
  const selected = shuffled.value.slice(0, 3).map((b, i) => {
    const token = nextInt(s, 0x7fffffff);
    s = token.state;
    return { ...b, id: `bounty-${round}-${i}-${token.value.toString(36)}`, accepted: false, completed: false };
  });
  return { bounties: selected, rngState: s };
}

export function checkBountyCondition(
  bounty: Bounty,
  context: {
    handRank?: HandRankValue;
    handScore?: number;
    skimRate?: number;
    handsRemaining?: number;
    usedConsumable?: boolean;
    discarded?: boolean;
    vaultFilled?: boolean;
  }
): boolean {
  if (!bounty.accepted || bounty.completed) return false;

  switch (bounty.condition) {
    case BountyCondition.PLAY_HAND_RANK:
      return (context.handRank ?? 0) >= bounty.conditionValue;

    case BountyCondition.SCORE_IN_ONE:
      return (context.handScore ?? 0) >= bounty.conditionValue;

    case BountyCondition.USE_CONSUMABLE:
      return context.usedConsumable === true;

    case BountyCondition.KEEP_SKIM_UNDER:
      return context.vaultFilled === true && (context.skimRate ?? 100) * 100 < bounty.conditionValue;

    case BountyCondition.HANDS_REMAINING:
      return context.vaultFilled === true && (context.handsRemaining ?? 0) >= bounty.conditionValue;

    case BountyCondition.NO_DISCARD:
      return context.vaultFilled === true && context.discarded === false;

    default:
      return false;
  }
}
